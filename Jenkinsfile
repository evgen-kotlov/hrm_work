pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.58.2-jammy'
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
                    echo "=== Информация об окружении ==="
                    node --version
                    npm --version
                    npx playwright --version

                    echo "=== Установка зависимостей ==="
                    npm ci

                    echo "=== Запуск тестов ==="
                    case "$TEST_TAG" in
                        smoke)   npm run test:smoke ;;
                        regress) npm run test:regress ;;
                        *)       npm test ;;
                    esac

                    echo "=== Проверка создания отчёта ==="
                    if [ -d "playwright-report" ]; then
                        echo "✅ Папка playwright-report существует"
                        ls -la playwright-report/
                    else
                        echo "❌ Папка playwright-report НЕ создана"
                        # Проверим, может быть отчёт в другом месте?
                        find . -name "index.html" -type f || true
                    fi
                '''
            }
        }
    }

    post {
        always {
            script {
                // Переключаемся на тот же узел, где выполнялась сборка
                node(env.NODE_NAME) {
                    echo '=== Публикация отчетов и архивация артефактов ==='
                    
                    // Дополнительная проверка перед публикацией
                    sh '''
                        echo "Содержимое рабочей области:"
                        ls -la
                        if [ -d "playwright-report" ]; then
                            echo "✅ Папка playwright-report найдена"
                        else
                            echo "❌ Папка playwright-report отсутствует"
                        fi
                    '''

                    // Публикация HTML-отчёта
                    publishHTML(target: [
                        reportName: 'Playwright HTML Report',
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        keepAll: true,
                        allowMissing: true
                    ])

                    // Архивация артефактов
                    archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true

                    // Очистка рабочей области
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