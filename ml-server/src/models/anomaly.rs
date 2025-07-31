use serde::{Deserialize, Serialize};
use ndarray::{Array1, Array2};
use rand::Rng;

#[derive(Debug, Serialize, Deserialize)]
pub struct SensorData {
    pub sensor_type: String,
    pub values: Vec<f32>,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnomalyDetectionInput {
    pub sensor_readings: Vec<SensorData>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnomalyDetectionOutput {
    pub anomaly_score: f32,
    pub is_anomaly: bool,
    pub threshold: f32,
    pub sensor_scores: Vec<(String, f32)>,
}

pub struct AnomalyDetector {
    threshold: f32,
    // In production, this would be an autoencoder or isolation forest
}

impl AnomalyDetector {
    pub fn new() -> Self {
        Self {
            threshold: 0.85,
        }
    }

    pub fn detect(&self, input: &AnomalyDetectionInput) -> AnomalyDetectionOutput {
        let mut rng = rand::thread_rng();
        let mut sensor_scores = Vec::new();
        
        // Calculate anomaly score for each sensor
        for sensor in &input.sensor_readings {
            let mean = sensor.values.iter().sum::<f32>() / sensor.values.len() as f32;
            let variance = sensor.values.iter()
                .map(|x| (x - mean).powi(2))
                .sum::<f32>() / sensor.values.len() as f32;
            
            // Simple anomaly score based on variance
            let score = variance.sqrt() / (mean + 0.001);
            sensor_scores.push((sensor.sensor_type.clone(), score));
        }
        
        // Overall anomaly score
        let anomaly_score = sensor_scores.iter()
            .map(|(_, score)| score)
            .sum::<f32>() / sensor_scores.len() as f32
            + rng.gen_range(-0.1..0.1);
        
        AnomalyDetectionOutput {
            anomaly_score,
            is_anomaly: anomaly_score > self.threshold,
            threshold: self.threshold,
            sensor_scores,
        }
    }

    pub fn update_threshold(&mut self, new_threshold: f32) {
        self.threshold = new_threshold;
    }
}