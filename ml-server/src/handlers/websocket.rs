use axum::extract::ws::{Message, WebSocket};
use futures_util::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use tracing::{debug, error, info};

use crate::{
    models::{
        trajectory::TrajectoryPredictionInput,
        anomaly::{AnomalyDetectionInput, SensorData},
        objects::ObjectDetectionInput,
        fusion::FusionInput,
        InferenceRequest, InferenceResponse, MessageType, ModelType, WebSocketMessage,
    },
    state::AppState,
};

pub async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    info!("New WebSocket connection established");

    while let Some(msg) = socket.recv().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    if let Err(e) = handle_text_message(&mut socket, &state, text).await {
                        error!("Error handling message: {}", e);
                    }
                }
                Message::Binary(data) => {
                    if let Err(e) = handle_binary_message(&mut socket, &state, data).await {
                        error!("Error handling binary message: {}", e);
                    }
                }
                Message::Ping(data) => {
                    if socket.send(Message::Pong(data)).await.is_err() {
                        break;
                    }
                }
                Message::Close(_) => {
                    info!("WebSocket connection closed");
                    break;
                }
                _ => {}
            }
        } else {
            break;
        }
    }
}

async fn handle_text_message(
    socket: &mut WebSocket,
    state: &Arc<AppState>,
    text: String,
) -> anyhow::Result<()> {
    let message: WebSocketMessage = serde_json::from_str(&text)?;
    
    match message.message_type {
        MessageType::InferenceRequest => {
            let request: InferenceRequest = serde_json::from_value(message.payload)?;
            let start = std::time::Instant::now();
            
            let prediction = match request.model_type {
                ModelType::TrajectoryPrediction => {
                    let input: TrajectoryPredictionInput = serde_json::from_value(request.data)?;
                    let output = state.ml_engine.predict_trajectory(input).await?;
                    serde_json::to_value(output)?
                }
                ModelType::AnomalyDetection => {
                    let input: AnomalyDetectionInput = serde_json::from_value(request.data)?;
                    let output = state.ml_engine.detect_anomaly(input).await?;
                    serde_json::to_value(output)?
                }
                ModelType::ObjectDetection => {
                    let input: ObjectDetectionInput = serde_json::from_value(request.data)?;
                    let output = state.ml_engine.detect_objects(input).await?;
                    serde_json::to_value(output)?
                }
                ModelType::SensorFusion => {
                    let input: FusionInput = serde_json::from_value(request.data)?;
                    let output = state.ml_engine.fuse_sensors(input).await?;
                    serde_json::to_value(output)?
                }
            };
            
            let response = InferenceResponse {
                model_type: request.model_type,
                prediction,
                latency_ms: start.elapsed().as_secs_f64() * 1000.0,
                timestamp: chrono::Utc::now(),
            };
            
            let ws_response = WebSocketMessage {
                message_type: MessageType::InferenceResponse,
                payload: serde_json::to_value(response)?,
            };
            
            socket.send(Message::Text(serde_json::to_string(&ws_response)?)).await?;
        }
        MessageType::Heartbeat => {
            let response = WebSocketMessage {
                message_type: MessageType::Heartbeat,
                payload: serde_json::json!({ "timestamp": chrono::Utc::now() }),
            };
            socket.send(Message::Text(serde_json::to_string(&response)?)).await?;
        }
        _ => {
            debug!("Received unhandled message type: {:?}", message.message_type);
        }
    }
    
    Ok(())
}

async fn handle_binary_message(
    socket: &mut WebSocket,
    state: &Arc<AppState>,
    data: Vec<u8>,
) -> anyhow::Result<()> {
    // Handle binary messages with bincode for efficiency
    let message: WebSocketMessage = bincode::deserialize(&data)?;
    
    // Process similar to text messages but with binary response
    // For brevity, we'll just convert to text handling for now
    let text = serde_json::to_string(&message)?;
    handle_text_message(socket, state, text).await
}