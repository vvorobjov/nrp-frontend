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
<<<<<<< HEAD
=======

        // That is needed to pass the variables into environment with the same name from 
        // Jenkins global scope (def ..=..)
        TOPIC_BRANCH = "${TOPIC_BRANCH}"
        DEFAULT_BRANCH = "${DEFAULT_BRANCH}"
>>>>>>> 1a67a9d98eeae4fca7b377fc44bf3a2c36d36b2b
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
<<<<<<< HEAD
=======
                // Notify BitBucket on the start of the job
                // The Bitbucket Build Status Notifier is used
                // REF: https://plugins.jenkins.io/bitbucket-build-status-notifier/
                
                bitbucketStatusNotify(buildState: 'INPROGRESS', buildName: 'Code checkout')

>>>>>>> 1a67a9d98eeae4fca7b377fc44bf3a2c36d36b2b
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
<<<<<<< HEAD
                // Build operations (starting in .ci directory)
                dir(env.GIT_CHECKOUT_DIR){
                    // Determine explicitly the shell as bash
                    sh 'rm -rf node_modules'
=======
                bitbucketStatusNotify(buildState: 'INPROGRESS', buildName: 'Building nrpBackendProxy')

                // Build operations (starting in .ci directory)
                dir(env.GIT_CHECKOUT_DIR){
                    // Determine explicitly the shell as bash
>>>>>>> 1a67a9d98eeae4fca7b377fc44bf3a2c36d36b2b
                    sh 'npm install'
                }
            }
        }
        
        stage('Test') {
            steps {
<<<<<<< HEAD
=======
                bitbucketStatusNotify(buildState: 'INPROGRESS', buildName: 'Building nrpBackendProxy')

>>>>>>> 1a67a9d98eeae4fca7b377fc44bf3a2c36d36b2b
                // Build operations (starting in .ci directory)
                dir(env.GIT_CHECKOUT_DIR){
                    sh 'cp src/config.json.sample.local src/config.json'
                    sh 'npm run coverage || echo "Tests failed"'
<<<<<<< HEAD

                    // Fail on failed tests
                    junit(allowEmptyResults: true, testResults: 'junit.xml')
                    sh "test ${currentBuild.currentResult} != UNSTABLE"

                    // get coverage reports
=======
>>>>>>> 1a67a9d98eeae4fca7b377fc44bf3a2c36d36b2b
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
<<<<<<< HEAD
=======

                        junit(allowEmptyResults: true, testResults: 'junit.xml')
>>>>>>> 1a67a9d98eeae4fca7b377fc44bf3a2c36d36b2b
                    }
                }
            }
        }
    }

    post {
<<<<<<< HEAD
        always {
            cleanWs()
        }
=======
        // always {
        //     cleanWs()
        // }
        aborted {
            bitbucketStatusNotify(buildState: 'FAILED', buildDescription: 'Build aborted!')
        }
        failure {
            bitbucketStatusNotify(buildState: 'FAILED', buildDescription: 'Build failed, see console output!')
        }
        success{
            bitbucketStatusNotify(buildState: 'SUCCESSFUL', buildDescription: 'branch ' + env.BRANCH_NAME)
        } 
>>>>>>> 1a67a9d98eeae4fca7b377fc44bf3a2c36d36b2b
    }
}
