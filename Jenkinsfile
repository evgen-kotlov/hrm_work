pipeline {
    agent { label 'docker-agent' }

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Run Playwright tests') {
            steps {
                sh 'npx playwright test'
            }
        }
    }

    post {
        always {
            // JUnit отчёт
            junit 'test-results/junit-report.xml'

            // HTML отчёт Playwright
            publishHTML([
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright HTML Report',
                allowMissing: false,
                keepAll: true,
                alwaysLinkToLastBuild: true
            ])

            // Allure отчёт (если используете)
            allure([
                includeProperties: false,
                jdk: '',
                properties: [],
                reportBuildPolicy: 'ALWAYS',
                results: [[path: 'allure-results']]
            ])

            // Архивация артефактов
            archiveArtifacts artifacts: 'test-results/**/*, playwright-report/**/*, allure-results/**/*', fingerprint: true
        }
    }
}