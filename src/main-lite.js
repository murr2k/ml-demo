// Lightweight main.js that doesn't freeze the browser
import { lightningChart } from '@lightningchart/lcjs'
import { setupCharts } from './visualization/charts.js'

console.log('Loading ML Demo (Lite)...')

// Initialize LightningChart with the existing license
const lc = lightningChart({
    license:
        '0002-n9xRML+Glr3QwdvnJVsvK6cQVxjGKwDdUQmrn5+yxNjS6P3j9y5OhH9trO5ekaGLuGtbex7ogsCXLl9yKKX4HGcV-MEYCIQDv+5zIdiAu7CLpFCIwjTAfgzsKZUW8vcWsAYGlqWsNvgIhAPUML6w6txdfzdtl94qP69Wb9Lj1ijkB8+XuNjs0qzrn',
    licenseInformation: {
        appTitle: 'LightningChart JS Trial',
        company: 'LightningChart Ltd.',
    },
})

// Global state
const state = {
    isMonitoring: false,
    isPredicting: false,
    isDetecting: false,
    activeAgents: [],
    detectedObjects: [],
    sensorData: {
        lidar: true,
        camera: true,
        radar: true,
    },
    mlReady: false
}

// Charts will be initialized after DOM is ready
let charts = null

// Placeholder ML models that work without TensorFlow
const mockML = {
    trajectoryPredictor: {
        predict: (history) => {
            // Simple linear prediction
            if (!history || history.length < 2) return []
            const last = history[history.length - 1]
            const prev = history[history.length - 2]
            const dx = last.x - prev.x
            const dy = last.y - prev.y
            
            const predictions = []
            for (let i = 1; i <= 10; i++) {
                predictions.push({
                    x: last.x + dx * i,
                    y: last.y + dy * i
                })
            }
            return predictions
        },
        getAccuracy: () => 0.85 + Math.random() * 0.1
    },
    anomalyDetector: {
        generateSensorData: () => ({
            values: [
                0.5 + Math.random() * 0.3,
                0.6 + Math.random() * 0.2,
                0.7 + Math.random() * 0.2,
                0.4 + Math.random() * 0.3,
                0.8 + Math.random() * 0.1
            ]
        }),
        detectAnomaly: (data) => {
            const avg = data.values.reduce((a, b) => a + b, 0) / data.values.length
            return avg + (Math.random() - 0.5) * 0.3
        }
    },
    objectDetector: {
        detect: () => {
            const objects = []
            const count = Math.floor(Math.random() * 5) + 3
            for (let i = 0; i < count; i++) {
                objects.push({
                    type: ['car', 'pedestrian', 'bicycle', 'truck'][Math.floor(Math.random() * 4)],
                    confidence: 0.7 + Math.random() * 0.3,
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50,
                    width: 5 + Math.random() * 10,
                    height: 5 + Math.random() * 10
                })
            }
            return objects
        }
    },
    continuousLearner: {
        trainIteration: () => ({
            epoch: Math.floor(Math.random() * 100),
            loss: Math.random() * 0.5,
            accuracy: 0.8 + Math.random() * 0.15
        })
    },
    sensorFusion: {
        fuseData: (sensors) => ({
            confidence: Object.values(sensors).filter(v => v).length / 3,
            data: Object.entries(sensors).map(([k, v]) => ({ sensor: k, active: v }))
        })
    }
}

// Use mock models initially
let trajectoryPredictor = mockML.trajectoryPredictor
let anomalyDetector = mockML.anomalyDetector
let objectDetector = mockML.objectDetector
let continuousLearner = mockML.continuousLearner
let sensorFusion = mockML.sensorFusion

// Trajectory Prediction Functions
function startPrediction() {
    if (state.isPredicting) return

    state.isPredicting = true
    document.getElementById('btn-predict').textContent = 'Stop Prediction'

    // Use requestAnimationFrame for smoother updates
    let lastUpdate = 0
    const updateInterval = 100 // Update every 100ms
    
    function updatePredictions(timestamp) {
        if (!state.isPredicting) return
        
        if (timestamp - lastUpdate >= updateInterval) {
            // Update predictions for all active agents
            state.activeAgents.forEach(agent => {
                const prediction = trajectoryPredictor.predict(agent.history)
                if (charts && charts.trajectory) {
                    charts.trajectory.updatePrediction(agent.id, prediction)
                }
            })

            // Update accuracy metric
            const accuracy = trajectoryPredictor.getAccuracy()
            document.getElementById('prediction-accuracy').textContent = `${(accuracy * 100).toFixed(1)}%`
            
            lastUpdate = timestamp
        }
        
        requestAnimationFrame(updatePredictions)
    }
    
    requestAnimationFrame(updatePredictions)
}

function stopPrediction() {
    state.isPredicting = false
    document.getElementById('btn-predict').textContent = 'Start Prediction'
}

function addVehicle() {
    const vehicleId = `vehicle_${Date.now()}`
    const newAgent = {
        id: vehicleId,
        type: 'vehicle',
        position: { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 },
        velocity: { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 },
        history: [],
    }

    state.activeAgents.push(newAgent)
    if (charts && charts.trajectory) {
        charts.trajectory.addAgent(newAgent)
    }

    // Update agent count
    document.getElementById('active-agents').textContent = state.activeAgents.length

    // Simulate movement
    const moveInterval = setInterval(() => {
        if (!state.activeAgents.find(a => a.id === vehicleId)) {
            clearInterval(moveInterval)
            return
        }

        // Update position
        newAgent.position.x += newAgent.velocity.x * 0.1
        newAgent.position.y += newAgent.velocity.y * 0.1

        // Add some randomness
        newAgent.velocity.x += (Math.random() - 0.5) * 0.5
        newAgent.velocity.y += (Math.random() - 0.5) * 0.5

        // Keep within bounds
        if (Math.abs(newAgent.position.x) > 100) newAgent.velocity.x *= -1
        if (Math.abs(newAgent.position.y) > 100) newAgent.velocity.y *= -1

        // Update history
        newAgent.history.push({ ...newAgent.position, timestamp: Date.now() })
        if (newAgent.history.length > 50) newAgent.history.shift()

        // Update visualization
        if (charts && charts.trajectory) {
            charts.trajectory.updateAgentPosition(vehicleId, newAgent.position)
        }
    }, 100)
}

// Anomaly Detection Functions
function startMonitoring() {
    if (state.isMonitoring) {
        stopMonitoring()
        return
    }

    state.isMonitoring = true
    document.getElementById('btn-start-monitoring').textContent = 'Stop Monitoring'

    // Use requestAnimationFrame for smoother updates
    let lastUpdate = 0
    const updateInterval = 100 // Update every 100ms
    
    function updateMonitoring(timestamp) {
        if (!state.isMonitoring) return
        
        if (timestamp - lastUpdate >= updateInterval) {
            // Generate sensor readings
            const sensorReadings = anomalyDetector.generateSensorData()

            // Check for anomalies
            const anomalyScore = anomalyDetector.detectAnomaly(sensorReadings)
            const threshold = parseFloat(document.getElementById('anomaly-threshold').value)

            // Update chart
            if (charts && charts.anomaly) {
                charts.anomaly.addDataPoint(sensorReadings, anomalyScore, threshold)
            }
            
            lastUpdate = timestamp
        }
        
        requestAnimationFrame(updateMonitoring)
    }
    
    requestAnimationFrame(updateMonitoring)
}

function stopMonitoring() {
    state.isMonitoring = false
    document.getElementById('btn-start-monitoring').textContent = 'Start Monitoring'
}

// Object Detection Functions
function startDetection() {
    if (state.isDetecting) {
        stopDetection()
        return
    }

    state.isDetecting = true
    document.getElementById('btn-start-detection').textContent = 'Stop Detection'

    // Use requestAnimationFrame for smoother updates
    let lastUpdate = 0
    const updateInterval = 100 // Update every 100ms
    
    function updateDetection(timestamp) {
        if (!state.isDetecting) return
        
        if (timestamp - lastUpdate >= updateInterval) {
            // Run object detection
            const detections = objectDetector.detect()
            state.detectedObjects = detections

            // Update visualization
            if (charts && charts.detection) {
                charts.detection.updateDetections(detections)
            }

            // Update metrics
            document.getElementById('objects-detected').textContent = `Objects Detected: ${detections.length}`

            // Calculate average confidence
            const avgConfidence =
                detections.length > 0 ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length : 0
            document.getElementById('confidence-score').textContent = avgConfidence.toFixed(2)
            
            lastUpdate = timestamp
        }
        
        requestAnimationFrame(updateDetection)
    }
    
    requestAnimationFrame(updateDetection)
}

function stopDetection() {
    state.isDetecting = false
    document.getElementById('btn-start-detection').textContent = 'Start Detection'
}

// Other functions
function trainIteration() {
    const result = continuousLearner.trainIteration()

    // Update visualization
    if (charts && charts.learning) {
        charts.learning.addTrainingResult(result)
    }

    // Update metrics
    document.getElementById('training-epochs').textContent = result.epoch
    document.getElementById('model-version').textContent = `1.0.${result.epoch}`
}

function updateSensorFusion() {
    const fusedData = sensorFusion.fuseData(state.sensorData)
    if (charts && charts.fusion) {
        charts.fusion.updateFusion(fusedData)
    }

    // Update sensor health
    const healthStatus = Object.values(state.sensorData).every(v => v)
        ? 'All Systems Operational'
        : 'Degraded Performance'
    document.getElementById('sensor-health').textContent = healthStatus
    document.getElementById('sensor-health').style.color =
        healthStatus === 'All Systems Operational' ? '#4fbdba' : '#e53e3e'
}

// Performance Monitoring
function startPerformanceMonitoring() {
    setInterval(() => {
        // Update inference time
        const inferenceTime = state.mlReady ? Math.random() * 5 + 10 : Math.random() * 2 + 5
        document.getElementById('inference-time').textContent = `${inferenceTime.toFixed(0)}ms`

        // Update FPS
        const fps = 30 - Math.floor(Math.random() * 5)
        document.getElementById('fps-count').textContent = fps

        // Update performance chart
        if (charts && charts.performance) {
            charts.performance.addMetrics({
                inferenceTime,
                fps,
                cpuUsage: Math.random() * 30 + 20,
                memoryUsage: Math.random() * 20 + 40,
            })
        }
    }, 1000)
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('btn-predict').addEventListener('click', () => {
        if (state.isPredicting) {
            stopPrediction()
        } else {
            startPrediction()
        }
    })

    document.getElementById('btn-add-vehicle').addEventListener('click', addVehicle)

    document.getElementById('btn-clear-trajectories').addEventListener('click', () => {
        state.activeAgents = []
        if (charts && charts.trajectory) {
            charts.trajectory.clear()
        }
        document.getElementById('active-agents').textContent = '0'
    })

    document.getElementById('btn-start-monitoring').addEventListener('click', startMonitoring)
    document.getElementById('btn-inject-anomaly').addEventListener('click', () => {
        console.log('Anomaly injected')
    })
    document.getElementById('btn-reset-sensors').addEventListener('click', () => {
        if (charts && charts.anomaly) {
            charts.anomaly.clear()
        }
    })

    document.getElementById('anomaly-threshold').addEventListener('input', e => {
        document.getElementById('threshold-value').textContent = e.target.value
    })

    document.getElementById('btn-start-detection').addEventListener('click', startDetection)
    document.getElementById('btn-simulate-scene').addEventListener('click', () => {
        console.log('Complex scene simulated')
    })

    document.getElementById('btn-train-iteration').addEventListener('click', trainIteration)
    document.getElementById('btn-load-checkpoint').addEventListener('click', () => {
        alert('Model checkpoint loaded successfully')
    })

    document.getElementById('btn-toggle-lidar').addEventListener('click', () => {
        state.sensorData.lidar = !state.sensorData.lidar
        updateSensorFusion()
    })

    document.getElementById('btn-toggle-camera').addEventListener('click', () => {
        state.sensorData.camera = !state.sensorData.camera
        updateSensorFusion()
    })

    document.getElementById('btn-toggle-radar').addEventListener('click', () => {
        state.sensorData.radar = !state.sensorData.radar
        updateSensorFusion()
    })
}

// Initialize everything when the page loads
async function initialize() {
    try {
        console.log('Starting lightweight initialization...')

        // Setup charts first (needs DOM to be ready)
        console.log('Setting up charts...')
        charts = setupCharts(lc)
        console.log('Charts setup complete')
        
        // Expose charts to window for testing
        if (typeof window !== 'undefined') {
            window.charts = charts
        }

        // Setup event listeners
        setupEventListeners()
        console.log('Event listeners attached')

        // Start everything immediately with mock data
        startPerformanceMonitoring()
        console.log('Performance monitoring started')

        // Auto-start simulations with initial data
        setTimeout(() => {
            console.log('Starting initial simulations')
            // Add vehicles and start prediction
            addVehicle()
            addVehicle()
            addVehicle()
            startPrediction()
            
            // Start anomaly monitoring
            startMonitoring()
            
            // Start object detection
            startDetection()
            
            // Add initial training data
            trainIteration()
            trainIteration()
        }, 100)

        // Start sensor fusion updates
        setInterval(updateSensorFusion, 100)

        console.log('ML Demo (Lite) initialized successfully')
        
        // Load real ML models in background later
        setTimeout(() => {
            loadRealMLModels()
        }, 2000)
        
    } catch (error) {
        console.error('Failed to initialize ML Demo:', error)
        console.error('Stack trace:', error.stack)
    }
}

// Load real ML models in background
async function loadRealMLModels() {
    try {
        console.log('Loading real ML models in background...')
        
        // Dynamic imports
        const [tfModule, ...modelModules] = await Promise.all([
            import('@tensorflow/tfjs'),
            import('./models/trajectoryPredictor.js'),
            import('./models/anomalyDetector.js'),
            import('./models/objectDetector.js'),
            import('./models/continuousLearner.js'),
            import('./models/sensorFusion.js')
        ])
        
        const tf = tfModule
        await tf.ready()
        
        // Create real model instances
        const realModels = {
            trajectoryPredictor: new modelModules[0].TrajectoryPredictor(),
            anomalyDetector: new modelModules[1].AnomalyDetector(),
            objectDetector: new modelModules[2].ObjectDetector(),
            continuousLearner: new modelModules[3].ContinuousLearner(),
            sensorFusion: new modelModules[4].SensorFusion()
        }
        
        // Initialize models
        await Promise.all([
            realModels.trajectoryPredictor.initialize(),
            realModels.anomalyDetector.initialize(),
            realModels.objectDetector.initialize(),
            realModels.continuousLearner.initialize()
        ])
        
        // Replace mock models with real ones
        trajectoryPredictor = realModels.trajectoryPredictor
        anomalyDetector = realModels.anomalyDetector
        objectDetector = realModels.objectDetector
        continuousLearner = realModels.continuousLearner
        sensorFusion = realModels.sensorFusion
        
        state.mlReady = true
        console.log('Real ML models loaded successfully')
        
        // Expose to window
        if (typeof window !== 'undefined') {
            window.trajectoryPredictor = trajectoryPredictor
            window.anomalyDetector = anomalyDetector
            window.objectDetector = objectDetector
            window.continuousLearner = continuousLearner
            window.sensorFusion = sensorFusion
        }
        
    } catch (error) {
        console.error('Failed to load real ML models:', error)
        console.log('Continuing with mock models')
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
} else {
    initialize()
}