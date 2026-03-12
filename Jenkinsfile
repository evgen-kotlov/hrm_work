pipeline {
    // Корневой агент — узел с Docker (метка 'docker-agent')
    agent { label 'docker-agent' }

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

        // Все шаги, требующие Node.js/Playwright, выполняются внутри официального контейнера
        stage('Run Tests inside Playwright container') {
            agent {
                docker {
                    image 'mcr.microsoft.com/playwright:v1.58.2-noble'
                    reuseNode true          // использует тот же узел и рабочую область
                    args '--user root'
                }
            }
            stages {
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
        }

        stage('Generate Allure Report') {
            steps {
                script {
                    sh '''
                        if [ -d "allure-results" ]; then
                            echo "Генерация Allure отчёта с помощью Docker-образа..."
                            docker run --rm -v $(pwd):/workspace -w /workspace allure/allure:2.32.0 allure generate allure-results --clean -o allure-report
                        else
                            echo "Папка allure-results не найдена, пропускаем генерацию Allure"
                        fi
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                // Публикация JUnit отчёта (если настроен в playwright.config.ts)
                junit allowEmptyResults: true, testResults: 'test-results/junit-report.xml'

                // Публикация HTML-отчёта Playwright
                publishHTML(target: [
                    reportName: 'Playwright HTML Report',
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    keepAll: true,
                    allowMissing: true
                ])

                // Публикация сгенерированного Allure отчёта как HTML (через HTML Publisher)
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
                archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true

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