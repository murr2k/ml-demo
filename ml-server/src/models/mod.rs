use serde::{Deserialize, Serialize};

pub mod trajectory;
pub mod anomaly;
pub mod objects;
pub mod fusion;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Hash, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ModelType {
    TrajectoryPrediction,
    AnomalyDetection,
    ObjectDetection,
    SensorFusion,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InferenceRequest {
    pub model_type: ModelType,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InferenceResponse {
    pub model_type: ModelType,
    pub prediction: serde_json::Value,
    pub latency_ms: f64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebSocketMessage {
    pub message_type: MessageType,
    pub payload: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MessageType {
    InferenceRequest,
    InferenceResponse,
    ModelUpdate,
    Error,
    Heartbeat,
}