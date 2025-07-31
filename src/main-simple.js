// Ultra-simple version to diagnose freezing issue
console.log('Starting simple ML demo...')

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
    }
}

// Simple mock functions that don't require any libraries
function updateMetrics() {
    // Update some metrics to show the page is working
    document.getElementById('inference-time').textContent = `${Math.floor(Math.random() * 5 + 10)}ms`
    document.getElementById('fps-count').textContent = Math.floor(Math.random() * 5 + 25)
    document.getElementById('prediction-accuracy').textContent = `${(Math.random() * 10 + 85).toFixed(1)}%`
    document.getElementById('active-agents').textContent = state.activeAgents.length
    document.getElementById('objects-detected').textContent = `Objects Detected: ${Math.floor(Math.random() * 5 + 3)}`
    document.getElementById('confidence-score').textContent = (Math.random() * 0.2 + 0.8).toFixed(2)
    document.getElementById('training-epochs').textContent = Math.floor(Math.random() * 100)
    document.getElementById('model-version').textContent = `1.0.${Math.floor(Math.random() * 100)}`
}

// Setup basic event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...')
    
    // Trajectory buttons
    const btnPredict = document.getElementById('btn-predict')
    if (btnPredict) {
        btnPredict.addEventListener('click', () => {
            state.isPredicting = !state.isPredicting
            btnPredict.textContent = state.isPredicting ? 'Stop Prediction' : 'Start Prediction'
            console.log('Prediction toggled:', state.isPredicting)
        })
    }
    
    const btnAddVehicle = document.getElementById('btn-add-vehicle')
    if (btnAddVehicle) {
        btnAddVehicle.addEventListener('click', () => {
            state.activeAgents.push({ id: Date.now() })
            document.getElementById('active-agents').textContent = state.activeAgents.length
            console.log('Vehicle added')
        })
    }
    
    const btnClear = document.getElementById('btn-clear-trajectories')
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            state.activeAgents = []
            document.getElementById('active-agents').textContent = '0'
            console.log('Trajectories cleared')
        })
    }
    
    // Anomaly buttons
    const btnMonitor = document.getElementById('btn-start-monitoring')
    if (btnMonitor) {
        btnMonitor.addEventListener('click', () => {
            state.isMonitoring = !state.isMonitoring
            btnMonitor.textContent = state.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'
            console.log('Monitoring toggled:', state.isMonitoring)
        })
    }
    
    // Object detection buttons
    const btnDetect = document.getElementById('btn-start-detection')
    if (btnDetect) {
        btnDetect.addEventListener('click', () => {
            state.isDetecting = !state.isDetecting
            btnDetect.textContent = state.isDetecting ? 'Stop Detection' : 'Start Detection'
            console.log('Detection toggled:', state.isDetecting)
        })
    }
    
    // Other buttons
    const btnTrain = document.getElementById('btn-train-iteration')
    if (btnTrain) {
        btnTrain.addEventListener('click', () => {
            const epochs = parseInt(document.getElementById('training-epochs').textContent) || 0
            document.getElementById('training-epochs').textContent = epochs + 1
            console.log('Training iteration')
        })
    }
    
    // Sensor toggles
    ['lidar', 'camera', 'radar'].forEach(sensor => {
        const btn = document.getElementById(`btn-toggle-${sensor}`)
        if (btn) {
            btn.addEventListener('click', () => {
                state.sensorData[sensor] = !state.sensorData[sensor]
                console.log(`${sensor} toggled:`, state.sensorData[sensor])
                updateSensorHealth()
            })
        }
    })
    
    // Threshold slider
    const slider = document.getElementById('anomaly-threshold')
    if (slider) {
        slider.addEventListener('input', (e) => {
            document.getElementById('threshold-value').textContent = e.target.value
        })
    }
}

function updateSensorHealth() {
    const healthStatus = Object.values(state.sensorData).every(v => v)
        ? 'All Systems Operational'
        : 'Degraded Performance'
    const healthEl = document.getElementById('sensor-health')
    if (healthEl) {
        healthEl.textContent = healthStatus
        healthEl.style.color = healthStatus === 'All Systems Operational' ? '#4fbdba' : '#e53e3e'
    }
}

// Add placeholder content to chart containers
function setupPlaceholderCharts() {
    console.log('Setting up placeholder charts...')
    const chartContainers = document.querySelectorAll('.chart-container')
    chartContainers.forEach(container => {
        container.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(31, 41, 61, 0.5);
                border: 1px solid #1f293d;
                border-radius: 4px;
                color: #4fbdba;
                font-size: 14px;
            ">
                Chart Loading...
            </div>
        `
    })
}

// Initialize the page
function initialize() {
    console.log('Initializing simple demo...')
    
    try {
        // Setup event listeners
        setupEventListeners()
        
        // Setup placeholder charts
        setupPlaceholderCharts()
        
        // Start updating metrics
        setInterval(updateMetrics, 1000)
        updateMetrics() // Initial update
        
        // Auto-start some features
        setTimeout(() => {
            console.log('Auto-starting features...')
            
            // Add some vehicles
            state.activeAgents = [{id: 1}, {id: 2}, {id: 3}]
            document.getElementById('active-agents').textContent = '3'
            
            // Start prediction
            state.isPredicting = true
            const btnPredict = document.getElementById('btn-predict')
            if (btnPredict) btnPredict.textContent = 'Stop Prediction'
            
            // Start monitoring
            state.isMonitoring = true
            const btnMonitor = document.getElementById('btn-start-monitoring')
            if (btnMonitor) btnMonitor.textContent = 'Stop Monitoring'
            
            // Start detection
            state.isDetecting = true
            const btnDetect = document.getElementById('btn-start-detection')
            if (btnDetect) btnDetect.textContent = 'Stop Detection'
            
            console.log('Features auto-started')
        }, 500)
        
        console.log('Simple demo initialized successfully!')
        
        // Try to load charts library after everything else
        setTimeout(() => {
            console.log('Attempting to load LightningChart...')
            loadChartsAsync()
        }, 2000)
        
    } catch (error) {
        console.error('Initialization error:', error)
    }
}

// Async chart loading
async function loadChartsAsync() {
    try {
        const { lightningChart } = await import('@lightningchart/lcjs')
        console.log('LightningChart loaded successfully')
        
        // Initialize with license
        const lc = lightningChart({
            license: '0002-n9xRML+Glr3QwdvnJVsvK6cQVxjGKwDdUQmrn5+yxNjS6P3j9y5OhH9trO5ekaGLuGtbex7ogsCXLl9yKKX4HGcV-MEYCIQDv+5zIdiAu7CLpFCIwjTAfgzsKZUW8vcWsAYGlqWsNvgIhAPUML6w6txdfzdtl94qP69Wb9Lj1ijkB8+XuNjs0qzrn',
            licenseInformation: {
                appTitle: 'LightningChart JS Trial',
                company: 'LightningChart Ltd.',
            },
        })
        
        // Try to create a simple chart
        const chartContainers = document.querySelectorAll('.chart-container')
        if (chartContainers.length > 0) {
            const chart = lc.ChartXY({
                container: chartContainers[0]
            })
            chart.setTitle('Test Chart')
            console.log('Test chart created')
        }
        
    } catch (error) {
        console.error('Failed to load charts:', error)
        // Continue without charts
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
} else {
    initialize()
}