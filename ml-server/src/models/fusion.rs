use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct SensorStatus {
    pub sensor_type: String,
    pub is_active: bool,
    pub confidence: f32,
    pub last_update: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FusionInput {
    pub sensor_data: HashMap<String, bool>,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FusionOutput {
    pub overall_confidence: f32,
    pub sensor_statuses: Vec<SensorStatus>,
    pub fusion_quality: String,
}

pub struct SensorFusion {
    sensor_weights: HashMap<String, f32>,
}

impl SensorFusion {
    pub fn new() -> Self {
        let mut sensor_weights = HashMap::new();
        sensor_weights.insert("lidar".to_string(), 0.4);
        sensor_weights.insert("camera".to_string(), 0.35);
        sensor_weights.insert("radar".to_string(), 0.25);
        
        Self { sensor_weights }
    }

    pub fn fuse(&self, input: &FusionInput) -> FusionOutput {
        let mut sensor_statuses = Vec::new();
        let mut total_weight = 0.0;
        let mut weighted_confidence = 0.0;
        
        for (sensor_type, is_active) in &input.sensor_data {
            let weight = self.sensor_weights.get(sensor_type).unwrap_or(&0.2);
            let confidence = if *is_active {
                0.9 + rand::random::<f32>() * 0.1
            } else {
                0.0
            };
            
            if *is_active {
                total_weight += weight;
                weighted_confidence += weight * confidence;
            }
            
            sensor_statuses.push(SensorStatus {
                sensor_type: sensor_type.clone(),
                is_active: *is_active,
                confidence,
                last_update: input.timestamp,
            });
        }
        
        let overall_confidence = if total_weight > 0.0 {
            weighted_confidence / total_weight
        } else {
            0.0
        };
        
        let fusion_quality = match overall_confidence {
            c if c >= 0.8 => "excellent",
            c if c >= 0.6 => "good",
            c if c >= 0.4 => "fair",
            _ => "poor",
        }.to_string();
        
        FusionOutput {
            overall_confidence,
            sensor_statuses,
            fusion_quality,
        }
    }
}