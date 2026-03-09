// Jenkinsfile для запуска Playwright тестов с подробной установкой браузеров
pipeline {
    agent any
    parameters {
        choice(
            name: 'TEST_TAG',
            choices: ['smoke', 'regress', 'all'],
            description: 'Выберите набор тестов для запуска: smoke, regress или все.'
        )
    }
    environment {
        // Переопределяем путь для кэша браузеров, чтобы избежать проблем с правами в ~/.cache
        PLAYWRIGHT_BROWSERS_PATH = "${WORKSPACE}/ms-playwright"
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Setup and Run Tests') {
            steps {
                sh '''#!/bin/bash
                    set -e  # останавливать скрипт при любой ошибке

                    echo "=== Установка nvm ==="
                    if [ ! -d "$HOME/.nvm" ]; then
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                    fi
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

                    echo "=== Установка Node.js 24.14.0 ==="
                    nvm install 24.14.0
                    nvm use 24.14.0
                    echo "Node version: $(node --version)"
                    echo "NPM version: $(npm --version)"

                    echo "=== Установка зависимостей проекта ==="
                    npm ci  # или npm install, если package-lock.json отсутствует

                    echo "=== Установка браузеров Playwright в ${PLAYWRIGHT_BROWSERS_PATH} ==="
                    npx playwright install --with-deps chromium --verbose

                    echo "=== Проверка установленных браузеров ==="
                    ls -la ${PLAYWRIGHT_BROWSERS_PATH} || echo "Папка браузеров не создана"

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
        failure {
            echo '❌ Тесты упали. Подробности в отчете выше.'
        }
        success {
            echo '✅ Все тесты прошли успешно!'
        }
    }
}