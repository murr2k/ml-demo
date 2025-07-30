// Import dependencies
import { lightningChart } from '@lightningchart/lcjs'
import * as tf from '@tensorflow/tfjs'
import { TrajectoryPredictor } from './models/trajectoryPredictor.js'
import { AnomalyDetector } from './models/anomalyDetector.js'
import { ObjectDetector } from './models/objectDetector.js'
import { ContinuousLearner } from './models/continuousLearner.js'
import { SensorFusion } from './models/sensorFusion.js'
import { setupCharts } from './visualization/charts.js'

console.log('Loading ML Demo...')

// Initialize TensorFlow.js
await tf.ready()
console.log('TensorFlow.js initialized')

// Initialize LightningChart with the existing license
const lc = lightningChart({
    license: "0002-n9xRML+Glr3QwdvnJVsvK6cQVxjGKwDdUQmrn5+yxNjS6P3j9y5OhH9trO5ekaGLuGtbex7ogsCXLl9yKKX4HGcV-MEYCIQDv+5zIdiAu7CLpFCIwjTAfgzsKZUW8vcWsAYGlqWsNvgIhAPUML6w6txdfzdtl94qP69Wb9Lj1ijkB8+XuNjs0qzrn",
    licenseInformation: {
        appTitle: "LightningChart JS Trial",
        company: "LightningChart Ltd."
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
        radar: true
    }
}

// Initialize ML models
const trajectoryPredictor = new TrajectoryPredictor()
const anomalyDetector = new AnomalyDetector()
const objectDetector = new ObjectDetector()
const continuousLearner = new ContinuousLearner()
const sensorFusion = new SensorFusion()

// Charts will be initialized after DOM is ready
let charts = null

// Initialize models
async function initializeModels() {
    console.log('Initializing ML models...')
    await trajectoryPredictor.initialize()
    await anomalyDetector.initialize()
    await objectDetector.initialize()
    await continuousLearner.initialize()
    console.log('ML models initialized')
}

// Trajectory Prediction Functions
function startPrediction() {
    if (state.isPredicting) return
    
    state.isPredicting = true
    document.getElementById('btn-predict').textContent = 'Stop Prediction'
    
    // Start prediction loop
    const predictionInterval = setInterval(() => {
        if (!state.isPredicting) {
            clearInterval(predictionInterval)
            return
        }
        
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
        
    }, 100) // 10Hz update rate
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
        history: []
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
    
    // Generate sensor data stream
    const monitoringInterval = setInterval(() => {
        if (!state.isMonitoring) {
            clearInterval(monitoringInterval)
            return
        }
        
        // Generate sensor readings
        const sensorReadings = anomalyDetector.generateSensorData()
        
        // Check for anomalies
        const anomalyScore = anomalyDetector.detectAnomaly(sensorReadings)
        const threshold = parseFloat(document.getElementById('anomaly-threshold').value)
        
        // Update chart
        if (charts && charts.anomaly) {
            charts.anomaly.addDataPoint(sensorReadings, anomalyScore, threshold)
        }
        
    }, 100)
}

function stopMonitoring() {
    state.isMonitoring = false
    document.getElementById('btn-start-monitoring').textContent = 'Start Monitoring'
}

function injectAnomaly() {
    anomalyDetector.injectAnomaly()
}

// Object Detection Functions
function startDetection() {
    if (state.isDetecting) {
        stopDetection()
        return
    }
    
    state.isDetecting = true
    document.getElementById('btn-start-detection').textContent = 'Stop Detection'
    
    const detectionInterval = setInterval(() => {
        if (!state.isDetecting) {
            clearInterval(detectionInterval)
            return
        }
        
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
        const avgConfidence = detections.length > 0 
            ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length 
            : 0
        document.getElementById('confidence-score').textContent = avgConfidence.toFixed(2)
        
    }, 100)
}

function stopDetection() {
    state.isDetecting = false
    document.getElementById('btn-start-detection').textContent = 'Start Detection'
}

function simulateScene() {
    objectDetector.simulateComplexScene()
}

// Continuous Learning Functions
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

function loadCheckpoint() {
    continuousLearner.loadCheckpoint()
    alert('Model checkpoint loaded successfully')
}

// Sensor Fusion Functions
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
        const inferenceTime = Math.random() * 5 + 10 // 10-15ms
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
                memoryUsage: Math.random() * 20 + 40
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
    document.getElementById('btn-inject-anomaly').addEventListener('click', injectAnomaly)
    document.getElementById('btn-reset-sensors').addEventListener('click', () => {
        anomalyDetector.reset()
        if (charts && charts.anomaly) {
            charts.anomaly.clear()
        }
    })

    document.getElementById('anomaly-threshold').addEventListener('input', (e) => {
        document.getElementById('threshold-value').textContent = e.target.value
    })

    document.getElementById('btn-start-detection').addEventListener('click', startDetection)
    document.getElementById('btn-simulate-scene').addEventListener('click', simulateScene)

    document.getElementById('btn-train-iteration').addEventListener('click', trainIteration)
    document.getElementById('btn-load-checkpoint').addEventListener('click', loadCheckpoint)

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
        console.log('Starting initialization...')
        
        // Setup charts first (needs DOM to be ready)
        console.log('Setting up charts...')
        charts = setupCharts(lc)
        console.log('Charts setup complete')
        
        // Initialize ML models
        await initializeModels()
        console.log('Models initialized')
        
        // Setup event listeners
        setupEventListeners()
        console.log('Event listeners attached')
        
        startPerformanceMonitoring()
        console.log('Performance monitoring started')
        
        // Add initial vehicles
        setTimeout(() => {
            console.log('Adding initial vehicles')
            addVehicle()
            addVehicle()
        }, 1000)
        
        // Start sensor fusion updates
        setInterval(updateSensorFusion, 100)
        
        console.log('ML Demo initialized successfully')
    } catch (error) {
        console.error('Failed to initialize ML Demo:', error)
        console.error('Stack trace:', error.stack)
    }
}

// Try multiple initialization approaches
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
} else {
    initialize()
}