pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS' // Укажите имя вашей Node.js установки в Jenkins
    }
    
    environment {
        CI = 'true'
        PLAYWRIGHT_BROWSERS_PATH = '0' // Использовать системные браузеры
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install dependencies') {
            steps {
                sh 'npm ci' // Используем ci для чистых установок
            }
        }
        
        stage('Install Playwright browsers') {
            steps {
                sh 'npx playwright install chromium --with-deps'
            }
        }
        
        stage('Run Playwright tests') {
            steps {
                script {
                    try {
                        sh 'npx playwright test'
                    } catch (error) {
                        // Тесты могут падать, но мы все равно хотим получить отчеты
                        echo "Tests failed, but continuing to generate reports..."
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
            post {
                always {
                    // Сохраняем HTML отчет
                    archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
                    
                    // Сохраняем JUnit отчет
                    junit 'test-results/junit-report.xml'
                    
                    // Сохраняем Allure результаты
                    allure([
                        includeProperties: false,
                        jdk: '',
                        properties: [],
                        reportBuildPolicy: 'ALWAYS',
                        results: [[path: 'allure-results']]
                    ])
                }
            }
        }
        
        stage('Generate Allure Report') {
            steps {
                script {
                    // Генерируем Allure отчет локально (опционально)
                    sh 'npx allure generate allure-results --clean -o allure-report'
                    archiveArtifacts artifacts: 'allure-report/**/*', allowEmptyArchive: true
                }
            }
        }
    }
    
    post {
        always {
            // Очистка (опционально)
            sh 'rm -rf node_modules playwright-report allure-results allure-report test-results || true'
        }
    }
}
