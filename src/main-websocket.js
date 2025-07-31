// ML Demo with WebSocket Backend
import { lightningChart } from '@lightningchart/lcjs'
import { setupCharts } from './visualization/charts-safe.js'
import { mlWebSocket } from './services/mlWebSocket.js'

console.log('Loading ML Demo with WebSocket...')

// Initialize LightningChart
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
}

// Charts will be initialized after DOM is ready
let charts = null

// Trajectory Prediction Functions
function startPrediction() {
    if (state.isPredicting) return

    state.isPredicting = true
    document.getElementById('btn-predict').textContent = 'Stop Prediction'

    let lastUpdate = 0
    const updateInterval = 100
    
    function updatePredictions(timestamp) {
        if (!state.isPredicting) return
        
        if (timestamp - lastUpdate >= updateInterval) {
            // Update predictions for all active agents
            state.activeAgents.forEach(async agent => {
                try {
                    const response = await mlWebSocket.predictTrajectory(agent.history)
                    const prediction = response.prediction.predictions
                    
                    if (charts && charts.trajectory) {
                        charts.trajectory.updatePrediction(agent.id, prediction)
                    }
                    
                    // Update accuracy metric
                    document.getElementById('prediction-accuracy').textContent = 
                        `${(response.prediction.confidence * 100).toFixed(1)}%`
                } catch (error) {
                    console.error('Prediction error:', error)
                }
            })
            
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

    document.getElementById('active-agents').textContent = state.activeAgents.length

    const moveInterval = setInterval(() => {
        if (!state.activeAgents.find(a => a.id === vehicleId)) {
            clearInterval(moveInterval)
            return
        }

        newAgent.position.x += newAgent.velocity.x * 0.1
        newAgent.position.y += newAgent.velocity.y * 0.1

        newAgent.velocity.x += (Math.random() - 0.5) * 0.5
        newAgent.velocity.y += (Math.random() - 0.5) * 0.5

        if (Math.abs(newAgent.position.x) > 100) newAgent.velocity.x *= -1
        if (Math.abs(newAgent.position.y) > 100) newAgent.velocity.y *= -1

        newAgent.history.push({ 
            x: newAgent.position.x, 
            y: newAgent.position.y, 
            timestamp: Date.now() 
        })
        if (newAgent.history.length > 50) newAgent.history.shift()

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

    let lastUpdate = 0
    const updateInterval = 100
    
    function updateMonitoring(timestamp) {
        if (!state.isMonitoring) return
        
        if (timestamp - lastUpdate >= updateInterval) {
            // Generate sensor readings
            const sensorTypes = ['lidar', 'camera', 'radar', 'imu', 'gps']
            const sensorReadings = sensorTypes.map(type => ({
                sensor_type: type,
                values: Array(5).fill(0).map(() => Math.random()),
                timestamp: Date.now()
            }))
            
            mlWebSocket.detectAnomaly(sensorReadings).then(response => {
                const anomalyData = response.prediction
                const threshold = parseFloat(document.getElementById('anomaly-threshold').value)
                
                if (charts && charts.anomaly) {
                    charts.anomaly.addDataPoint(
                        { values: sensorReadings[0].values }, 
                        anomalyData.anomaly_score, 
                        threshold
                    )
                }
            }).catch(err => console.error('Anomaly detection error:', err))
            
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

    let lastUpdate = 0
    const updateInterval = 100
    let frameCounter = 0
    
    function updateDetection(timestamp) {
        if (!state.isDetecting) return
        
        if (timestamp - lastUpdate >= updateInterval) {
            frameCounter++
            
            mlWebSocket.detectObjects(`frame_${frameCounter}`).then(response => {
                const detections = response.prediction.objects
                state.detectedObjects = detections

                if (charts && charts.detection) {
                    charts.detection.updateDetections(detections)
                }

                document.getElementById('objects-detected').textContent = 
                    `Objects Detected: ${detections.length}`

                const avgConfidence = detections.length > 0 
                    ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length 
                    : 0
                document.getElementById('confidence-score').textContent = avgConfidence.toFixed(2)
            }).catch(err => console.error('Object detection error:', err))
            
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

function simulateScene() {
    mlWebSocket.detectObjects('complex_scene', true).then(response => {
        console.log('Complex scene detected:', response.prediction.objects.length, 'objects')
    })
}

// Continuous Learning Functions
function trainIteration() {
    // For now, just update the UI with mock data
    const epochs = parseInt(document.getElementById('training-epochs').textContent) || 0
    document.getElementById('training-epochs').textContent = epochs + 1
    document.getElementById('model-version').textContent = `1.0.${epochs + 1}`
    
    if (charts && charts.learning) {
        charts.learning.addTrainingResult({
            epoch: epochs + 1,
            loss: Math.random() * 0.5,
            accuracy: 0.8 + Math.random() * 0.15
        })
    }
}

function loadCheckpoint() {
    alert('Model checkpoint loaded successfully')
}

// Sensor Fusion Functions
function updateSensorFusion() {
    mlWebSocket.fuseSensors(state.sensorData).then(response => {
        const fusedData = response.prediction
        
        if (charts && charts.fusion) {
            charts.fusion.updateFusion(fusedData)
        }

        const healthStatus = fusedData.fusion_quality === 'excellent' || fusedData.fusion_quality === 'good'
            ? 'All Systems Operational'
            : 'Degraded Performance'
        document.getElementById('sensor-health').textContent = healthStatus
        document.getElementById('sensor-health').style.color =
            healthStatus === 'All Systems Operational' ? '#4fbdba' : '#e53e3e'
    }).catch(err => console.error('Sensor fusion error:', err))
}

// Performance Monitoring
function startPerformanceMonitoring() {
    setInterval(() => {
        const inferenceTime = Math.random() * 5 + 10
        document.getElementById('inference-time').textContent = `${inferenceTime.toFixed(0)}ms`

        const fps = 30 - Math.floor(Math.random() * 5)
        document.getElementById('fps-count').textContent = fps

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
        console.log('Anomaly injection requested')
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

        // Connect to ML server
        console.log('Connecting to ML server...')
        await mlWebSocket.connect()
        console.log('Connected to ML server')

        // Setup charts
        console.log('Setting up charts...')
        charts = setupCharts(lc)
        console.log('Charts setup complete')
        
        if (typeof window !== 'undefined') {
            window.charts = charts
        }

        // Setup event listeners
        setupEventListeners()
        console.log('Event listeners attached')

        // Start basic features
        startPerformanceMonitoring()
        setInterval(updateSensorFusion, 100)

        // Auto-start simulations
        setTimeout(() => {
            console.log('Starting initial simulations')
            addVehicle()
            addVehicle()
            addVehicle()
            startPrediction()
            startMonitoring()
            startDetection()
            trainIteration()
            trainIteration()
        }, 500)

        console.log('ML Demo initialized successfully')

    } catch (error) {
        console.error('Failed to initialize:', error)
        alert('Failed to connect to ML server. Please ensure the server is running on port 8080.')
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
} else {
    initialize()
}