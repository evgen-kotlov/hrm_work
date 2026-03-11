pipeline {
    // Весь pipeline выполняется внутри Docker-контейнера на агенте с меткой 'docker-agent'
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.58.2-noble'
            label 'docker-agent'        // контейнер запустится именно на этом узле
            args '--user root'          // опционально, если нужны права на запись
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
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
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
            // Публикация отчётов – они уже в рабочей области контейнера
            publishHTML(target: [
                reportName: 'Playwright HTML Report',
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                keepAll: true,
                allowMissing: true
            ])
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true
            cleanWs()
        }
        failure {
            echo '❌ Тесты упали. Подробности в отчёте.'
        }
        success {
            echo '✅ Все тесты прошли успешно!'
        }
    }
}