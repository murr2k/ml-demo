// Optimized ML Demo - Progressive Loading
console.log('Loading ML Demo...')

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

// Charts and models will be initialized progressively
let charts = null
let lc = null
let trajectoryPredictor = null
let anomalyDetector = null
let objectDetector = null
let continuousLearner = null
let sensorFusion = null

// Mock implementations for immediate functionality
const mockML = {
    trajectoryPredictor: {
        predict: (history) => {
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
            values: Array(5).fill(0).map(() => 0.5 + Math.random() * 0.3)
        }),
        detectAnomaly: (data) => {
            const avg = data.values.reduce((a, b) => a + b, 0) / data.values.length
            return avg + (Math.random() - 0.5) * 0.3
        },
        reset: () => {},
        injectAnomaly: () => {}
    },
    objectDetector: {
        detect: () => {
            const count = Math.floor(Math.random() * 5) + 3
            return Array(count).fill(0).map(() => ({
                type: ['car', 'pedestrian', 'bicycle', 'truck'][Math.floor(Math.random() * 4)],
                confidence: 0.7 + Math.random() * 0.3,
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50,
                width: 5 + Math.random() * 10,
                height: 5 + Math.random() * 10
            }))
        },
        simulateComplexScene: () => {}
    },
    continuousLearner: {
        trainIteration: () => ({
            epoch: Math.floor(Math.random() * 100),
            loss: Math.random() * 0.5,
            accuracy: 0.8 + Math.random() * 0.15
        }),
        loadCheckpoint: () => {}
    },
    sensorFusion: {
        fuseData: (sensors) => ({
            confidence: Object.values(sensors).filter(v => v).length / 3,
            data: Object.entries(sensors).map(([k, v]) => ({ sensor: k, active: v }))
        })
    }
}

// Initialize with mocks
trajectoryPredictor = mockML.trajectoryPredictor
anomalyDetector = mockML.anomalyDetector
objectDetector = mockML.objectDetector
continuousLearner = mockML.continuousLearner
sensorFusion = mockML.sensorFusion

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
            state.activeAgents.forEach(agent => {
                const prediction = trajectoryPredictor.predict(agent.history)
                if (charts && charts.trajectory) {
                    charts.trajectory.updatePrediction(agent.id, prediction)
                }
            })

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

        newAgent.history.push({ ...newAgent.position, timestamp: Date.now() })
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
            const sensorReadings = anomalyDetector.generateSensorData()
            const anomalyScore = anomalyDetector.detectAnomaly(sensorReadings)
            const threshold = parseFloat(document.getElementById('anomaly-threshold').value)

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

    let lastUpdate = 0
    const updateInterval = 100
    
    function updateDetection(timestamp) {
        if (!state.isDetecting) return
        
        if (timestamp - lastUpdate >= updateInterval) {
            const detections = objectDetector.detect()
            state.detectedObjects = detections

            if (charts && charts.detection) {
                charts.detection.updateDetections(detections)
            }

            document.getElementById('objects-detected').textContent = `Objects Detected: ${detections.length}`

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

function simulateScene() {
    objectDetector.simulateComplexScene()
}

// Continuous Learning Functions
function trainIteration() {
    const result = continuousLearner.trainIteration()

    if (charts && charts.learning) {
        charts.learning.addTrainingResult(result)
    }

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
        const inferenceTime = state.mlReady ? Math.random() * 5 + 10 : Math.random() * 2 + 5
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
    document.getElementById('btn-inject-anomaly').addEventListener('click', injectAnomaly)
    document.getElementById('btn-reset-sensors').addEventListener('click', () => {
        anomalyDetector.reset()
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

        // Setup event listeners immediately
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
        }, 100)

        console.log('Basic features initialized')

        // Load charts asynchronously
        setTimeout(loadChartsAsync, 500)
        
        // Load ML models much later
        setTimeout(loadMLModelsAsync, 3000)

    } catch (error) {
        console.error('Failed to initialize:', error)
    }
}

// Load charts asynchronously
async function loadChartsAsync() {
    try {
        console.log('Loading charts...')
        const { lightningChart } = await import('@lightningchart/lcjs')
        const { setupCharts } = await import('./visualization/charts.js')
        
        lc = lightningChart({
            license: '0002-n9xRML+Glr3QwdvnJVsvK6cQVxjGKwDdUQmrn5+yxNjS6P3j9y5OhH9trO5ekaGLuGtbex7ogsCXLl9yKKX4HGcV-MEYCIQDv+5zIdiAu7CLpFCIwjTAfgzsKZUW8vcWsAYGlqWsNvgIhAPUML6w6txdfzdtl94qP69Wb9Lj1ijkB8+XuNjs0qzrn',
            licenseInformation: {
                appTitle: 'LightningChart JS Trial',
                company: 'LightningChart Ltd.',
            },
        })
        
        charts = setupCharts(lc)
        console.log('Charts loaded successfully')
        
        if (typeof window !== 'undefined') {
            window.charts = charts
        }
    } catch (error) {
        console.error('Failed to load charts:', error)
    }
}

// Load ML models asynchronously
async function loadMLModelsAsync() {
    try {
        console.log('Loading ML models in background...')
        
        const [tfModule, trajModule, anomModule, objModule, contModule, sensModule] = await Promise.all([
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
            trajectoryPredictor: new trajModule.TrajectoryPredictor(),
            anomalyDetector: new anomModule.AnomalyDetector(),
            objectDetector: new objModule.ObjectDetector(),
            continuousLearner: new contModule.ContinuousLearner(),
            sensorFusion: new sensModule.SensorFusion()
        }
        
        // Initialize one by one with breaks
        await realModels.trajectoryPredictor.initialize()
        await new Promise(resolve => setTimeout(resolve, 100))
        
        await realModels.anomalyDetector.initialize()
        await new Promise(resolve => setTimeout(resolve, 100))
        
        await realModels.objectDetector.initialize()
        await new Promise(resolve => setTimeout(resolve, 100))
        
        await realModels.continuousLearner.initialize()
        
        // Replace mocks with real models
        trajectoryPredictor = realModels.trajectoryPredictor
        anomalyDetector = realModels.anomalyDetector
        objectDetector = realModels.objectDetector
        continuousLearner = realModels.continuousLearner
        sensorFusion = realModels.sensorFusion
        
        state.mlReady = true
        console.log('ML models loaded successfully')
        
        // Expose to window
        if (typeof window !== 'undefined') {
            window.trajectoryPredictor = trajectoryPredictor
            window.anomalyDetector = anomalyDetector
            window.objectDetector = objectDetector
            window.continuousLearner = continuousLearner
            window.sensorFusion = sensorFusion
        }
        
    } catch (error) {
        console.error('Failed to load ML models:', error)
        console.log('Continuing with mock models')
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
} else {
    initialize()
}