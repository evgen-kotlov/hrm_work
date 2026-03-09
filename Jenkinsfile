pipeline {
    // Основной агент – узел с Docker, имеющий метку 'docker-agent'
    agent { label 'docker-agent' }

    // Параметры сборки для выбора набора тестов
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
                // Клонирование репозитория (используется настроенный SCM)
                checkout scm
            }
        }

        stage('Run Playwright Tests') {
            // Запускаем тесты внутри Docker-контейнера с Playwright
            agent {
                docker {
                    image 'mcr.microsoft.com/playwright:v1.58.2-noble'
                    // Можно добавить аргументы, если нужны особые права
                    args '--user root'
                }
            }
            steps {
                script {
                    // Определяем команду запуска тестов в зависимости от параметра
                    def testCommand = ''
                    switch (params.TEST_TAG) {
                        case 'smoke':
                            testCommand = 'npm run test:smoke'
                            break
                        case 'regress':
                            testCommand = 'npm run test:regress'
                            break
                        case 'all':
                        default:
                            testCommand = 'npm test'
                    }

                    sh """
                        set -e
                        echo "Node version: \$(node --version)"
                        echo "NPM version: \$(npm --version)"
                        echo "Playwright version: \$(npx playwright --version)"

                        echo "Установка зависимостей..."
                        npm ci

                        echo "Запуск тестов..."
                        ${testCommand}
                    """
                }
            }
        }
    }

    post {
        always {
            // Действия, выполняемые всегда (публикация отчётов, архивация)
            script {
                // Возвращаемся на основной агент, чтобы иметь доступ к рабочей области
                node('docker-agent') {
                    echo 'Публикация отчетов и архивация артефактов...'

                    // Проверка наличия папки с отчётом
                    sh '''
                        if [ -d "playwright-report" ]; then
                            echo "✅ Папка playwright-report найдена"
                        else
                            echo "❌ Папка playwright-report отсутствует"
                        fi
                    '''

                    // Публикация HTML-отчёта Playwright
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

                    // Очистка рабочей области (опционально)
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