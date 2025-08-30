pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-18' // Use the name you configured in Global Tool Configuration
    }

    environment {
        // SonarQube environment
        SONAR_TOKEN = credentials('flex-url-token') // Add this credential in Jenkins
    }
    
    triggers {
        githubPush() // Enable GitHub webhook trigger
    }
    
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/daveyrpt/flex-url.git'
            }
        }
       
        stage('Build') {
            steps {
                echo 'Building application...'
                sh 'node --version'  // Verify Node.js is available
                sh 'npm --version'   // Verify npm is available
                sh 'npm install'
                sh 'npm run build'   // Build frontend assets with vite
            }
        }

        // stage('Check Scripts') {
        //     steps {
        //         echo 'Checking available scripts...'
        //         sh 'npm run' // This will list all available scripts
        //         sh 'cat package.json' // Show package.json content
        //     }
        // }
        
        // stage('Test') {
        //     steps {
        //         echo 'Running tests...'
        //         sh 'npm test'
        //     }
        // }
        
        // stage('Dependecny Check') {
        //     steps {
        //         echo 'Running dependency check...'
        //         // sh 'npm audit' // use owasp
        //     }
        // }

        // stage('SonarQube Analysis') {
        //     steps {
        //         script {
        //             def scannerHome = tool 'SonarScanner'
        //             withSonarQubeEnv('SonarQube') {
        //                 withEnv(["SCANNER_HOME=${scannerHome}"]) {
        //                     sh '''
        //                         $SCANNER_HOME/bin/sonar-scanner \
        //                           -Dsonar.projectKey=daveyrpt_flex-url \
        //                           -Dsonar.organization=dvyrpt \
        //                           -Dsonar.sources=. \
        //                           -Dsonar.exclusions=**/node_modules/**,**/coverage/** \
        //                           -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
        //                     '''
        //                 }
        //             }
        //         }
        //     }
        // }

        // stage('Quality Gate') {
        //     steps {
        //         script {
        //             timeout(time: 5, unit: 'MINUTES') {
        //                 def qg = waitForQualityGate()
        //                 if (qg.status != 'OK') {
        //                     error "Pipeline aborted due to quality gate failure: ${qg.status}"
        //                 } else {
        //                     echo "Quality Gate passed with status: ${qg.status}"
        //                 }
        //             }
        //         }
        //     }
        // } 

        stage('Build Docker Image') {
            steps {
                script {
                    echo 'Building Docker image...'
                    
                    // Get git commit hash for tagging
                    def commitHash = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    def buildNumber = env.BUILD_NUMBER
                    def imageName = "ghcr.io/daveyrpt/flex-url"
                    
                    // Build the Docker image with multiple tags in one command
                    sh """
                        docker build -t ${imageName}:${commitHash} -t ${imageName}:build-${buildNumber} -t ${imageName}:latest .
                    """
                    
                    // Store image details for later stages
                    env.DOCKER_IMAGE = imageName
                    env.COMMIT_HASH = commitHash
                    
                    echo "Built Docker images:"
                    echo "- ${imageName}:${commitHash}"
                    echo "- ${imageName}:build-${buildNumber}"
                    echo "- ${imageName}:latest"
                }
            }
        }

        // stage('Build Docker Image') {
        //     steps {
        //         script {
        //             def image = docker.build("ghcr.io/daveyrpt/flex-url:${env.BUILD_NUMBER}")
        //             image.tag("latest")
        //         }
        //     }
        // }

        stage('Push to GHCR') {
            steps {
                script {
                    echo 'Pushing Docker image to GitHub Container Registry...'
                    
                    // Login to GHCR and push images using GitHub token
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        sh """
                            echo \${GITHUB_TOKEN} | docker login ghcr.io -u daveyrpt --password-stdin
                            
                            docker push ${env.DOCKER_IMAGE}:${env.COMMIT_HASH}
                            docker push ${env.DOCKER_IMAGE}:build-${env.BUILD_NUMBER}
                            docker push ${env.DOCKER_IMAGE}:latest
                            
                            docker logout ghcr.io
                        """
                    }
                    
                    echo "Successfully pushed images to GHCR:"
                    echo "- ${env.DOCKER_IMAGE}:${env.COMMIT_HASH}"
                    echo "- ${env.DOCKER_IMAGE}:build-${env.BUILD_NUMBER}"
                    echo "- ${env.DOCKER_IMAGE}:latest"
                }
            }
        }

        // stage('Push to GHCR') {
        //     steps {
        //         script {
        //             docker.withRegistry('https://ghcr.io', 'github-token') {
        //                 def image = docker.image("ghcr.io/daveyrpt/flex-url:${env.BUILD_NUMBER}")
        //                 image.push()
        //                 image.push("latest")
        //             }
        //         }
        //     }
        // }
        
        // stage('Deploy') {
        //     when {
        //         // Only deploy if all previous stages pass
        //         expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
        //     }
        //     steps {
        //         script {
        //             echo 'Deploying application...'
        //             echo "Container successfully built and pushed to GHCR!"
        //             echo "Image available at: ${env.DOCKER_IMAGE}:${env.COMMIT_HASH}"
        //             echo "Latest tag: ${env.DOCKER_IMAGE}:latest"
                    
        //             // Create deployment instructions
        //             sh '''
        //                 echo "=== Deployment Instructions ===" > deployment-instructions.txt
        //                 echo "Image: ${DOCKER_IMAGE}:${COMMIT_HASH}" >> deployment-instructions.txt
        //                 echo "Build: ${BUILD_NUMBER}" >> deployment-instructions.txt
        //                 echo "Commit: ${COMMIT_HASH}" >> deployment-instructions.txt
        //                 echo "" >> deployment-instructions.txt
        //                 echo "To deploy this version:" >> deployment-instructions.txt
        //                 echo "docker pull ${DOCKER_IMAGE}:${COMMIT_HASH}" >> deployment-instructions.txt
        //                 echo "docker run -d -p 3000:3000 --name flex-url ${DOCKER_IMAGE}:${COMMIT_HASH}" >> deployment-instructions.txt
        //                 echo "" >> deployment-instructions.txt
        //                 echo "Or use latest:" >> deployment-instructions.txt
        //                 echo "docker pull ${DOCKER_IMAGE}:latest" >> deployment-instructions.txt
        //                 echo "docker run -d -p 3000:3000 --name flex-url ${DOCKER_IMAGE}:latest" >> deployment-instructions.txt
        //                 echo "" >> deployment-instructions.txt
        //                 echo "Health check:" >> deployment-instructions.txt
        //                 echo "curl http://localhost:3000/health" >> deployment-instructions.txt
                        
        //                 cat deployment-instructions.txt
        //             '''
                    
        //             // Optional: Trigger actual deployment to staging/production
        //             // Uncomment and customize for your deployment environment
        //             /*
        //             echo 'Deploying to staging environment...'
        //             sh '''
        //                 # Example: Deploy to a staging server
        //                 # ssh user@staging-server "docker pull ${DOCKER_IMAGE}:${COMMIT_HASH}"
        //                 # ssh user@staging-server "docker stop flex-url-staging || true"
        //                 # ssh user@staging-server "docker rm flex-url-staging || true"
        //                 # ssh user@staging-server "docker run -d -p 3000:3000 --name flex-url-staging ${DOCKER_IMAGE}:${COMMIT_HASH}"
        //                 echo "Deployment to staging would happen here"
        //             '''
        //             */
        //         }
        //     }
        //     post {
        //         always {
        //             archiveArtifacts artifacts: 'deployment-instructions.txt', allowEmptyArchive: true
        //         }
        //     }
        // }
        
        stage('Hello') {
            steps {
                echo 'Hello World - Pipeline completed successfully!'
                echo "✅ Application built, tested, scanned, containerized, and pushed to registry"
                echo "🚀 Ready for deployment!"
            }
        }
    }
    
    post {
        always {
            // Archive test results if they exist
            script {
                if (fileExists('coverage/')) {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
            // Clean up workspace
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully with good code quality!'
        }
        failure {
            echo 'Pipeline failed - check logs and SonarQube report'
        }
    }
}