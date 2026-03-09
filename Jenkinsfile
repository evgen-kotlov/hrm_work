pipeline {
    // Запускаем сборку в Docker-контейнере с официальным образом Playwright
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.58.2-jammy'
            args '--user root'  // опционально, если нужны права на запись
        }
    }

    // Параметры для выбора набора тестов
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
                    echo "=== Информация об окружении ==="
                    echo "Node version: $(node --version)"
                    echo "NPM version: $(npm --version)"
                    echo "Playwright version: $(npx playwright --version)"

                    echo "=== Установка зависимостей проекта ==="
                    npm ci   # или npm install, если нет package-lock.json

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
                // Явно указываем тот же узел, на котором выполнялась сборка,
                // чтобы шаги publishHTML и archiveArtifacts имели доступ к файловой системе.
                node(env.NODE_NAME) {
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
                    cleanWs()  // очистка рабочего пространства
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