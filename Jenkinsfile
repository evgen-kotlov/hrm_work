// Jenkinsfile для запуска Playwright-тестов в Docker-контейнере с официальным образом Playwright
pipeline {
    // Используем Docker-агент на основе официального образа Playwright
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.58.2-jammy'
            // Можно добавить аргументы, например, для запуска от root (если нужны особые права)
            args '--user root'
        }
    }

    // Параметры сборки, доступные при ручном запуске
    parameters {
        choice(
            name: 'TEST_TAG',
            choices: ['smoke', 'regress', 'all'],
            description: 'Выберите набор тестов для запуска: smoke (дымовые), regress (регрессионные) или все.'
        )
    }

    // Основные этапы сборки
    stages {
        // Этап 1: Клонирование репозитория
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // Этап 2: Установка зависимостей и запуск тестов
        stage('Run Tests') {
            steps {
                sh '''
                    set -e  # прерывать выполнение при любой ошибке
                    echo "=== Информация об окружении ==="
                    echo "Node version: $(node --version)"
                    echo "NPM version: $(npm --version)"
                    echo "Playwright version: $(npx playwright --version)"

                    echo "=== Установка зависимостей проекта ==="
                    # Используем npm ci, так как в репозитории должен быть package-lock.json
                    # Если lock-файла нет, замените на npm install
                    npm ci

                    echo "=== Запуск тестов с тегом: $TEST_TAG ==="
                    case "$TEST_TAG" in
                        smoke)   npm run test:smoke ;;
                        regress) npm run test:regress ;;
                        *)       npm test ;;
                    esac
                '''
            }
        }
    }

    // Действия после завершения всех этапов (всегда выполняются)
    post {
        always {
            echo '=== Публикация отчетов и архивация артефактов ==='
            // Публикация HTML-отчёта Playwright
            publishHTML(target: [
                reportName: 'Playwright HTML Report',
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                keepAll: true,
                allowMissing: true
            ])
            // Архивация папки с отчётом Playwright
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
            // Архивация результатов Allure (если используются)
            archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true
            // Очистка рабочего пространства для экономии места
            cleanWs()
        }
        failure {
            echo '❌ Тесты упали. Подробности в отчете выше.'
        }
        success {
            echo '✅ Все тесты прошли успешно!'
        }
    }
}