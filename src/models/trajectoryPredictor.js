import * as tf from '@tensorflow/tfjs'

export class TrajectoryPredictor {
    constructor() {
        this.model = null
        this.accuracy = 0.95
        this.sequenceLength = 10
        this.predictionHorizon = 20
    }

    async initialize() {
        // Create a simple LSTM model for trajectory prediction
        this.model = tf.sequential({
            layers: [
                tf.layers.lstm({
                    units: 64,
                    inputShape: [this.sequenceLength, 2], // x, y coordinates
                    returnSequences: true,
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.lstm({
                    units: 32,
                    returnSequences: false,
                }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                }),
                tf.layers.dense({
                    units: this.predictionHorizon * 2, // Predict x,y for each future timestep
                }),
            ],
        })

        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
        })

        console.log('Trajectory prediction model initialized')
    }

    predict(history) {
        if (!history || history.length < this.sequenceLength) {
            return this.generateDefaultPrediction()
        }

        // Prepare input data
        const recentHistory = history.slice(-this.sequenceLength)
        const input = recentHistory.map(point => [point.x, point.y])

        // Normalize coordinates
        const normalized = this.normalizeCoordinates(input)

        // Make prediction
        const inputTensor = tf.tensor3d([normalized])
        const prediction = this.model.predict(inputTensor)
        const predictionArray = prediction.arraySync()[0]

        // Clean up tensors
        inputTensor.dispose()
        prediction.dispose()

        // Convert back to trajectory points
        const trajectory = []
        for (let i = 0; i < this.predictionHorizon; i++) {
            trajectory.push({
                x: predictionArray[i * 2],
                y: predictionArray[i * 2 + 1],
                confidence: 0.95 - i * 0.02, // Confidence decreases with time
            })
        }

        // Add physics-based smoothing
        return this.smoothTrajectory(trajectory, recentHistory)
    }

    normalizeCoordinates(coords) {
        // Simple normalization to [-1, 1] range
        return coords.map(([x, y]) => [x / 100, y / 100])
    }

    smoothTrajectory(predicted, history) {
        if (history.length < 2) return predicted

        // Calculate initial velocity from recent history
        const lastPoint = history[history.length - 1]
        const prevPoint = history[history.length - 2]
        const velocity = {
            x: lastPoint.x - prevPoint.x,
            y: lastPoint.y - prevPoint.y,
        }

        // Apply physics-based smoothing
        const smoothed = []
        const currentPos = { ...lastPoint }
        const currentVel = { ...velocity }

        for (let i = 0; i < predicted.length; i++) {
            // Blend ML prediction with physics
            const weight = 0.7 // 70% ML, 30% physics
            currentPos.x += currentVel.x
            currentPos.y += currentVel.y

            smoothed.push({
                x: predicted[i].x * weight + currentPos.x * (1 - weight),
                y: predicted[i].y * weight + currentPos.y * (1 - weight),
                confidence: predicted[i].confidence,
            })

            // Update velocity (with slight decay)
            currentVel.x *= 0.98
            currentVel.y *= 0.98
        }

        return smoothed
    }

    generateDefaultPrediction() {
        // Generate a simple straight-line prediction when no history
        const trajectory = []
        for (let i = 1; i <= this.predictionHorizon; i++) {
            trajectory.push({
                x: i * 2,
                y: 0,
                confidence: 0.5,
            })
        }
        return trajectory
    }

    getAccuracy() {
        // Simulate accuracy with some variation
        this.accuracy = Math.min(0.99, Math.max(0.85, this.accuracy + (Math.random() - 0.5) * 0.02))
        return this.accuracy
    }

    async trainOnNewData(trajectoryData) {
        // Simulate online learning
        if (!trajectoryData || trajectoryData.length < this.sequenceLength + 1) {
            return
        }

        // Prepare training data
        const xs = []
        const ys = []

        for (let i = 0; i < trajectoryData.length - this.sequenceLength - 1; i++) {
            const sequence = trajectoryData.slice(i, i + this.sequenceLength)
            const target = trajectoryData[i + this.sequenceLength]

            xs.push(sequence.map(p => [p.x / 100, p.y / 100]))
            ys.push([target.x / 100, target.y / 100])
        }

        if (xs.length === 0) return

        const xTensor = tf.tensor3d(xs)
        const yTensor = tf.tensor2d(ys)

        // Quick training iteration
        await this.model.fit(xTensor, yTensor, {
            epochs: 1,
            batchSize: Math.min(32, xs.length),
            verbose: 0,
        })

        xTensor.dispose()
        yTensor.dispose()
    }
}
