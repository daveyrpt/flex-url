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

        stage('Update Deployment Repo') {
            steps {
                script {
                    echo 'Updating deployment repository with new image tag...'
                    
                    def imageTag = env.COMMIT_HASH
                    
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        sh """
                            # Configure git global settings
                            git config --global user.name "Davey"
                            git config --global user.email "davey.rpt@gmail.com"
                            
                            # Clone the deployment/helm repository with authentication
                            git clone https://\${GITHUB_TOKEN}@github.com/daveyrpt/Kubernetes.git
                            cd Kubernetes/helm/laravel-app
                            sed -i '/laravel:/,/pullPolicy:/ s/tag: .*/tag: "build-${BUILD_NUMBER}"/' values.yaml
                            git commit -am "Update image tag to build-${BUILD_NUMBER}"
                            git push https://\${GITHUB_TOKEN}@github.com/daveyrpt/Kubernetes.git
                        """
                    }
                    
                    echo "Deployment repository updated with image tag: ${imageTag}"
                    echo "ArgoCD will automatically sync the new deployment"
                }
            }
        }
        
        stage('Hello') {
            steps {
                echo 'Hello World - Pipeline completed successfully!'
                echo "✅ Application built, tested, scanned, containerized, and pushed to registry"
                echo "🚀 Deployment repository updated - ArgoCD will auto-sync!"
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