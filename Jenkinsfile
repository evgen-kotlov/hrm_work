pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.58.2-jammy'
            // аргументы не обязательны, но можно добавить при необходимости
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
        stage('Run Tests') {
            steps {
                sh '''
                    set -e
                    echo "Node version: $(node --version)"
                    echo "NPM version: $(npm --version)"
                    echo "Playwright version: $(npx playwright --version)"

                    # Установка зависимостей проекта (требуется package-lock.json)
                    npm ci

                    # Браузеры уже предустановлены в образе, поэтому команда install не нужна
                    # Запуск тестов в зависимости от выбранного параметра
                    case "$TEST_TAG" in
                        smoke)   npm run test:smoke ;;
                        regress) npm run test:regress ;;
                        *)       npm test ;;
                    esac
                '''
            }
        }
    }
    post {
        always {
            echo '=== Публикация отчетов и архивация артефактов ==='
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
        failure { echo '❌ Тесты упали. Подробности в отчете выше.' }
        success { echo '✅ Все тесты прошли успешно!' }
    }
}