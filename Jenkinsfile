pipeline {
    agent any

    tools {
        nodejs 'NodeJS_24.14.0'   // имя инструмента из глобальной конфигурации Jenkins
    }

    environment {
        CI = 'true'
        // Версия Playwright образа должна совпадать с версией @playwright/test в package.json
        PLAYWRIGHT_IMAGE = 'mcr.microsoft.com/playwright:v1.58.2-jammy'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                // Устанавливаем зависимости на хосте Jenkins (агента)
                // Они не будут использоваться для запуска тестов в контейнере,
                // но могут пригодиться для линтеров или дополнительных шагов.
                // Если не нужны – этот stage можно пропустить.
                sh 'npm ci'
            }
        }

        stage('Run Playwright tests') {
            steps {
                script {
                    // Запускаем тесты в контейнере Playwright
                    // Пробрасываем текущую директорию (код проекта) как /work
                    // и выполняем npm ci + тесты.
                    sh """
                        docker run --rm \
                            -v \$(pwd):/work \
                            -w /work \
                            -e CI=true \
                            \${PLAYWRIGHT_IMAGE} \
                            sh -c "npm ci && npx playwright test"
                    """
                }
            }
            post {
    always {
        junit 'test-results/junit-report.xml'

        publishHTML([
            reportDir: 'playwright-report',
            reportFiles: 'index.html',
            reportName: 'Playwright HTML Report',
            allowMissing: false,
            keepAll: true,
            alwaysLinkToLastBuild: true
        ])

        allure([
            includeProperties: false,
            jdk: '',
            properties: [],
            reportBuildPolicy: 'ALWAYS',
            results: [[path: 'allure-results']]
        ])

        archiveArtifacts artifacts: 'test-results/**/*, playwright-report/**/*, allure-results/**/*', fingerprint: true
    }
}
        }
    }
}