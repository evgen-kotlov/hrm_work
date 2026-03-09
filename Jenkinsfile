pipeline {
    agent any
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
        stage('Setup and Run Tests') {
            steps {
                sh '''#!/bin/bash
                    # Установка nvm, если не установлен
                    if [ ! -d "$HOME/.nvm" ]; then
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                    fi
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                    
                    # Установка Node.js версии 24.14.0 (если доступна)
                    nvm install 24.14.0
                    nvm use 24.14.0
                    node --version
                    npm --version

                    # Установка зависимостей (требуется package-lock.json)
                    npm ci

                    # Запуск тестов в зависимости от параметра
                    case "$TEST_TAG" in
                        smoke) npm run test:smoke ;;
                        regress) npm run test:regress ;;
                        *) npm test ;;
                    esac
                '''
            }
        }
    }
    post {
        always {
            echo 'Публикация отчетов и архивация артефактов...'
            publishHTML(target: [
                reportName: 'Playwright HTML Report',
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                keepAll: true,
                allowMissing: true
            ])
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true
            cleanWs()
        }
        failure {
            echo 'Тесты упали. Подробности в отчете выше.'
        }
        success {
            echo 'Все тесты прошли успешно!'
        }
    }
}