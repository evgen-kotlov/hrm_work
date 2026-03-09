pipeline {
    agent { label 'qatech_agent' }
    parameters {
        choice(
            name: 'TEST_TAG',
            choices: ['smoke', 'regress', 'all'],
            description: 'Выберите набор тестов для запуска: smoke, regress или все.'
        )
    }
    environment {
        PLAYWRIGHT_BROWSERS_PATH = "${WORKSPACE}/ms-playwright"
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install System Dependencies') {
            steps {
                sh '''
                    set -e
                    echo "=== Обновление списка пакетов и установка зависимостей для браузера ==="
                    apt-get update
                    apt-get install -y \
                        libnss3 \
                        libnspr4 \
                        libatk1.0-0t64 \
                        libatk-bridge2.0-0t64 \
                        libcups2t64 \
                        libdrm2 \
                        libxkbcommon0 \
                        libxcomposite1 \
                        libxdamage1 \
                        libxfixes3 \
                        libxrandr2 \
                        libgbm1 \
                        libpango-1.0-0 \
                        libcairo2 \
                        libasound2t64 \
                        libatspi2.0-0t64 \
                        libgtk-3-0t64 \
                        libxcursor1 \
                        libxi6 \
                        libxrender1 \
                        libxss1 \
                        libxtst6 \
                        libxcb-shm0 \
                        fonts-noto-color-emoji \
                        fonts-unifont \
                        xvfb
                '''
            }
        }
        stage('Setup Node') {
            steps {
                sh '''
                    set -e
                    echo "=== Установка nvm ==="
                    if [ ! -d "$HOME/.nvm" ]; then
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                    fi
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

                    echo "=== Установка Node.js 24.14.0 ==="
                    nvm install 24.14.0
                    nvm use 24.14.0
                    node --version
                    npm --version
                '''
            }
        }
        stage('Install Node Dependencies') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                    nvm use 24.14.0

                    echo "=== Установка зависимостей проекта ==="
                    npm ci
                '''
            }
        }
        stage('Install Playwright Browsers') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                    nvm use 24.14.0

                    echo "=== Установка браузеров Playwright ==="
                    npx playwright install chromium
                '''
            }
        }
        stage('Run Tests') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                    nvm use 24.14.0

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
            script {
                node(env.NODE_NAME) {
                    echo '=== Публикация отчетов и архивация артефактов ==='
                    sh '''
                        echo "Содержимое рабочей области:"
                        ls -la
                        if [ -d "playwright-report" ]; then
                            echo "✅ Папка playwright-report найдена"
                        else
                            echo "❌ Папка playwright-report отсутствует"
                        fi
                    '''
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
            }
        }
        failure {
            echo '❌ Тесты упали. Подробности в отчете выше.'
        }
        success {
            echo '✅ Все тесты прошли успешно!'
        }
    }
}