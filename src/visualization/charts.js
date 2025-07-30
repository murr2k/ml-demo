export function setupCharts(lc) {
    console.log('Setting up charts with LightningChart instance:', lc)
    const charts = {}
    
    try {
        console.log('Setting up trajectory chart...')
        charts.trajectory = setupTrajectoryChart(lc)
    } catch (e) {
        console.error('Failed to setup trajectory chart:', e)
    }
    
    try {
        console.log('Setting up anomaly chart...')
        charts.anomaly = setupAnomalyChart(lc)
    } catch (e) {
        console.error('Failed to setup anomaly chart:', e)
    }
    
    try {
        console.log('Setting up performance chart...')
        charts.performance = setupPerformanceChart(lc)
    } catch (e) {
        console.error('Failed to setup performance chart:', e)
    }
    
    try {
        console.log('Setting up detection chart...')
        charts.detection = setupDetectionChart(lc)
    } catch (e) {
        console.error('Failed to setup detection chart:', e)
    }
    
    try {
        console.log('Setting up learning chart...')
        charts.learning = setupLearningChart(lc)
    } catch (e) {
        console.error('Failed to setup learning chart:', e)
    }
    
    try {
        console.log('Setting up fusion chart...')
        charts.fusion = setupFusionChart(lc)
    } catch (e) {
        console.error('Failed to setup fusion chart:', e)
    }
    
    console.log('Charts setup complete:', Object.keys(charts))
    return charts
}

function setupTrajectoryChart(lc) {
    const chart = lc.ChartXY({
        container: document.getElementById('trajectory-chart')
    })
    
    chart.setTitle('Vehicle & Pedestrian Trajectory Prediction')
    chart.getDefaultAxisX().setTitle('X Position (m)')
    chart.getDefaultAxisY().setTitle('Y Position (m)')
    
    // Set view to show road-like area
    chart.getDefaultAxisX().setInterval(-100, 100)
    chart.getDefaultAxisY().setInterval(-100, 100)
    
    // Add grid for road visualization
    // Remove tick strategy customization for now
    
    const agents = new Map()
    const predictions = new Map()
    
    return {
        addAgent(agent) {
            console.log('Adding agent to chart:', agent)
            
            // Create series for agent current position
            const agentSeries = chart.addPointSeries()
            agentSeries.setName(agent.id)
            agentSeries.setPointSize(10)
            
            // Create series for predicted trajectory
            const predictionSeries = chart.addLineSeries({
                dataPattern: 'ProgressiveX'
            })
            predictionSeries.setName(`${agent.id}_prediction`)
            predictionSeries.setStrokeStyle(stroke => stroke
                .setThickness(2)
                .setFillStyle(fill => fill.setA(128)) // Semi-transparent
            )
            
            agents.set(agent.id, { series: agentSeries, data: [] })
            predictions.set(agent.id, predictionSeries)
        },
        
        updateAgentPosition(agentId, position) {
            const agent = agents.get(agentId)
            if (!agent) return
            
            console.log('Updating agent position:', agentId, position)
            
            // Update current position
            agent.data.push(position)
            if (agent.data.length > 50) agent.data.shift()
            
            agent.series.clear()
            agent.series.add([{ x: position.x, y: position.y }])
            
            // Add trail
            if (agent.data.length > 1) {
                const trail = chart.addLineSeries()
                trail.add(agent.data)
                trail.setStrokeStyle(stroke => stroke
                    .setThickness(1)
                    .setFillStyle(fill => fill.setA(64))
                )
                
                // Remove old trails
                setTimeout(() => trail.dispose(), 5000)
            }
        },
        
        updatePrediction(agentId, trajectory) {
            const predSeries = predictions.get(agentId)
            if (!predSeries || !trajectory || trajectory.length === 0) return
            
            predSeries.clear()
            predSeries.add(trajectory.map(p => ({ x: p.x, y: p.y })))
        },
        
        clear() {
            agents.forEach(agent => agent.series.dispose())
            predictions.forEach(series => series.dispose())
            agents.clear()
            predictions.clear()
        }
    }
}

function setupAnomalyChart(lc) {
    const chart = lc.ChartXY({
        container: document.getElementById('anomaly-chart')
    })
    
    chart.setTitle('Sensor Anomaly Detection')
    chart.getDefaultAxisX().setTitle('Time')
    chart.getDefaultAxisY().setTitle('Anomaly Score')
    
    // Create series for each sensor
    const sensorSeries = []
    const sensorNames = ['LiDAR', 'Camera', 'Radar', 'IMU', 'GPS']
    
    sensorNames.forEach((name, idx) => {
        const series = chart.addLineSeries({
            dataPattern: 'ProgressiveX'
        })
        series.setName(name)
        sensorSeries.push(series)
    })
    
    // Add anomaly score series
    const anomalyScore = chart.addLineSeries({
        dataPattern: 'ProgressiveX'
    })
    anomalyScore.setName('Anomaly Score')
    anomalyScore.setStrokeStyle(stroke => stroke.setThickness(3))
    
    // Add threshold line
    const thresholdSeries = chart.addLineSeries()
    thresholdSeries.setName('Threshold')
    thresholdSeries.setStrokeStyle(stroke => stroke
        .setThickness(2)
        .setFillStyle(fill => fill.setColor(lc.ColorRGBA(255, 0, 0)))
    )
    
    let dataPoints = 0
    const maxPoints = 200
    
    return {
        addDataPoint(sensorData, score, threshold) {
            const x = dataPoints++
            
            console.log('Adding anomaly data point:', { x, score, threshold })
            
            // Add sensor values
            sensorData.values.forEach((value, idx) => {
                sensorSeries[idx].add({ x, y: value })
            })
            
            // Add anomaly score
            anomalyScore.add({ x, y: score })
            
            // Update threshold line
            thresholdSeries.clear()
            thresholdSeries.add([
                { x: Math.max(0, x - maxPoints), y: threshold },
                { x, y: threshold }
            ])
            
            // Highlight anomalies
            if (score > threshold) {
                const marker = chart.addPointSeries({
                    pointShape: 'circle',
                    pointSize: 15
                })
                marker.add([{ x, y: score }])
                marker.setPointFillStyle(fill => fill.setColor(lc.ColorRGBA(255, 0, 0)))
                
                setTimeout(() => marker.dispose(), 5000)
            }
            
            // Auto-scale X axis
            if (x > maxPoints) {
                chart.getDefaultAxisX().setInterval(x - maxPoints, x)
            }
        },
        
        clear() {
            sensorSeries.forEach(series => series.clear())
            anomalyScore.clear()
            thresholdSeries.clear()
            dataPoints = 0
        }
    }
}

function setupPerformanceChart(lc) {
    // Check if Dashboard is available
    if (!lc.Dashboard) {
        console.warn('Dashboard not available, using ChartXY instead')
        const chart = lc.ChartXY({
            container: document.getElementById('performance-chart')
        })
        chart.setTitle('Performance Metrics')
        const series = chart.addLineSeries()
        return {
            addMetrics(metrics) {
                // Simplified performance tracking
            }
        }
    }
    
    const dashboard = lc.Dashboard({
        container: document.getElementById('performance-chart'),
        numberOfColumns: 2,
        numberOfRows: 2
    })
    
    // Inference Time Chart
    const inferenceChart = dashboard.createChartXY({
        columnIndex: 0,
        rowIndex: 0
    })
    inferenceChart.setTitle('Inference Time (ms)')
    const inferenceSeries = inferenceChart.addLineSeries()
    
    // FPS Chart
    const fpsChart = dashboard.createChartXY({
        columnIndex: 1,
        rowIndex: 0
    })
    fpsChart.setTitle('Frames Per Second')
    const fpsSeries = fpsChart.addLineSeries()
    fpsSeries.setStrokeStyle(stroke => stroke
        .setFillStyle(fill => fill.setColor(lc.ColorRGBA(0, 255, 0)))
    )
    
    // CPU Usage Chart
    const cpuChart = dashboard.createChartXY({
        columnIndex: 0,
        rowIndex: 1
    })
    cpuChart.setTitle('CPU Usage (%)')
    const cpuSeries = cpuChart.addAreaSeries()
    
    // Memory Usage Chart
    const memChart = dashboard.createChartXY({
        columnIndex: 1,
        rowIndex: 1
    })
    memChart.setTitle('Memory Usage (%)')
    const memSeries = memChart.addAreaSeries()
    
    let timePoint = 0
    
    return {
        addMetrics(metrics) {
            const x = timePoint++
            
            console.log('Adding performance metrics:', metrics)
            
            inferenceSeries.add({ x, y: metrics.inferenceTime })
            fpsSeries.add({ x, y: metrics.fps })
            cpuSeries.add({ x, y: metrics.cpuUsage })
            memSeries.add({ x, y: metrics.memoryUsage })
            
            // Auto-scale axes
            if (x > 100) {
                [inferenceChart, fpsChart, cpuChart, memChart].forEach(chart => {
                    chart.getDefaultAxisX().setInterval(x - 100, x)
                })
            }
        }
    }
}

function setupDetectionChart(lc) {
    const chart = lc.ChartXY({
        container: document.getElementById('detection-chart')
    })
    
    chart.setTitle('Object Detection Confidence Visualization')
    chart.getDefaultAxisX().setTitle('Normalized X')
    chart.getDefaultAxisY().setTitle('Normalized Y')
    chart.getDefaultAxisX().setInterval(0, 1)
    chart.getDefaultAxisY().setInterval(0, 1)
    
    const detectionSeries = new Map()
    const classColors = {
        vehicle: lc.ColorRGBA(0, 255, 0),
        pedestrian: lc.ColorRGBA(255, 255, 0),
        cyclist: lc.ColorRGBA(0, 255, 255),
        traffic_sign: lc.ColorRGBA(255, 0, 255),
        traffic_light: lc.ColorRGBA(255, 128, 0),
        road_marking: lc.ColorRGBA(128, 128, 255)
    }
    
    return {
        updateDetections(detections) {
            // Clear old detections
            detectionSeries.forEach(series => series.dispose())
            detectionSeries.clear()
            
            // Group detections by class
            const detectionsByClass = {}
            detections.forEach(det => {
                if (!detectionsByClass[det.class]) {
                    detectionsByClass[det.class] = []
                }
                detectionsByClass[det.class].push(det)
            })
            
            // Create series for each class
            Object.entries(detectionsByClass).forEach(([className, classDetections]) => {
                const series = chart.addRectangleSeries()
                series.setName(className)
                
                const rectangles = classDetections.map(det => ({
                    x: det.bbox.x,
                    y: det.bbox.y,
                    width: det.bbox.width,
                    height: det.bbox.height
                }))
                
                series.add(rectangles)
                series.setFillStyle(fill => fill
                    .setColor(classColors[className] || lc.ColorRGBA(255, 255, 255))
                    .setA(Math.floor(classDetections[0].confidence * 255))
                )
                
                detectionSeries.set(className, series)
            })
        }
    }
}

function setupLearningChart(lc) {
    const dashboard = lc.Dashboard({
        container: document.getElementById('learning-chart'),
        numberOfColumns: 2,
        numberOfRows: 1
    })
    
    // Loss Chart
    const lossChart = dashboard.createChartXY({
        columnIndex: 0,
        rowIndex: 0
    })
    lossChart.setTitle('Training & Validation Loss')
    lossChart.getDefaultAxisX().setTitle('Epoch')
    lossChart.getDefaultAxisY().setTitle('Loss')
    
    const trainLoss = lossChart.addLineSeries()
    trainLoss.setName('Training Loss')
    
    const valLoss = lossChart.addLineSeries()
    valLoss.setName('Validation Loss')
    valLoss.setStrokeStyle(stroke => stroke
        .setFillStyle(fill => fill.setColor(lc.ColorRGBA(255, 128, 0)))
    )
    
    // Accuracy Chart
    const accChart = dashboard.createChartXY({
        columnIndex: 1,
        rowIndex: 0
    })
    accChart.setTitle('Model Accuracy')
    accChart.getDefaultAxisX().setTitle('Epoch')
    accChart.getDefaultAxisY().setTitle('Accuracy')
    
    const trainAcc = accChart.addLineSeries()
    trainAcc.setName('Training Accuracy')
    trainAcc.setStrokeStyle(stroke => stroke
        .setFillStyle(fill => fill.setColor(lc.ColorRGBA(0, 255, 0)))
    )
    
    const valAcc = accChart.addLineSeries()
    valAcc.setName('Validation Accuracy')
    valAcc.setStrokeStyle(stroke => stroke
        .setFillStyle(fill => fill.setColor(lc.ColorRGBA(0, 255, 255)))
    )
    
    return {
        addTrainingResult(result) {
            console.log('Adding training result:', result)
            
            trainLoss.add({ x: result.epoch, y: result.loss })
            valLoss.add({ x: result.epoch, y: result.validationLoss })
            trainAcc.add({ x: result.epoch, y: result.accuracy })
            valAcc.add({ x: result.epoch, y: result.validationAccuracy })
        }
    }
}

function setupFusionChart(lc) {
    // Check if Chart3D is available
    if (!lc.Chart3D) {
        console.warn('Chart3D not available, using ChartXY instead')
        const chart = lc.ChartXY({
            container: document.getElementById('fusion-chart')
        })
        chart.setTitle('Sensor Fusion Visualization')
        return {
            updateFusion(fusionResult) {
                // Simplified 2D visualization
            }
        }
    }
    
    const chart = lc.Chart3D({
        container: document.getElementById('fusion-chart')
    })
    
    chart.setTitle('Multi-Sensor Fusion Visualization')
    
    // Add coordinate axes
    chart.getDefaultAxisX().setTitle('X (m)')
    chart.getDefaultAxisY().setTitle('Y (m)')
    chart.getDefaultAxisZ().setTitle('Z (m)')
    
    // Set viewing angle
    chart.setCameraLocation({ x: 1.5, y: 1.5, z: 1.5 })
    
    const sensorData = {
        lidar: null,
        camera: null,
        radar: null
    }
    
    return {
        updateFusion(fusionResult) {
            // Clear previous data
            Object.values(sensorData).forEach(series => {
                if (series) series.dispose()
            })
            
            // Visualize fused objects
            const fusedSeries = chart.addPointSeries3D()
            fusedSeries.setName('Fused Objects')
            fusedSeries.setPointStyle(style => style
                .setSize(15)
                .setFillStyle(fill => fill.setColor(lc.ColorRGBA(255, 255, 0)))
            )
            
            const points = fusionResult.fusedData.map(obj => ({
                x: obj.position?.x || 0,
                y: obj.position?.y || 0,
                z: obj.position?.z || 0
            }))
            
            if (points.length > 0) {
                fusedSeries.add(points)
            }
            
            // Add confidence visualization
            fusionResult.fusedData.forEach(obj => {
                if (obj.confidence > 0.8) {
                    const sphere = chart.addPointSeries3D()
                    sphere.add([{
                        x: obj.position?.x || 0,
                        y: obj.position?.y || 0,
                        z: obj.position?.z || 0
                    }])
                    sphere.setPointStyle(style => style
                        .setSize(20)
                        .setFillStyle(fill => fill
                            .setColor(lc.ColorRGBA(0, 255, 0))
                            .setA(Math.floor(obj.confidence * 255))
                        )
                    )
                    
                    setTimeout(() => sphere.dispose(), 2000)
                }
            })
        }
    }
}