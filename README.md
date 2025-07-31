# Autonomous Vehicle ML Demo

A high-performance machine learning demonstration showcasing real-time capabilities for autonomous vehicle technology, featuring a Rust ML inference server and browser-based visualization with LightningChart JS.

![CI Pipeline](https://github.com/murr2k/ml-demo/workflows/CI%20Pipeline/badge.svg)
![Deploy](https://github.com/murr2k/ml-demo/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Rust](https://img.shields.io/badge/Rust-1.75+-orange.svg)
![LightningChart](https://img.shields.io/badge/LightningChart-7.1.2-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-blue.svg)](https://github.com/murr2k/ml-demo/network/dependencies)

## 🚀 Overview

This demo showcases advanced machine learning capabilities relevant to autonomous vehicle systems, demonstrating the kind of end-to-end ML systems that companies like Motional are developing. The project features a **client-server architecture** with ML inference running on a high-performance Rust server, while the browser handles only visualization. This separation ensures instant page loads and responsive UI, eliminating the browser freezing issues common with heavy client-side ML workloads.

## ✨ Features

### 1. **Trajectory Prediction** 🚗

- LSTM-based neural network for real-time path prediction
- Physics-based trajectory smoothing
- Multi-agent support with visual tracking
- Confidence-based prediction visualization

### 2. **Sensor Anomaly Detection** 📡

- Autoencoder-based anomaly detection system
- Real-time monitoring of 5 sensor types (LiDAR, Camera, Radar, IMU, GPS)
- Configurable detection thresholds
- Visual anomaly highlighting

### 3. **Object Detection Confidence** 🎯

- Multi-class object detection simulation
- Support for vehicles, pedestrians, cyclists, and traffic infrastructure
- Bounding box visualization with confidence scores
- Object tracking between frames

### 4. **Model Performance Metrics** 📊

- Real-time inference time tracking
- FPS monitoring and visualization
- CPU and memory usage dashboards
- Comprehensive performance analytics

### 5. **Continuous Learning Progress** 🧠

- Online learning simulation
- Training progress visualization
- Model versioning and checkpointing
- Performance improvement tracking

### 6. **Real-time Sensor Fusion** 🔄

- 3D visualization of fused sensor data
- Individual sensor contribution tracking
- Confidence-based fusion algorithms
- Real-time latency monitoring

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Backend**: Rust with Axum web framework
- **Communication**: WebSocket for real-time bidirectional data
- **ML Server**: Custom Rust implementations for high performance
- **Visualization**: LightningChart JS
- **Build Tools**: Vite (frontend), Cargo (backend)
- **Testing**: Playwright
- **Package Manager**: npm (frontend), cargo (backend)

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- Rust (1.75.0 or higher)
- npm or yarn
- Modern web browser with WebGL support
- Git

## 🔧 Installation

1. Clone the repository:

```bash
git clone https://github.com/murr2k/ml-demo.git
cd ml-demo
```

2. Install frontend dependencies:

```bash
npm install
```

3. Build and start the Rust ML server:

```bash
cd ml-server
cargo build --release
cargo run --release
```

4. In a new terminal, start the frontend development server:

```bash
npm run dev
```

5. Open your browser to `http://localhost:5173/`

The Rust ML server runs on port 8080 and handles all ML inference requests via WebSocket.

## 📖 Usage Guide

### Trajectory Prediction Panel

- **Start Prediction**: Begin real-time trajectory prediction for all active agents
- **Add Vehicle**: Create new agents with random movement patterns
- **Clear**: Remove all agents and predictions
- Watch as the ML model predicts future paths (shown as semi-transparent lines)

### Sensor Anomaly Detection Panel

- **Start Monitoring**: Begin real-time sensor data streaming
- **Inject Anomaly**: Manually trigger an anomalous reading
- **Reset**: Clear all sensor data
- **Threshold Slider**: Adjust detection sensitivity (0.5-1.0)

### Object Detection Panel

- **Start Detection**: Begin object detection simulation
- **Simulate Scene**: Create a complex traffic scenario
- Objects are color-coded by type with confidence-based transparency

### Continuous Learning Panel

- **Train Iteration**: Simulate one epoch of model training
- **Load Checkpoint**: Restore a previous model state
- Watch loss decrease and accuracy improve over time

### Sensor Fusion Panel

- **Toggle Sensors**: Enable/disable individual sensors (LiDAR, Camera, Radar)
- View 3D visualization of integrated sensor data
- Monitor sensor health status in real-time

## 🏗️ Architecture

```
ml-demo/
├── src/                     # Frontend source
│   ├── main-websocket.js    # Application entry point
│   ├── services/            # Service layer
│   │   └── mlWebSocket.js   # WebSocket client for ML server
│   ├── models/              # Client-side model interfaces
│   │   ├── trajectoryPredictor.js    # Trajectory visualization
│   │   ├── anomalyDetector.js        # Anomaly monitoring
│   │   ├── objectDetector.js         # Object detection display
│   │   ├── continuousLearner.js      # Learning progress UI
│   │   └── sensorFusion.js           # Sensor fusion display
│   └── visualization/       # Chart setup and management
│       └── charts.js        # LightningChart configurations
├── ml-server/               # Rust ML backend
│   ├── src/
│   │   ├── main.rs          # Server entry point
│   │   ├── handlers/        # WebSocket & REST handlers
│   │   ├── models/          # ML model implementations
│   │   └── state.rs         # Application state
│   └── Cargo.toml           # Rust dependencies
├── public/                  # Static assets
├── index.html              # Main HTML with UI layout
├── package.json            # Frontend dependencies
├── vite.config.js          # Frontend build config
├── tests/                  # Playwright tests
├── CHANGELOG.md            # Version history
├── LICENSE                 # MIT License
└── README.md               # This file
```

## 🧪 Testing

Run the automated tests:

```bash
# Frontend tests
npx playwright test

# Backend tests
cd ml-server && cargo test
```

This will:

- Launch a headless browser
- Verify all charts render correctly
- Test WebSocket communication
- Validate ML inference pipeline
- Test interactive controls
- Validate data flow

## 🚀 Building for Production

```bash
# Build frontend
npm run build

# Build Rust server
cd ml-server
cargo build --release
```

The optimized frontend build will be in the `dist/` directory.
The Rust server binary will be in `ml-server/target/release/`.

## 🔍 Technical Details

### Architecture Benefits

- **Instant Page Load**: No heavy ML models to download or initialize in browser
- **Better Performance**: Rust server provides sub-50ms inference latency
- **Scalability**: Can handle multiple client connections simultaneously
- **Resource Efficiency**: Browser only handles visualization, not computation

### Machine Learning Models (Server-Side)

1. **Trajectory Predictor**: High-performance trajectory prediction
2. **Anomaly Detector**: Real-time anomaly detection system
3. **Object Detector**: Multi-class object detection
4. **Continuous Learner**: Simulates online learning
5. **Sensor Fusion**: Multi-sensor data integration

### Performance Optimizations

- WebGL acceleration for chart rendering
- Efficient WebSocket message protocol
- Rust's zero-cost abstractions for ML inference
- Async/await for non-blocking operations
- Connection pooling and request batching

## 📈 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Latest: v2.0.0 (2025-07-31)
- 🦀 Complete architecture redesign with Rust ML server
- 🔌 WebSocket real-time communication
- 🚀 Eliminated browser freezing issues
- 📊 Improved performance and scalability

## 🐛 Known Issues

- 3D charts fall back to 2D on some systems
- Performance metrics are simulated, not actual system metrics
- WebSocket reconnection may take a few seconds after server restart

## 🔮 Future Enhancements

- Integration with real sensor data streams
- Support for custom ML model uploads (ONNX)
- Multi-GPU support in Rust server
- Enhanced 3D visualization capabilities
- Multi-vehicle coordination scenarios
- Edge deployment simulation
- Kubernetes deployment manifests
- Real hardware integration
- gRPC support alongside WebSocket

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [LightningChart JS](https://lightningchart.com/) for high-performance visualization
- Powered by [Rust](https://www.rust-lang.org/) and [Axum](https://github.com/tokio-rs/axum) for the ML server
- Inspired by autonomous vehicle technology from companies like [Motional](https://motional.com/)
- Frontend tooling with [Vite](https://vitejs.dev/) for fast development
- WebSocket protocol for real-time communication

## 📧 Contact

**Murray Kopit**

- GitHub: [@murr2k](https://github.com/murr2k)
- Email: murr2k@gmail.com

---

_This demo is designed to showcase technological capabilities for prospective clients and employers. It demonstrates proficiency in machine learning, real-time systems, client-server architectures, Rust development, and modern web technologies relevant to the autonomous vehicle industry._
