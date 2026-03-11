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
                // Генерация Allure-отчёта на агенте (вне контейнера)
                node('docker-agent') {
                    // Проверяем, есть ли allure-results
                    sh '''
                        if [ -d "allure-results" ]; then
                            echo "✅ Allure results найдены"
                        else
                            echo "❌ Allure results отсутствуют, пропускаем генерацию"
                            exit 0
                        fi
                    '''
                    // Генерация отчёта (требуется Allure CLI на агенте)
                    // Способ 1: через установленный Allure CLI (если есть)
                    sh 'allure generate allure-results -o allure-report --clean || true'
                    
                    // Способ 2: через Docker (если Allure CLI не установлен)
                    // sh 'docker run --rm -v $(pwd):/workspace -w /workspace allure/allure:2.32.0 allure generate allure-results -o allure-report --clean'
                }

                // Публикация HTML-отчёта Playwright
                publishHTML(target: [
                    reportName: 'Playwright HTML Report',
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    keepAll: true,
                    allowMissing: true
                ])

                // Публикация Allure-отчёта (через плагин)
                allure([
                    includeProperties: false,
                    jdk: '',
                    properties: [],
                    reportBuildPolicy: 'ALWAYS',
                    results: [[path: 'allure-results']]
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