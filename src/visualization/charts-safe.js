// Safe chart initialization with better error handling
function ColorRGBA(r, g, b, a = 255) {
    return { r, g, b, a }
}

export function setupCharts(lc) {
    console.log('Setting up charts with LightningChart instance:', lc)
    const charts = {}

    // Helper to safely create charts
    function safeChartSetup(name, setupFunc) {
        try {
            console.log(`Setting up ${name} chart...`)
            charts[name] = setupFunc(lc)
            console.log(`✓ ${name} chart created successfully`)
        } catch (e) {
            console.error(`✗ Failed to setup ${name} chart:`, e)
            // Create a minimal fallback
            charts[name] = createFallbackChart(name)
        }
    }

    // Create all charts with safety
    safeChartSetup('trajectory', setupTrajectoryChart)
    safeChartSetup('anomaly', setupAnomalyChart)
    safeChartSetup('performance', setupPerformanceChart)
    safeChartSetup('detection', setupDetectionChart)
    safeChartSetup('learning', setupLearningChart)
    safeChartSetup('fusion', setupFusionChart)

    console.log('Charts setup complete:', Object.keys(charts))
    return charts
}

function createFallbackChart(name) {
    console.log(`Creating fallback for ${name} chart`)
    return {
        addDataPoint: () => {},
        updateDetections: () => {},
        updatePrediction: () => {},
        updateAgentPosition: () => {},
        addAgent: () => {},
        clear: () => {},
        addTrainingResult: () => {},
        updateFusion: () => {},
        addMetrics: () => {}
    }
}

function setupTrajectoryChart(lc) {
    const container = document.getElementById('trajectory-chart')
    if (!container) throw new Error('trajectory-chart container not found')
    
    const chart = lc.ChartXY({ container })
    chart.setTitle('Vehicle & Pedestrian Trajectory Prediction')
    
    const agents = new Map()
    const predictions = new Map()
    
    // Set a reasonable view
    chart.getDefaultAxisX().setInterval(-50, 50)
    chart.getDefaultAxisY().setInterval(-50, 50)
    
    return {
        addAgent(agent) {
            console.log('Adding agent:', agent.id)
            
            // Agent position marker
            const agentSeries = chart.addPointSeries()
                .setName(agent.id)
                .setPointSize(12)
                .setPointFillStyle(fill => fill.setColor(ColorRGBA(0, 255, 0)))
            
            // Prediction line
            const predictionSeries = chart.addLineSeries()
                .setName(`${agent.id}_pred`)
                .setStrokeStyle(stroke => 
                    stroke.setThickness(2)
                        .setFillStyle(fill => fill.setColor(ColorRGBA(255, 255, 0, 128)))
                )
            
            agents.set(agent.id, { series: agentSeries, position: null })
            predictions.set(agent.id, predictionSeries)
        },
        
        updateAgentPosition(agentId, position) {
            const agent = agents.get(agentId)
            if (!agent) return
            
            agent.series.clear()
            agent.series.add([{ x: position.x, y: position.y }])
            agent.position = position
        },
        
        updatePrediction(agentId, trajectory) {
            const predSeries = predictions.get(agentId)
            const agent = agents.get(agentId)
            if (!predSeries || !trajectory || trajectory.length === 0) return
            
            predSeries.clear()
            
            // Connect from current position to predictions
            const points = []
            if (agent && agent.position) {
                points.push({ x: agent.position.x, y: agent.position.y })
            }
            points.push(...trajectory.map(p => ({ x: p.x, y: p.y })))
            
            predSeries.add(points)
        },
        
        clear() {
            agents.forEach(({ series }) => series.dispose())
            predictions.forEach(series => series.dispose())
            agents.clear()
            predictions.clear()
        }
    }
}

function setupAnomalyChart(lc) {
    const container = document.getElementById('anomaly-chart')
    if (!container) throw new Error('anomaly-chart container not found')
    
    const chart = lc.ChartXY({ container })
    chart.setTitle('Sensor Anomaly Detection')
    
    // Main anomaly score line
    const anomalySeries = chart.addLineSeries()
        .setName('Anomaly Score')
        .setStrokeStyle(stroke => stroke.setThickness(3))
    
    // Threshold line
    const thresholdSeries = chart.addLineSeries()
        .setName('Threshold')
        .setStrokeStyle(stroke => 
            stroke.setThickness(2)
                .setFillStyle(fill => fill.setColor(ColorRGBA(255, 0, 0)))
        )
    
    let dataCount = 0
    const maxPoints = 100
    
    return {
        addDataPoint(sensorData, score, threshold) {
            const x = dataCount++
            
            // Add anomaly score
            anomalySeries.add([{ x, y: score }])
            
            // Update threshold line
            thresholdSeries.clear()
            thresholdSeries.add([
                { x: Math.max(0, x - maxPoints), y: threshold },
                { x, y: threshold }
            ])
            
            // Remove old points
            if (dataCount > maxPoints) {
                // This is a simplified approach - in production you'd manage the data better
                chart.getDefaultAxisX().setInterval(x - maxPoints, x)
            }
        },
        
        clear() {
            anomalySeries.clear()
            thresholdSeries.clear()
            dataCount = 0
        }
    }
}

function setupPerformanceChart(lc) {
    const container = document.getElementById('performance-chart')
    if (!container) throw new Error('performance-chart container not found')
    
    const chart = lc.ChartXY({ container })
    chart.setTitle('System Performance Metrics')
    
    const series = {
        inference: chart.addLineSeries().setName('Inference Time (ms)'),
        fps: chart.addLineSeries().setName('FPS'),
        cpu: chart.addLineSeries().setName('CPU %'),
        memory: chart.addLineSeries().setName('Memory %')
    }
    
    let dataCount = 0
    
    return {
        addMetrics(metrics) {
            const x = dataCount++
            
            if (metrics.inferenceTime !== undefined) {
                series.inference.add([{ x, y: metrics.inferenceTime }])
            }
            if (metrics.fps !== undefined) {
                series.fps.add([{ x, y: metrics.fps }])
            }
            if (metrics.cpuUsage !== undefined) {
                series.cpu.add([{ x, y: metrics.cpuUsage }])
            }
            if (metrics.memoryUsage !== undefined) {
                series.memory.add([{ x, y: metrics.memoryUsage }])
            }
        }
    }
}

function setupDetectionChart(lc) {
    const container = document.getElementById('detection-chart')
    if (!container) throw new Error('detection-chart container not found')
    
    const chart = lc.ChartXY({ container })
    chart.setTitle('Object Detection Confidence')
    
    // Bar chart for object classes
    const barSeries = chart.addBarSeries()
    
    return {
        updateDetections(detections) {
            // Count objects by class
            const classCounts = {}
            detections.forEach(obj => {
                classCounts[obj.class_name] = (classCounts[obj.class_name] || 0) + 1
            })
            
            // Update bar chart
            barSeries.clear()
            const data = Object.entries(classCounts).map(([className, count], index) => ({
                category: className,
                value: count
            }))
            
            // Simple numeric categories for now
            data.forEach((item, index) => {
                barSeries.add({ x: index, y: item.value })
            })
        }
    }
}

function setupLearningChart(lc) {
    const container = document.getElementById('learning-chart')
    if (!container) throw new Error('learning-chart container not found')
    
    const chart = lc.ChartXY({ container })
    chart.setTitle('Continuous Learning Progress')
    
    const lossSeries = chart.addLineSeries()
        .setName('Loss')
        .setStrokeStyle(stroke => stroke.setThickness(2))
    
    const accuracySeries = chart.addLineSeries()
        .setName('Accuracy')
        .setStrokeStyle(stroke => stroke.setThickness(2))
    
    return {
        addTrainingResult(result) {
            if (result.epoch !== undefined) {
                if (result.loss !== undefined) {
                    lossSeries.add([{ x: result.epoch, y: result.loss }])
                }
                if (result.accuracy !== undefined) {
                    accuracySeries.add([{ x: result.epoch, y: result.accuracy }])
                }
            }
        }
    }
}

function setupFusionChart(lc) {
    const container = document.getElementById('fusion-chart')
    if (!container) throw new Error('fusion-chart container not found')
    
    const chart = lc.ChartXY({ container })
    chart.setTitle('Sensor Fusion Status')
    
    const confidenceSeries = chart.addLineSeries()
        .setName('Overall Confidence')
        .setStrokeStyle(stroke => stroke.setThickness(3))
    
    let dataCount = 0
    
    return {
        updateFusion(fusedData) {
            const x = dataCount++
            confidenceSeries.add([{ x, y: fusedData.overall_confidence || 0 }])
        }
    }
}