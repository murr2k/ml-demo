# Issue: Redesign ML Demo Architecture for Better Performance

## Problem Statement

The current implementation suffers from severe performance issues:
- Browser becomes unresponsive during page load
- TensorFlow.js initialization blocks the main thread
- Heavy ML model initialization causes UI freezes
- Poor user experience with "Page Unresponsive" warnings

## Root Cause Analysis

1. **Client-side ML is too heavy**: Running TensorFlow.js and multiple ML models in the browser overwhelms the main thread
2. **Synchronous initialization**: Despite attempts at async loading, the libraries still block during initialization
3. **Resource constraints**: Browser tabs have limited CPU/memory compared to server environments

## Proposed Solution: Client-Server Architecture

### Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────┐
│   Browser Client    │         │    ML Server         │
├─────────────────────┤         ├──────────────────────┤
│ • LightningChart.js │ <────>  │ • ML Models         │
│ • UI Controls       │  HTTP/  │ • TensorFlow/PyTorch│
│ • Visualization     │   WS    │   OR Rust ML libs   │
│ • Event Handling    │         │ • Real-time inference│
└─────────────────────┘         └──────────────────────┘
```

### Key Design Decisions

1. **Keep in Browser**:
   - LightningChart.js for high-performance visualizations
   - UI controls and interactions
   - WebSocket client for real-time updates
   - State management for responsive UI

2. **Move to Server**:
   - All ML models and inference
   - TensorFlow or alternative ML framework
   - Data generation and processing
   - Model training and updates

3. **Communication Layer**:
   - WebSocket for real-time bidirectional communication
   - REST API for model configuration and control
   - Efficient binary protocols (e.g., MessagePack) for data transfer

## Implementation Options

### Option 1: Node.js + TensorFlow.js Backend
- **Pros**: Minimal code changes, shared TypeScript/JS codebase
- **Cons**: Still JavaScript performance limitations
- **Tech Stack**: Express.js, Socket.io, TensorFlow.js

### Option 2: Python FastAPI + PyTorch/TensorFlow
- **Pros**: Mature ML ecosystem, excellent library support
- **Cons**: Language split, deployment complexity
- **Tech Stack**: FastAPI, WebSockets, PyTorch/TensorFlow, NumPy

### Option 3: Rust ML Server (Recommended)
- **Pros**: 
  - Exceptional performance
  - Memory safety
  - Low latency for real-time inference
  - Small deployment footprint
- **Cons**: Smaller ML ecosystem, steeper learning curve
- **Tech Stack**: 
  - Web Framework: Axum or Actix-web
  - WebSocket: tokio-tungstenite
  - ML Libraries: Candle, SmartCore, or ONNX Runtime
  - Serialization: bincode or MessagePack

## Detailed Rust Implementation Plan

### Server Architecture

```rust
// Core components structure
ml-server/
├── Cargo.toml
├── src/
│   ├── main.rs           // Server entry point
│   ├── models/
│   │   ├── mod.rs
│   │   ├── trajectory.rs // Trajectory prediction model
│   │   ├── anomaly.rs    // Anomaly detection
│   │   ├── objects.rs    // Object detection
│   │   └── fusion.rs     // Sensor fusion
│   ├── handlers/
│   │   ├── websocket.rs  // WebSocket handlers
│   │   └── rest.rs       // REST API handlers
│   ├── ml/
│   │   ├── engine.rs     // ML inference engine
│   │   └── training.rs   // Continuous learning
│   └── state.rs          // Shared state management
```

### Key Features to Implement

1. **Real-time Inference Pipeline**
   ```rust
   // Example WebSocket message handler
   async fn handle_inference_request(
       model: Arc<Model>,
       request: InferenceRequest
   ) -> Result<InferenceResponse> {
       let prediction = model.predict(&request.data).await?;
       Ok(InferenceResponse { prediction, latency_ms })
   }
   ```

2. **Efficient Data Serialization**
   - Use bincode or MessagePack for compact binary format
   - Batch multiple predictions in single message
   - Implement compression for large datasets

3. **Model Hot-Swapping**
   - Load new models without server restart
   - A/B testing different model versions
   - Gradual rollout of model updates

### Client-Side Changes

1. **WebSocket Service**
   ```javascript
   class MLWebSocketService {
       constructor() {
           this.ws = new WebSocket('ws://localhost:8080/ml');
           this.setupHandlers();
       }
       
       async predict(data) {
           return this.sendRequest('predict', data);
       }
   }
   ```

2. **Visualization Updates**
   - Keep LightningChart.js as-is
   - Update data sources to use WebSocket streams
   - Add connection status indicators

## Migration Strategy

### Phase 1: Proof of Concept
1. Create minimal Rust ML server with one model
2. Implement WebSocket communication
3. Test with trajectory prediction only

### Phase 2: Full Migration
1. Port all ML models to server
2. Implement all API endpoints
3. Add monitoring and metrics

### Phase 3: Optimization
1. Add model caching and pooling
2. Implement horizontal scaling
3. Add GPU support (if needed)

## Benefits

1. **Performance**: 10-100x faster inference vs browser
2. **Scalability**: Easy horizontal scaling of ML servers
3. **Reliability**: No more browser freezes or crashes
4. **Flexibility**: Can use any ML framework/library
5. **Security**: Models stay on server, not exposed to client

## Metrics for Success

- Page load time: < 1 second
- First meaningful paint: < 500ms
- ML inference latency: < 50ms
- Zero browser freezes
- 60 FPS visualization performance

## Additional Considerations

1. **Deployment**: Docker containers for easy deployment
2. **Monitoring**: Prometheus + Grafana for metrics
3. **Caching**: Redis for frequently requested predictions
4. **Load Balancing**: nginx or HAProxy for multiple ML servers

## Next Steps

1. [ ] Evaluate Rust ML libraries (Candle vs SmartCore vs ONNX)
2. [ ] Create proof-of-concept server
3. [ ] Benchmark performance vs current implementation
4. [ ] Design WebSocket protocol specification
5. [ ] Plan incremental migration path

---

This redesign will transform the ML demo from a browser-constrained application to a high-performance, scalable system suitable for production use.