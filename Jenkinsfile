pipeline {
    agent any  // или укажите конкретный лейбл агента

    tools {
        nodejs 'NodeJS_24.14.0'  // если настроен инструмент NodeJS в Jenkins
    }

    stages {
        stage('Install dependencies') {
            steps {
                script {
                    sh 'npm install'
                    sh 'npx playwright install-deps'
                    sh 'npx playwright install'
                    sh 'npm install --save-dev allure-commandline'
                }
            }
        }

        stage('Run tests') {
            steps {
                script {
                    // Убедимся, что папка allure-results чиста перед запуском
                    sh 'rm -rf allure-results'
                    sh 'npx playwright test'
                }
            }
        }

        stage('Generate Allure report') {
            steps {
                script {
                    // Генерация HTML-отчёта (можно и не делать, если используем плагин)
                    sh 'npx allure generate allure-results --clean -o allure-report'
                }
            }
        }
    }

    post {
        always {
            // Архивируем результаты Allure как артефакты Jenkins (на всякий случай)
            archiveArtifacts artifacts: 'allure-results/**', fingerprint: true
            // Публикуем Allure-отчёт через плагин (он сам сгенерирует отчёт из allure-results)
            allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]
        }
    }
}