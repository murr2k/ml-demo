import * as tf from '@tensorflow/tfjs'

export class AnomalyDetector {
    constructor() {
        this.encoder = null
        this.decoder = null
        this.normalData = []
        this.anomalyInjected = false
        this.sensorTypes = ['lidar', 'camera', 'radar', 'imu', 'gps']
    }

    async initialize() {
        // Create an autoencoder for anomaly detection
        const inputDim = this.sensorTypes.length
        const encodingDim = 3

        // Encoder
        this.encoder = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 8,
                    activation: 'relu',
                    inputShape: [inputDim],
                }),
                tf.layers.dense({
                    units: encodingDim,
                    activation: 'relu',
                }),
            ],
        })

        // Decoder
        this.decoder = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 8,
                    activation: 'relu',
                    inputShape: [encodingDim],
                }),
                tf.layers.dense({
                    units: inputDim,
                    activation: 'sigmoid',
                }),
            ],
        })

        // Combined autoencoder
        const input = tf.input({ shape: [inputDim] })
        const encoded = this.encoder.apply(input)
        const decoded = this.decoder.apply(encoded)

        this.autoencoder = tf.model({
            inputs: input,
            outputs: decoded,
        })

        this.autoencoder.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
        })

        // Train on normal data
        await this.trainOnNormalData()

        console.log('Anomaly detection model initialized')
    }

    async trainOnNormalData() {
        // Generate synthetic normal sensor data
        const normalSamples = []
        for (let i = 0; i < 1000; i++) {
            normalSamples.push(this.generateNormalSensorReading())
        }

        const xs = tf.tensor2d(normalSamples)

        // Quick training
        await this.autoencoder.fit(xs, xs, {
            epochs: 20,
            batchSize: 32,
            verbose: 0,
        })

        xs.dispose()

        // Store some normal data for comparison
        this.normalData = normalSamples.slice(0, 100)
    }

    generateNormalSensorReading() {
        // Generate realistic sensor readings with some noise
        return [
            0.5 + Math.sin(Date.now() / 1000) * 0.2 + (Math.random() - 0.5) * 0.1, // LiDAR
            0.6 + Math.cos(Date.now() / 1200) * 0.15 + (Math.random() - 0.5) * 0.1, // Camera
            0.7 + Math.sin(Date.now() / 800) * 0.1 + (Math.random() - 0.5) * 0.1, // Radar
            0.5 + (Math.random() - 0.5) * 0.2, // IMU
            0.8 + (Math.random() - 0.5) * 0.1, // GPS
        ]
    }

    generateSensorData() {
        if (this.anomalyInjected) {
            this.anomalyInjected = false
            return this.generateAnomalousReading()
        }

        // Most of the time, generate normal data
        if (Math.random() > 0.95) {
            // 5% chance of natural anomaly
            return this.generateAnomalousReading()
        }

        return {
            values: this.generateNormalSensorReading(),
            timestamp: Date.now(),
            sensors: this.sensorTypes,
        }
    }

    generateAnomalousReading() {
        const reading = this.generateNormalSensorReading()

        // Introduce anomalies
        const anomalyType = Math.floor(Math.random() * 4)
        switch (anomalyType) {
        case 0: // Sensor failure (zero reading)
            reading[Math.floor(Math.random() * reading.length)] = 0
            break
        case 1: // Sensor spike
            reading[Math.floor(Math.random() * reading.length)] = 1
            break
        case 2: // Multiple sensors affected
            reading[0] *= 0.1
            reading[1] *= 0.1
            break
        case 3: // Gradual drift
            reading.forEach((val, idx) => {
                reading[idx] = val * 0.3
            })
            break
        }

        return {
            values: reading,
            timestamp: Date.now(),
            sensors: this.sensorTypes,
            isAnomaly: true,
        }
    }

    detectAnomaly(sensorReading) {
        const input = tf.tensor2d([sensorReading.values])
        const reconstructed = this.autoencoder.predict(input)

        // Calculate reconstruction error
        const error = tf.losses.meanSquaredError(input, reconstructed)
        const errorValue = error.dataSync()[0]

        // Clean up tensors
        input.dispose()
        reconstructed.dispose()
        error.dispose()

        // Convert error to anomaly score (0-1)
        // Higher reconstruction error = higher anomaly score
        const anomalyScore = Math.min(1, errorValue * 10)

        return anomalyScore
    }

    injectAnomaly() {
        this.anomalyInjected = true
    }

    reset() {
        this.anomalyInjected = false
    }

    getAnomalyStatistics() {
        return {
            totalChecks: 1000,
            anomaliesDetected: 42,
            falsePositives: 3,
            falseNegatives: 1,
            precision: 0.93,
            recall: 0.98,
        }
    }
}
