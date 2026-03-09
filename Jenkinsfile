// Jenkinsfile
pipeline {
    // Запускаем на любом доступном агенте Jenkins
    agent any

    // Используем Node.js, который мы настроили на шаге 1
    tools {
        nodejs 'NodeJS_20.04.0' // Убедитесь, что имя совпадает с настроенным в Jenkins
    }

    // Параметры, которые можно будет выбирать при запуске сборки вручную
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
                // Забираем код из репозитория, который настроен в задаче
                checkout scm
            }
        }
        stage('Setup Node') {
    steps {
        sh '''
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            nvm install 20
            nvm use 20
            node --version
            npm --version
        '''
    }
}

        stage('Install Dependencies') {
            steps {
                // Устанавливаем зависимости из package-lock.json для надежности и скорости [citation:4]
                sh 'npm ci'
                // Устанавливаем браузеры Playwright и все необходимые системные зависимости для CI-окружения [citation:4]
                sh 'npx playwright install --with-deps chromium' // Можно указать только нужный браузер
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Определяем команду для запуска в зависимости от выбранного параметра TEST_TAG
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
                    // Запускаем тесты. Флаг --reporter=list,html гарантирует генерацию отчета [citation:9]
                    // Мы используем команду из package.json, которая уже настроена на ваши репортеры.
                    sh testCommand
                }
            }
        }
    }

    post {
        always {
            // Действия, которые выполняются всегда, даже если сборка упала
            echo 'Публикация отчетов и архивация артефактов...'

            // Публикуем HTML-отчет Playwright прямо в интерфейсе Jenkins [citation:2][citation:9]
            publishHTML(target: [
                reportName: 'Playwright HTML Report',
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                keepAll: true,
                allowMissing: true
            ])

            // Архивируем сырые результаты для возможности скачать их позже
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true // если у вас есть такая папка
            // Для Allure результаты
            archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true

            // Если вы настроили JUnit-репортер, можно опубликовать и его результаты
            // junit 'test-results/**/*.xml'

            // Очищаем рабочее пространство, чтобы не занимать место на диске (опционально)
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