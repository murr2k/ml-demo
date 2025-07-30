# Autonomous Vehicle ML Demo

A comprehensive machine learning demonstration showcasing real-time capabilities for autonomous vehicle technology, built with TensorFlow.js and LightningChart JS.

![CI Pipeline](https://github.com/murr2k/ml-demo/workflows/CI%20Pipeline/badge.svg)
![Deploy](https://github.com/murr2k/ml-demo/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.22.0-orange.svg)
![LightningChart](https://img.shields.io/badge/LightningChart-7.1.2-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-blue.svg)](https://github.com/murr2k/ml-demo/network/dependencies)

## 🚀 Overview

This demo showcases advanced machine learning capabilities relevant to autonomous vehicle systems, demonstrating the kind of end-to-end ML systems that companies like Motional are developing. The project emphasizes real-time performance, multi-sensor fusion, and continuous learning - all key components of modern autonomous vehicle technology.

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
- **ML Framework**: TensorFlow.js
- **Visualization**: LightningChart JS
- **Build Tool**: Vite
- **Testing**: Playwright
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- npm or yarn
- Modern web browser with WebGL support
- Git

## 🔧 Installation

1. Clone the repository:

```bash
git clone https://github.com/murr2k/ml-demo.git
cd ml-demo
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to `http://localhost:5173/`

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
├── src/
│   ├── main.js              # Application entry point
│   ├── models/              # ML model implementations
│   │   ├── trajectoryPredictor.js    # LSTM for path prediction
│   │   ├── anomalyDetector.js        # Autoencoder for anomalies
│   │   ├── objectDetector.js         # Object detection simulation
│   │   ├── continuousLearner.js      # Online learning system
│   │   └── sensorFusion.js           # Multi-sensor integration
│   └── visualization/       # Chart setup and management
│       └── charts.js        # LightningChart configurations
├── public/                  # Static assets
├── index.html              # Main HTML with UI layout
├── package.json            # Dependencies and scripts
├── vite.config.js          # Build configuration
├── test.js                 # Playwright tests
├── LICENSE                 # MIT License
└── README.md               # This file
```

## 🧪 Testing

Run the automated tests:

```bash
npx playwright test
```

This will:

- Launch a headless browser
- Verify all charts render correctly
- Test interactive controls
- Validate data flow

## 🚀 Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## 🔍 Technical Details

### Machine Learning Models

1. **Trajectory Predictor**: Uses a 2-layer LSTM with 64 and 32 units
2. **Anomaly Detector**: Autoencoder with encoding dimension of 3
3. **Object Detector**: Simplified CNN architecture for demonstration
4. **Continuous Learner**: Simulates federated learning capabilities

### Performance Optimizations

- WebGL acceleration for chart rendering
- Efficient data structures for real-time updates
- Batched TensorFlow.js operations
- Progressive data loading for large datasets

## 📈 Changelog

### v1.0.0 (2025-01-30)

- Initial release
- Implemented 6 core ML demonstrations
- Real-time visualization with LightningChart JS
- TensorFlow.js integration for browser-based ML
- Comprehensive UI with interactive controls
- Performance monitoring dashboards
- Added trajectory prediction with LSTM
- Sensor anomaly detection with autoencoders
- Object detection confidence visualization
- Continuous learning simulation
- Multi-sensor fusion with 3D visualization
- Responsive design for various screen sizes

### v0.9.0 (2025-01-30) - Pre-release

- Fixed LightningChart license configuration
- Added error handling and logging
- Improved chart initialization
- Added fallbacks for missing chart types

## 🐛 Known Issues

- Charts may not render data on first load (refresh to fix)
- 3D charts fall back to 2D on some systems
- Performance metrics are simulated, not actual system metrics

## 🔮 Future Enhancements

- Integration with real sensor data streams
- Support for custom ML model uploads
- WebRTC for distributed computing
- Enhanced 3D visualization capabilities
- Multi-vehicle coordination scenarios
- Edge deployment simulation
- ONNX model support
- Real hardware integration

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
- Powered by [TensorFlow.js](https://www.tensorflow.org/js) for browser-based machine learning
- Inspired by autonomous vehicle technology from companies like [Motional](https://motional.com/)
- Created with [Vite](https://vitejs.dev/) for fast development

## 📧 Contact

**Murray Kopit**

- GitHub: [@murr2k](https://github.com/murr2k)
- Email: murr2k@gmail.com

---

_This demo is designed to showcase technological capabilities for prospective clients and employers. It demonstrates proficiency in machine learning, real-time systems, and modern web technologies relevant to the autonomous vehicle industry._
