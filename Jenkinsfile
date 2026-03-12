pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.58.2-noble'
            label 'docker-agent'
            args '--user root'
        }
    }

    parameters {
        choice(
            name: 'TEST_TAG',
            choices: ['smoke', 'regress', 'all'],
            description: 'Выберите набор тестов для запуска: smoke, regress или все.'
        )
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Install Dependencies') {
            steps { sh 'npm ci' }
        }

        stage('Run Tests') {
            steps {
                sh """
                    set -e
                    echo "Запуск тестов с тегом: $TEST_TAG"
                    case "$TEST_TAG" in
                        smoke)   npm run test:smoke ;;
                        regress) npm run test:regress ;;
                        *)       npm test ;;
                    esac
                """
            }
        }
    }

    post {
        always {
            script {
                // Генерация Allure отчёта вне контейнера Playwright (на агенте)
                node('docker-agent') {
                    sh '''
                        if [ -d "allure-results" ]; then
                            echo "Генерация Allure отчёта с помощью Docker-образа..."
                            docker run --rm -v $(pwd):/workspace -w /workspace allure/allure:2.32.0 allure generate allure-results --clean -o allure-report
                        else
                            echo "Папка allure-results не найдена, пропускаем генерацию Allure"
                        fi
                    '''
                }

                // Публикация HTML-отчёта Playwright
                publishHTML(target: [
                    reportName: 'Playwright HTML Report',
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    keepAll: true,
                    allowMissing: true
                ])

                // Публикация сгенерированного Allure отчёта как HTML
                publishHTML(target: [
                    reportName: 'Allure Report',
                    reportDir: 'allure-report',
                    reportFiles: 'index.html',
                    keepAll: true,
                    allowMissing: true
                ])

                // Архивация артефактов
                archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
                archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true
                archiveArtifacts artifacts: 'allure-report/**', allowEmptyArchive: true

                cleanWs()
            }
        }
        failure {
            echo '❌ Тесты упали. Подробности в отчёте.'
        }
        success {
            echo '✅ Все тесты прошли успешно!'
        }
    }
}