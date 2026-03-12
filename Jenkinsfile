pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.40.0-focal'
            args '-u root:root --shm-size=2gb'
            reuseNode true
        }
    }
    
    environment {
        CI = 'true'
        PLAYWRIGHT_BROWSERS_PATH = '0'
        ALLURE_VERSION = '2.24.0'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    extensions: [],
                    userRemoteConfigs: [[url: 'https://github.com/your-repo/your-project.git']]
                ])
            }
        }
        
        stage('Setup Environment') {
            steps {
                script {
                    // Установка Allure
                    sh '''
                        wget -q https://github.com/allure-framework/allure2/releases/download/${ALLURE_VERSION}/allure-${ALLURE_VERSION}.tgz
                        tar -xzf allure-${ALLURE_VERSION}.tgz
                        rm allure-${ALLURE_VERSION}.tgz
                        ln -s $(pwd)/allure-${ALLURE_VERSION}/bin/allure /usr/local/bin/allure
                    '''
                    
                    // Проверка версий
                    sh '''
                        echo "=== Environment Info ==="
                        node --version
                        npm --version
                        npx playwright --version
                        allure --version
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    npm ci --no-audit --prefer-offline
                    npx playwright install chromium --with-deps
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    try {
                        sh '''
                            npx playwright test 
                                --reporter=line,allure-playwright,junit 
                                --output=test-results
                        '''
                    } catch (error) {
                        echo "Tests failed: ${error}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('Generate Reports') {
            steps {
                script {
                    // Генерация Allure отчета
                    sh '''
                        allure generate allure-results --clean -o allure-report
                        
                        # Создаем index.html для удобного просмотра
                        echo '<!DOCTYPE html>
                        <html>
                        <head>
                            <meta http-equiv="refresh" content="0; url=allure-report/index.html">
                            <title>Allure Report</title>
                        </head>
                        <body>
                            <p>Redirecting to <a href="allure-report/index.html">Allure Report</a></p>
                        </body>
                        </html>' > allure-index.html
                    '''
                    
                    // Генерация HTML отчета Playwright
                    sh 'npx playwright show-report playwright-report || true'
                }
            }
            post {
                always {
                    // Сохраняем все отчеты
                    archiveArtifacts artifacts: 'allure-report/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'allure-index.html', allowEmptyArchive: true
                    // Публикуем JUnit отчет
                    junit 'test-results/junit.xml'
                    
                    // Публикуем Allure отчет
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
    }
    
    post {
        always {
            script {
                // Сохраняем скриншоты и видео при падении
                if (currentBuild.result == 'FAILURE' || currentBuild.result == 'UNSTABLE') {
                    archiveArtifacts artifacts: 'test-results/**/*.png', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**/*.webm', allowEmptyArchive: true
                }
                
                // Очистка (сохраняем только отчеты)
                sh '''
                    rm -rf node_modules allure-${ALLURE_VERSION} || true
                    find . -name "*.log" -type f -delete || true
                '''
            }
            
            // Уведомления (опционально)
            emailext(
                subject: "Build ${currentBuild.result}: Job '${env.JOB_NAME}' (${env.BUILD_NUMBER})",
                body: "Проверьте сборку: ${env.BUILD_URL}",
                to: 'team@example.com',
                attachLog: true
            )
        }
        
        success {
            echo '✅ Все этапы выполнены успешно!'
        }
        
        failure {
            echo '❌ Сборка завершилась с ошибкой'
        }
        
        unstable {
            echo '⚠️ Сборка нестабильна (упали тесты)'
        }
    }
}
