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
                    userRemoteConfigs: [[
                        url: 'https://github.com/evgen-kotlov/hrm_work.git',
                        credentialsId: '' // Оставьте пустым если публичный репозиторий
                    ]]
                ])
                
                // Альтернативный вариант через sh
                sh '''
                    git --version
                    if [ ! -d ".git" ]; then
                        echo "Cloning repository..."
                        git clone https://github.com/evgen-kotlov/hrm_work.git .
                    else
                        echo "Repository already exists, pulling updates..."
                        git pull origin main
                    fi
                '''
            }
        }
        
        stage('Setup Environment') {
            steps {
                script {
                    // Установка Allure
                    sh '''
                        echo "=== Installing Allure ==="
                        if [ ! -f "/usr/local/bin/allure" ]; then
                            wget -q https://github.com/allure-framework/allure2/releases/download/${ALLURE_VERSION}/allure-${ALLURE_VERSION}.tgz
                            tar -xzf allure-${ALLURE_VERSION}.tgz
                            rm allure-${ALLURE_VERSION}.tgz
                            ln -s $(pwd)/allure-${ALLURE_VERSION}/bin/allure /usr/local/bin/allure
                        else
                            echo "Allure already installed"
                        fi
                    '''
                    
                    // Проверка версий
                    sh '''
                        echo "=== Environment Info ==="
                        node --version
                        npm --version
                        npx playwright --version || echo "Playwright not installed yet"
                        allure --version || echo "Allure not in PATH"
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "=== Installing dependencies ==="
                    if [ -f "package.json" ]; then
                        npm ci --no-audit --prefer-offline
                        npx playwright install chromium --with-deps
                    else
                        echo "ERROR: package.json not found!"
                        exit 1
                    fi
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    try {
                        sh '''
                            echo "=== Running tests ==="
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
                        echo "=== Generating reports ==="
                        if [ -d "allure-results" ]; then
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
                        else
                            echo "No allure-results directory found"
                        fi
                    '''
                    
                    // Генерация HTML отчета Playwright
                    sh '''
                        if [ -d "playwright-report" ]; then
                            npx playwright show-report playwright-report || true
                        fi
                    '''
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
                echo "=== Cleanup and artifacts ==="
                // Сохраняем скриншоты и видео при падении
                if (currentBuild.result == 'FAILURE' || currentBuild.result == 'UNSTABLE') {
                    sh '''
                        echo "Saving screenshots and videos..."
                        find test-results -name "*.png" -o -name "*.webm" | head -20
                    '''
                    archiveArtifacts artifacts: 'test-results/**/*.png', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**/*.webm', allowEmptyArchive: true
                }
                
                // Очистка (сохраняем только отчеты)
                sh '''
                    echo "Cleaning up..."
                    rm -rf node_modules || true
                    rm -rf allure-${ALLURE_VERSION} || true
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
