use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;

use crate::{
    models::{
        trajectory::TrajectoryPredictionInput,
        anomaly::AnomalyDetectionInput,
        objects::ObjectDetectionInput,
        fusion::FusionInput,
        InferenceRequest, InferenceResponse, ModelType,
    },
    state::AppState,
};

pub async fn list_models() -> impl IntoResponse {
    Json(vec![
        ModelType::TrajectoryPrediction,
        ModelType::AnomalyDetection,
        ModelType::ObjectDetection,
        ModelType::SensorFusion,
    ])
}

pub async fn inference(
    Path(model): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(request): Json<serde_json::Value>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let model_type = match model.as_str() {
        "trajectory" => ModelType::TrajectoryPrediction,
        "anomaly" => ModelType::AnomalyDetection,
        "objects" => ModelType::ObjectDetection,
        "fusion" => ModelType::SensorFusion,
        _ => {
            return Err((
                StatusCode::BAD_REQUEST,
                format!("Unknown model: {}", model),
            ))
        }
    };
    
    let start = std::time::Instant::now();
    
    let prediction = match model_type {
        ModelType::TrajectoryPrediction => {
            let input: TrajectoryPredictionInput = serde_json::from_value(request)
                .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            let output = state.ml_engine.predict_trajectory(input).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            serde_json::to_value(output)
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        }
        ModelType::AnomalyDetection => {
            let input: AnomalyDetectionInput = serde_json::from_value(request)
                .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            let output = state.ml_engine.detect_anomaly(input).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            serde_json::to_value(output)
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        }
        ModelType::ObjectDetection => {
            let input: ObjectDetectionInput = serde_json::from_value(request)
                .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            let output = state.ml_engine.detect_objects(input).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            serde_json::to_value(output)
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        }
        ModelType::SensorFusion => {
            let input: FusionInput = serde_json::from_value(request)
                .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            let output = state.ml_engine.fuse_sensors(input).await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            serde_json::to_value(output)
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        }
    };
    
    let response = InferenceResponse {
        model_type,
        prediction,
        latency_ms: start.elapsed().as_secs_f64() * 1000.0,
        timestamp: chrono::Utc::now(),
    };
    
    Ok(Json(response))
}