export class SensorFusion {
    constructor() {
        this.sensorStates = {
            lidar: { active: true, quality: 1.0, data: [] },
            camera: { active: true, quality: 1.0, data: [] },
            radar: { active: true, quality: 1.0, data: [] },
        }
        this.fusionHistory = []
        this.kalmanFilter = this.initializeKalmanFilter()
    }

    initializeKalmanFilter() {
        // Simplified Kalman filter parameters
        return {
            x: [0, 0, 0, 0], // [x, y, vx, vy]
            P: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1],
            ], // Covariance
            Q: 0.1, // Process noise
            R: 0.5, // Measurement noise
        }
    }

    fuseData(sensorConfig) {
        const timestamp = Date.now()

        // Generate sensor data based on active sensors
        const lidarData = sensorConfig.lidar ? this.generateLidarData() : null
        const cameraData = sensorConfig.camera ? this.generateCameraData() : null
        const radarData = sensorConfig.radar ? this.generateRadarData() : null

        // Apply sensor fusion algorithm
        const fusedResult = this.performFusion(lidarData, cameraData, radarData)

        // Update history
        this.fusionHistory.push({
            timestamp,
            fusedData: fusedResult,
            activeSensors: Object.keys(sensorConfig).filter(k => sensorConfig[k]),
        })

        if (this.fusionHistory.length > 100) {
            this.fusionHistory.shift()
        }

        return {
            fusedData: fusedResult,
            sensorContributions: this.calculateContributions(sensorConfig),
            confidence: this.calculateFusionConfidence(sensorConfig),
            latency: Math.random() * 5 + 2, // 2-7ms
        }
    }

    generateLidarData() {
        // Generate point cloud data
        const points = []
        const numPoints = 64 // Simplified from real LiDAR

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2
            const distance = 10 + Math.random() * 50

            points.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                z: Math.random() * 3 - 1.5,
                intensity: Math.random() * 255,
            })
        }

        // Add some objects
        if (Math.random() > 0.3) {
            // Add a vehicle
            const vehicleX = (Math.random() - 0.5) * 40
            const vehicleY = 10 + Math.random() * 20

            for (let i = 0; i < 20; i++) {
                points.push({
                    x: vehicleX + (Math.random() - 0.5) * 4,
                    y: vehicleY + (Math.random() - 0.5) * 2,
                    z: Math.random() * 1.5,
                    intensity: 200 + Math.random() * 55,
                })
            }
        }

        return {
            pointCloud: points,
            timestamp: Date.now(),
            quality: 0.9 + Math.random() * 0.1,
        }
    }

    generateCameraData() {
        // Simulate camera object detection
        const detections = []
        const numObjects = Math.floor(Math.random() * 4) + 1

        for (let i = 0; i < numObjects; i++) {
            detections.push({
                type: ['vehicle', 'pedestrian', 'cyclist'][Math.floor(Math.random() * 3)],
                bbox: {
                    x: Math.random() * 0.8,
                    y: Math.random() * 0.8,
                    width: 0.05 + Math.random() * 0.15,
                    height: 0.05 + Math.random() * 0.15,
                },
                confidence: 0.7 + Math.random() * 0.3,
                distance: 5 + Math.random() * 45, // Estimated from monocular
            })
        }

        return {
            detections,
            timestamp: Date.now(),
            quality: 0.85 + Math.random() * 0.15,
            illumination: 0.5 + Math.sin(Date.now() / 10000) * 0.3,
        }
    }

    generateRadarData() {
        // Generate radar velocity and range data
        const targets = []
        const numTargets = Math.floor(Math.random() * 6) + 2

        for (let i = 0; i < numTargets; i++) {
            targets.push({
                range: 10 + Math.random() * 90,
                azimuth: (Math.random() - 0.5) * Math.PI,
                velocity: (Math.random() - 0.5) * 30, // -15 to +15 m/s
                rcs: Math.random() * 10 + 5, // Radar cross section
                snr: Math.random() * 20 + 10, // Signal-to-noise ratio
            })
        }

        return {
            targets,
            timestamp: Date.now(),
            quality: 0.95 + Math.random() * 0.05,
        }
    }

    performFusion(lidarData, cameraData, radarData) {
        const fusedObjects = []

        // Simple fusion logic - in reality this would be much more complex
        // Start with LiDAR clusters if available
        if (lidarData) {
            const clusters = this.clusterLidarPoints(lidarData.pointCloud)
            clusters.forEach((cluster, idx) => {
                fusedObjects.push({
                    id: `obj_${idx}`,
                    position: cluster.center,
                    size: cluster.size,
                    confidence: 0.9,
                    sources: ['lidar'],
                })
            })
        }

        // Match and enhance with camera detections
        if (cameraData) {
            cameraData.detections.forEach(detection => {
                // Try to match with existing objects
                const matched = this.findMatchingObject(fusedObjects, detection)
                if (matched) {
                    matched.type = detection.type
                    matched.confidence = (matched.confidence + detection.confidence) / 2
                    matched.sources.push('camera')
                } else {
                    // Add new object from camera
                    fusedObjects.push({
                        id: `cam_obj_${Date.now()}_${Math.random()}`,
                        type: detection.type,
                        position: this.estimatePositionFromCamera(detection),
                        confidence: detection.confidence * 0.8,
                        sources: ['camera'],
                    })
                }
            })
        }

        // Add velocity information from radar
        if (radarData) {
            radarData.targets.forEach(target => {
                const matched = this.findMatchingObjectByPosition(fusedObjects, target)
                if (matched) {
                    matched.velocity = {
                        radial: target.velocity,
                        azimuth: target.azimuth,
                    }
                    matched.sources.push('radar')
                    matched.confidence = Math.min(1, matched.confidence * 1.1)
                }
            })
        }

        return fusedObjects
    }

    clusterLidarPoints(points) {
        // Simplified clustering - in reality would use DBSCAN or similar
        const clusters = []
        const gridSize = 5 // 5 meter grid
        const grid = {}

        points.forEach(point => {
            const gridX = Math.floor(point.x / gridSize)
            const gridY = Math.floor(point.y / gridSize)
            const key = `${gridX},${gridY}`

            if (!grid[key]) {
                grid[key] = []
            }
            grid[key].push(point)
        })

        Object.values(grid).forEach(cellPoints => {
            if (cellPoints.length > 5) {
                const center = {
                    x: cellPoints.reduce((sum, p) => sum + p.x, 0) / cellPoints.length,
                    y: cellPoints.reduce((sum, p) => sum + p.y, 0) / cellPoints.length,
                    z: cellPoints.reduce((sum, p) => sum + p.z, 0) / cellPoints.length,
                }

                const size = {
                    width: Math.max(...cellPoints.map(p => p.x)) - Math.min(...cellPoints.map(p => p.x)),
                    height: Math.max(...cellPoints.map(p => p.y)) - Math.min(...cellPoints.map(p => p.y)),
                    depth: Math.max(...cellPoints.map(p => p.z)) - Math.min(...cellPoints.map(p => p.z)),
                }

                clusters.push({ center, size, points: cellPoints.length })
            }
        })

        return clusters
    }

    findMatchingObject(objects, detection) {
        // Simple matching based on position
        // In reality would use Hungarian algorithm or similar
        return objects.find(obj => {
            if (!obj.position) return false
            // Convert camera bbox to world position and check distance
            const estPos = this.estimatePositionFromCamera(detection)
            const dist = Math.sqrt(Math.pow(obj.position.x - estPos.x, 2) + Math.pow(obj.position.y - estPos.y, 2))
            return dist < 5 // Within 5 meters
        })
    }

    findMatchingObjectByPosition(objects, radarTarget) {
        const radarX = Math.cos(radarTarget.azimuth) * radarTarget.range
        const radarY = Math.sin(radarTarget.azimuth) * radarTarget.range

        return objects.find(obj => {
            if (!obj.position) return false
            const dist = Math.sqrt(Math.pow(obj.position.x - radarX, 2) + Math.pow(obj.position.y - radarY, 2))
            return dist < 3 // Within 3 meters
        })
    }

    estimatePositionFromCamera(detection) {
        // Simple estimation - in reality would use calibrated camera model
        return {
            x: (detection.bbox.x - 0.5) * detection.distance * 2,
            y: detection.distance,
            z: (0.5 - detection.bbox.y) * detection.distance * 0.5,
        }
    }

    calculateContributions(sensorConfig) {
        const active = Object.values(sensorConfig).filter(v => v).length
        if (active === 0) return { lidar: 0, camera: 0, radar: 0 }

        // Weight based on sensor characteristics
        const weights = {
            lidar: sensorConfig.lidar ? 0.4 : 0,
            camera: sensorConfig.camera ? 0.35 : 0,
            radar: sensorConfig.radar ? 0.25 : 0,
        }

        const total = Object.values(weights).reduce((a, b) => a + b, 0)

        return {
            lidar: total > 0 ? ((weights.lidar / total) * 100).toFixed(0) : 0,
            camera: total > 0 ? ((weights.camera / total) * 100).toFixed(0) : 0,
            radar: total > 0 ? ((weights.radar / total) * 100).toFixed(0) : 0,
        }
    }

    calculateFusionConfidence(sensorConfig) {
        const activeSensors = Object.values(sensorConfig).filter(v => v).length

        // Higher confidence with more sensors
        const baseConfidence = 0.6
        const sensorBonus = 0.15 * activeSensors

        return Math.min(1, baseConfidence + sensorBonus + Math.random() * 0.05)
    }
}
