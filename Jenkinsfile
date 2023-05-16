// Load shared library at master branch
// the path to the repo with this library should be specified in Jenkins
// https://tomd.xyz/jenkins-shared-library/
// https://www.jenkins.io/doc/book/pipeline/shared-libraries/
@Library('nrp-shared-libs@master') _

pipeline {
    environment {
        NRP_FRONTED_DIR = "nrp-frontend"
        // GIT_CHECKOUT_DIR is a dir of the main project (that was pushed)
        GIT_CHECKOUT_DIR = "${env.NRP_FRONTED_DIR}"
    }
    agent {
        docker {
            label 'ci_label'
            alwaysPull true
            image "node:14"
        }
    }
    options { 
        // Skip code checkout prior running pipeline (only Jenkinsfile is checked out)
        skipDefaultCheckout true
    }

    stages {
        stage('Code checkout') {
            steps {
                // Notify BitBucket on the start of the job
                // The Bitbucket Build Status Notifier is used
                // REF: https://plugins.jenkins.io/bitbucket-build-status-notifier/
                
                bitbucketStatusNotify(buildState: 'INPROGRESS', buildName: 'Code checkout')

                // Debug information on available environment
                echo sh(script: 'env|sort', returnStdout: true)

                // Checkout main project to GIT_CHECKOUT_DIR
                dir(env.GIT_CHECKOUT_DIR) {
                    checkout scm
                }
            }
        }
        
        stage('Install') {
            steps {
                bitbucketStatusNotify(buildState: 'INPROGRESS', buildName: 'Installing nrp-frontend')

                // Build operations (starting in .ci directory)
                dir(env.GIT_CHECKOUT_DIR){
                    // Determine explicitly the shell as bash
                    sh 'rm -rf node_modules'
                    sh 'npm install'
                }
            }
        }
        
        stage('Test') {
            steps {
                bitbucketStatusNotify(buildState: 'INPROGRESS', buildName: 'Testin nrp-frontend')

                // Build operations (starting in .ci directory)
                dir(env.GIT_CHECKOUT_DIR){
                    sh 'cp src/config.js.sample.local public/config.js'
                    sh 'npm run coverage || echo "Tests failed"'

                    // Fail on failed tests
                    junit(allowEmptyResults: true, testResults: 'junit.xml')
                    sh "test ${currentBuild.currentResult} != UNSTABLE"

                    // get coverage reports
                    catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE', message: 'Test coverage has dropped') {
                        step([$class: 'CoberturaPublisher', 
                            autoUpdateHealth: true, 
                            autoUpdateStability: true, 
                            coberturaReportFile: 'coverage/cobertura-coverage.xml', 
                            failUnhealthy: false, 
                            failUnstable: true, 
                            maxNumberOfBuilds: 0, 
                            onlyStable: false, 
                            sourceEncoding: 'ASCII', 
                            zoomCoverageChart: false,
                            lineCoverageTargets: "0.0, 0.0, 0.0"])
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        aborted {
            bitbucketStatusNotify(buildState: 'FAILED', buildDescription: 'Build aborted!')
        }
        failure {
            bitbucketStatusNotify(buildState: 'FAILED', buildDescription: 'Build failed, see console output!')
        }
        success{
            bitbucketStatusNotify(buildState: 'SUCCESSFUL', buildDescription: 'branch ' + env.BRANCH_NAME)
        } 
    }
}
