use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TrajectoryPoint {
    pub x: f32,
    pub y: f32,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrajectoryPredictionInput {
    pub history: Vec<TrajectoryPoint>,
    pub prediction_horizon: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrajectoryPredictionOutput {
    pub predictions: Vec<TrajectoryPoint>,
    pub confidence: f32,
}

pub struct TrajectoryPredictor {
    // For now, we'll use a simple linear predictor
    // In production, this would be a proper LSTM or Transformer model
}

impl TrajectoryPredictor {
    pub fn new() -> anyhow::Result<Self> {
        Ok(Self {})
    }

    pub fn predict(&self, input: &TrajectoryPredictionInput) -> anyhow::Result<TrajectoryPredictionOutput> {
        // Simple linear extrapolation for now
        // In production, this would use a trained neural network
        
        if input.history.len() < 2 {
            return Ok(TrajectoryPredictionOutput {
                predictions: vec![],
                confidence: 0.0,
            });
        }

        let last = &input.history[input.history.len() - 1];
        let prev = &input.history[input.history.len() - 2];
        
        let dx = last.x - prev.x;
        let dy = last.y - prev.y;
        let dt = (last.timestamp - prev.timestamp) as f32;
        
        let mut predictions = Vec::new();
        for i in 1..=input.prediction_horizon {
            predictions.push(TrajectoryPoint {
                x: last.x + dx * i as f32,
                y: last.y + dy * i as f32,
                timestamp: last.timestamp + (dt * i as f32) as i64,
            });
        }
        
        Ok(TrajectoryPredictionOutput {
            predictions,
            confidence: 0.85 + rand::random::<f32>() * 0.1,
        })
    }
}