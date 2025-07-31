// ML WebSocket Service
export class MLWebSocketService {
    constructor() {
        this.ws = null
        this.messageHandlers = new Map()
        this.requestQueue = new Map()
        this.isConnected = false
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.reconnectDelay = 1000
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket('ws://localhost:8080/ws')
                
                this.ws.onopen = () => {
                    console.log('Connected to ML server')
                    this.isConnected = true
                    this.reconnectAttempts = 0
                    this.sendHeartbeat()
                    resolve()
                }

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data)
                }

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error)
                    reject(error)
                }

                this.ws.onclose = () => {
                    console.log('Disconnected from ML server')
                    this.isConnected = false
                    this.attemptReconnect()
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    handleMessage(data) {
        try {
            const message = JSON.parse(data)
            
            switch (message.message_type) {
                case 'inference_response':
                    this.handleInferenceResponse(message.payload)
                    break
                case 'heartbeat':
                    // Keep connection alive
                    break
                case 'error':
                    console.error('Server error:', message.payload)
                    break
                default:
                    console.log('Unknown message type:', message.message_type)
            }
        } catch (error) {
            console.error('Error parsing message:', error)
        }
    }

    handleInferenceResponse(response) {
        // Find the first matching request for this model type
        let handled = false
        for (const [requestId, handler] of this.requestQueue.entries()) {
            if (handler.modelType === response.model_type) {
                handler.resolve(response)
                this.requestQueue.delete(requestId)
                handled = true
                break
            }
        }
        
        // Also notify any registered handlers
        const modelHandlers = this.messageHandlers.get(response.model_type)
        if (modelHandlers) {
            modelHandlers.forEach(handler => handler(response))
        }
    }

    sendHeartbeat() {
        if (this.isConnected) {
            this.send({
                message_type: 'heartbeat',
                payload: { timestamp: new Date().toISOString() }
            })
            setTimeout(() => this.sendHeartbeat(), 30000) // Every 30 seconds
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
            
            setTimeout(() => {
                this.connect().catch(err => {
                    console.error('Reconnection failed:', err)
                })
            }, this.reconnectDelay * this.reconnectAttempts)
        }
    }

    send(message) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        } else {
            console.error('WebSocket is not connected')
        }
    }

    // Model-specific methods
    async predictTrajectory(history, predictionHorizon = 20) {
        const request = {
            message_type: 'inference_request',
            payload: {
                model_type: 'trajectory_prediction',
                data: {
                    history: history,
                    prediction_horizon: predictionHorizon
                }
            }
        }
        
        return this.sendRequest(request)
    }

    async detectAnomaly(sensorReadings) {
        const request = {
            message_type: 'inference_request',
            payload: {
                model_type: 'anomaly_detection',
                data: {
                    sensor_readings: sensorReadings
                }
            }
        }
        
        return this.sendRequest(request)
    }

    async detectObjects(frameId, simulateComplex = false) {
        const request = {
            message_type: 'inference_request',
            payload: {
                model_type: 'object_detection',
                data: {
                    frame_id: frameId,
                    timestamp: Date.now(),
                    simulate_complex: simulateComplex
                }
            }
        }
        
        return this.sendRequest(request)
    }

    async fuseSensors(sensorData) {
        const request = {
            message_type: 'inference_request',
            payload: {
                model_type: 'sensor_fusion',
                data: {
                    sensor_data: sensorData,
                    timestamp: Date.now()
                }
            }
        }
        
        return this.sendRequest(request)
    }

    sendRequest(request) {
        return new Promise((resolve, reject) => {
            const requestId = `${request.payload.model_type}_${Date.now()}_${Math.random()}`
            
            this.requestQueue.set(requestId, { resolve, reject, modelType: request.payload.model_type })
            
            // Set timeout
            setTimeout(() => {
                if (this.requestQueue.has(requestId)) {
                    this.requestQueue.delete(requestId)
                    reject(new Error('Request timeout'))
                }
            }, 5000)
            
            this.send(request)
        })
    }

    // Subscribe to model updates
    subscribe(modelType, handler) {
        if (!this.messageHandlers.has(modelType)) {
            this.messageHandlers.set(modelType, new Set())
        }
        this.messageHandlers.get(modelType).add(handler)
        
        // Return unsubscribe function
        return () => {
            const handlers = this.messageHandlers.get(modelType)
            if (handlers) {
                handlers.delete(handler)
            }
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }
}

// Create singleton instance
export const mlWebSocket = new MLWebSocketService()