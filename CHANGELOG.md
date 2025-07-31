# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-07-31

### Added
- 🦀 **Rust ML Server** - High-performance backend for ML inference (Issue #5)
- 🔌 **WebSocket Communication** - Real-time bidirectional data streaming
- 📡 **Client-Server Architecture** - Separated computation from visualization
- 🚀 **Instant Page Load** - No more browser freezing on initialization
- 📊 **Safe Chart Initialization** - Fallback mechanisms for chart errors
- 🔧 **ML WebSocket Service** - Dedicated service for server communication
- 📝 **Debug Tools** - WebSocket debug console and testing utilities

### Changed
- 🏗️ **Complete Architecture Redesign** - Moved from browser-based ML to server-based
- 📈 **Performance Improvements** - ML inference now happens on Rust server
- 🎯 **Simplified Frontend** - Browser only handles visualization with LightningChart.js
- 🔄 **Async Model Loading** - Models load progressively without blocking UI
- 🛠️ **Build Process** - Added Rust compilation step for ML server

### Fixed
- ❌ **Browser Freezing** - Page no longer becomes unresponsive on load
- 🐛 **Chart Initialization Errors** - Fixed LightningChart color API issues
- 🔧 **Memory Leaks** - Proper cleanup of WebSocket connections
- 📊 **Data Flow Issues** - Reliable request/response matching

### Removed
- 🗑️ **TensorFlow.js from Browser** - ML inference moved to server
- 🗑️ **Heavy Client-Side Models** - All models now run on Rust server

### Technical Details
- **Frontend**: Pure visualization layer with LightningChart.js
- **Backend**: Rust server using Axum web framework
- **Communication**: WebSocket with JSON/binary message support
- **ML Libraries**: Simplified ML implementations in Rust
- **Performance**: Sub-50ms inference latency

## [1.0.0] - 2025-01-30

### Added
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

## [0.9.0] - 2025-01-30 - Pre-release

### Fixed
- LightningChart license configuration
- Added error handling and logging
- Improved chart initialization
- Added fallbacks for missing chart types