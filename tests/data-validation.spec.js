import { test, expect } from '@playwright/test'

test.describe('ML Model Data Validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('.lcjs-chart', { state: 'visible' })

        // Expose test helpers to the page
        await page.evaluate(() => {
            window.testHelpers = {
                getModelInstances: () => ({
                    trajectoryPredictor: window.trajectoryPredictor,
                    anomalyDetector: window.anomalyDetector,
                    objectDetector: window.objectDetector,
                    continuousLearner: window.continuousLearner,
                    sensorFusion: window.sensorFusion,
                }),
                validatePrediction: prediction => {
                    if (!Array.isArray(prediction)) return false
                    return prediction.every(
                        point =>
                            typeof point.x === 'number' &&
                            typeof point.y === 'number' &&
                            typeof point.confidence === 'number' &&
                            point.confidence >= 0 &&
                            point.confidence <= 1
                    )
                },
            }
        })
    })

    test('trajectory predictor produces valid predictions', async ({ page }) => {
        // Test with various input patterns
        const testCases = [
            {
                name: 'straight line',
                trajectory: Array.from({ length: 10 }, (_, i) => ({ x: i, y: i })),
                expectedLength: 20,
            },
            {
                name: 'curved path',
                trajectory: Array.from({ length: 10 }, (_, i) => ({
                    x: i,
                    y: Math.sin(i * 0.5) * 10,
                })),
                expectedLength: 20,
            },
            {
                name: 'circular motion',
                trajectory: Array.from({ length: 10 }, (_, i) => ({
                    x: Math.cos(i * 0.3) * 50,
                    y: Math.sin(i * 0.3) * 50,
                })),
                expectedLength: 20,
            },
        ]

        for (const testCase of testCases) {
            const result = await page.evaluate(async ({ trajectory, name }) => {
                const predictor = window.testHelpers.getModelInstances().trajectoryPredictor
                if (!predictor) throw new Error('Trajectory predictor not initialized')

                const prediction = predictor.predict(trajectory)

                return {
                    name,
                    valid: window.testHelpers.validatePrediction(prediction),
                    length: prediction.length,
                    firstPoint: prediction[0],
                    lastPoint: prediction[prediction.length - 1],
                    avgConfidence: prediction.reduce((sum, p) => sum + p.confidence, 0) / prediction.length,
                }
            }, testCase)

            expect(result.valid).toBe(true)
            expect(result.length).toBe(testCase.expectedLength)
            expect(result.avgConfidence).toBeGreaterThan(0.5)

            console.log(`✅ ${result.name}: avg confidence ${result.avgConfidence.toFixed(2)}`)
        }
    })

    test('anomaly detector correctly identifies anomalies', async ({ page }) => {
        const results = await page.evaluate(async () => {
            const detector = window.testHelpers.getModelInstances().anomalyDetector
            if (!detector) throw new Error('Anomaly detector not initialized')

            const normalReadings = []
            const anomalyScores = []

            // Generate normal readings
            for (let i = 0; i < 50; i++) {
                const reading = detector.generateSensorData()
                const score = detector.detectAnomaly(reading)
                normalReadings.push({ reading, score })
                anomalyScores.push(score)
            }

            // Inject anomalies
            const anomalousReadings = []
            for (let i = 0; i < 10; i++) {
                detector.injectAnomaly()
                const reading = detector.generateSensorData()
                const score = detector.detectAnomaly(reading)
                anomalousReadings.push({ reading, score })
            }

            return {
                normalAvgScore: anomalyScores.reduce((a, b) => a + b) / anomalyScores.length,
                anomalousAvgScore: anomalousReadings.reduce((sum, r) => sum + r.score, 0) / anomalousReadings.length,
                detectionRate: anomalousReadings.filter(r => r.score > 0.5).length / anomalousReadings.length,
                falsePositiveRate: normalReadings.filter(r => r.score > 0.5).length / normalReadings.length,
            }
        })

        // Validate detection performance
        expect(results.normalAvgScore).toBeLessThan(0.3)
        expect(results.anomalousAvgScore).toBeGreaterThan(0.5)
        expect(results.detectionRate).toBeGreaterThan(0.8)
        expect(results.falsePositiveRate).toBeLessThan(0.2)

        console.log('📊 Anomaly Detection Performance:')
        console.log(`   Normal avg score: ${results.normalAvgScore.toFixed(3)}`)
        console.log(`   Anomaly avg score: ${results.anomalousAvgScore.toFixed(3)}`)
        console.log(`   Detection rate: ${(results.detectionRate * 100).toFixed(1)}%`)
        console.log(`   False positive rate: ${(results.falsePositiveRate * 100).toFixed(1)}%`)
    })

    test('object detector produces valid bounding boxes', async ({ page }) => {
        const detectionResults = await page.evaluate(async () => {
            const detector = window.testHelpers.getModelInstances().objectDetector
            if (!detector) throw new Error('Object detector not initialized')

            const results = []

            // Test regular detection
            for (let i = 0; i < 10; i++) {
                const detections = detector.detect()
                results.push({
                    count: detections.length,
                    valid: detections.every(
                        d =>
                            d.id &&
                            d.class &&
                            d.confidence &&
                            d.bbox &&
                            d.bbox.x >= 0 &&
                            d.bbox.x <= 1 &&
                            d.bbox.y >= 0 &&
                            d.bbox.y <= 1 &&
                            d.bbox.width > 0 &&
                            d.bbox.width <= 1 &&
                            d.bbox.height > 0 &&
                            d.bbox.height <= 1 &&
                            d.confidence >= 0 &&
                            d.confidence <= 1
                    ),
                    classes: [...new Set(detections.map(d => d.class))],
                })
            }

            // Test complex scene
            const complexScene = detector.simulateComplexScene()

            return {
                regularDetections: results,
                complexScene: {
                    count: complexScene.length,
                    classes: [...new Set(complexScene.map(d => d.class))],
                    avgConfidence: complexScene.reduce((sum, d) => sum + d.confidence, 0) / complexScene.length,
                },
                validClasses: detector.classes,
            }
        })

        // Validate all regular detections
        detectionResults.regularDetections.forEach((result, i) => {
            expect(result.valid).toBe(true)
            expect(result.count).toBeGreaterThan(0)
            result.classes.forEach(cls => {
                expect(detectionResults.validClasses).toContain(cls)
            })
        })

        // Validate complex scene
        expect(detectionResults.complexScene.count).toBeGreaterThan(5)
        expect(detectionResults.complexScene.avgConfidence).toBeGreaterThan(0.7)

        console.log('🎯 Object Detection Results:')
        console.log(
            `   Average detections per frame: ${
                detectionResults.regularDetections.reduce((sum, r) => sum + r.count, 0) /
                detectionResults.regularDetections.length
            }`
        )
        console.log(`   Complex scene objects: ${detectionResults.complexScene.count}`)
        console.log(`   Detected classes: ${detectionResults.complexScene.classes.join(', ')}`)
    })

    test('continuous learner training produces improvement', async ({ page }) => {
        const trainingResults = await page.evaluate(async () => {
            const learner = window.testHelpers.getModelInstances().continuousLearner
            if (!learner) throw new Error('Continuous learner not initialized')

            const initialMetrics = learner.getImprovementMetrics()
            const history = []

            // Run training iterations
            for (let i = 0; i < 10; i++) {
                const result = learner.trainIteration()
                history.push(result)
            }

            const finalMetrics = learner.getImprovementMetrics()

            // Test federated learning
            const federatedResult = await learner.federatedLearning([
                { clientId: 'edge_1', dataSize: 1000 },
                { clientId: 'edge_2', dataSize: 1500 },
                { clientId: 'edge_3', dataSize: 800 },
            ])

            return {
                initialMetrics,
                finalMetrics,
                history,
                federatedResult,
                checkpoints: learner.checkpoints.length,
            }
        })

        // Validate training produces improvement
        expect(trainingResults.history.length).toBe(10)
        expect(parseFloat(trainingResults.finalMetrics.lossReduction)).toBeGreaterThan(0)
        expect(parseFloat(trainingResults.finalMetrics.accuracyImprovement)).toBeGreaterThan(0)

        // Validate loss decreases over time
        const losses = trainingResults.history.map(h => h.loss)
        const isDecreasing = losses.slice(1).every((loss, i) => loss <= losses[i] * 1.1)
        expect(isDecreasing).toBe(true)

        // Validate federated learning
        expect(trainingResults.federatedResult.participatingDevices).toBe(3)
        expect(trainingResults.federatedResult.totalDataPoints).toBe(3300)

        console.log('📈 Continuous Learning Results:')
        console.log(`   Loss reduction: ${trainingResults.finalMetrics.lossReduction}%`)
        console.log(`   Accuracy improvement: ${trainingResults.finalMetrics.accuracyImprovement}%`)
        console.log(`   Checkpoints saved: ${trainingResults.checkpoints}`)
    })

    test('sensor fusion produces coherent results', async ({ page }) => {
        const fusionResults = await page.evaluate(async () => {
            const fusion = window.testHelpers.getModelInstances().sensorFusion
            if (!fusion) throw new Error('Sensor fusion not initialized')

            const results = []

            // Test fusion over multiple frames
            for (let i = 0; i < 20; i++) {
                fusion.addSensorData('lidar', {
                    timestamp: Date.now(),
                    points: Array.from({ length: 100 }, () => ({
                        x: Math.random() * 200 - 100,
                        y: Math.random() * 200 - 100,
                        z: Math.random() * 10,
                    })),
                })

                fusion.addSensorData('camera', {
                    timestamp: Date.now(),
                    detections: [{ class: 'vehicle', confidence: 0.9, bbox: { x: 0.4, y: 0.5, w: 0.2, h: 0.1 } }],
                })

                fusion.addSensorData('radar', {
                    timestamp: Date.now(),
                    targets: [{ range: 50, velocity: 15, angle: 0 }],
                })

                const fusedData = fusion.fuseData()
                results.push({
                    objectCount: fusedData.fusedObjects.length,
                    avgConfidence: fusedData.confidence,
                    hasLidar: fusedData.sensors.includes('lidar'),
                    hasCamera: fusedData.sensors.includes('camera'),
                    hasRadar: fusedData.sensors.includes('radar'),
                })
            }

            return {
                results,
                avgObjectCount: results.reduce((sum, r) => sum + r.objectCount, 0) / results.length,
                avgConfidence: results.reduce((sum, r) => sum + r.avgConfidence, 0) / results.length,
                sensorCoverage: results.filter(r => r.hasLidar && r.hasCamera && r.hasRadar).length / results.length,
            }
        })

        // Validate fusion results
        expect(fusionResults.avgObjectCount).toBeGreaterThan(0)
        expect(fusionResults.avgConfidence).toBeGreaterThan(0.7)
        expect(fusionResults.sensorCoverage).toBeGreaterThan(0.8)

        console.log('🔄 Sensor Fusion Results:')
        console.log(`   Average fused objects: ${fusionResults.avgObjectCount.toFixed(1)}`)
        console.log(`   Average confidence: ${(fusionResults.avgConfidence * 100).toFixed(1)}%`)
        console.log(`   Sensor coverage: ${(fusionResults.sensorCoverage * 100).toFixed(1)}%`)
    })

    test('model performance under stress', async ({ page }) => {
        const stressResults = await page.evaluate(async () => {
            const models = window.testHelpers.getModelInstances()
            const results = {}

            // Stress test trajectory predictor
            const trajectoryStart = performance.now()
            const largeTraj = Array.from({ length: 100 }, (_, i) => ({ x: i, y: Math.sin(i) * 50 }))
            for (let i = 0; i < 50; i++) {
                models.trajectoryPredictor.predict(largeTraj.slice(i, i + 10))
            }
            results.trajectoryTime = performance.now() - trajectoryStart

            // Stress test anomaly detector
            const anomalyStart = performance.now()
            for (let i = 0; i < 100; i++) {
                const reading = models.anomalyDetector.generateSensorData()
                models.anomalyDetector.detectAnomaly(reading)
            }
            results.anomalyTime = performance.now() - anomalyStart

            // Stress test object detector
            const detectionStart = performance.now()
            for (let i = 0; i < 50; i++) {
                models.objectDetector.detect()
            }
            results.detectionTime = performance.now() - detectionStart

            return results
        })

        // Performance should be reasonable even under stress
        expect(stressResults.trajectoryTime).toBeLessThan(5000) // 5 seconds for 50 predictions
        expect(stressResults.anomalyTime).toBeLessThan(2000) // 2 seconds for 100 detections
        expect(stressResults.detectionTime).toBeLessThan(1000) // 1 second for 50 frames

        console.log('⚡ Performance Under Stress:')
        console.log(`   Trajectory predictions (50x): ${stressResults.trajectoryTime.toFixed(0)}ms`)
        console.log(`   Anomaly detections (100x): ${stressResults.anomalyTime.toFixed(0)}ms`)
        console.log(`   Object detections (50x): ${stressResults.detectionTime.toFixed(0)}ms`)
    })
})
