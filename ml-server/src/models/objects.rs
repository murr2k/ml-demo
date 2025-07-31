use serde::{Deserialize, Serialize};
use rand::Rng;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BoundingBox {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DetectedObject {
    pub id: String,
    pub class_name: String,
    pub confidence: f32,
    pub bounding_box: BoundingBox,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObjectDetectionInput {
    pub frame_id: String,
    pub timestamp: i64,
    // In production, this would contain actual image data
    pub simulate_complex: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObjectDetectionOutput {
    pub frame_id: String,
    pub objects: Vec<DetectedObject>,
    pub processing_time_ms: f32,
}

pub struct ObjectDetector {
    object_classes: Vec<String>,
}

impl ObjectDetector {
    pub fn new() -> Self {
        Self {
            object_classes: vec![
                "car".to_string(),
                "truck".to_string(),
                "pedestrian".to_string(),
                "bicycle".to_string(),
                "motorcycle".to_string(),
                "bus".to_string(),
                "traffic_light".to_string(),
                "stop_sign".to_string(),
            ],
        }
    }

    pub fn detect(&self, input: &ObjectDetectionInput) -> ObjectDetectionOutput {
        let mut rng = rand::thread_rng();
        let start = std::time::Instant::now();
        
        // Simulate object detection
        let num_objects = if input.simulate_complex {
            rng.gen_range(5..15)
        } else {
            rng.gen_range(2..8)
        };
        
        let mut objects = Vec::new();
        for i in 0..num_objects {
            let class_idx = rng.gen_range(0..self.object_classes.len());
            objects.push(DetectedObject {
                id: format!("obj_{}", i),
                class_name: self.object_classes[class_idx].clone(),
                confidence: 0.7 + rng.gen::<f32>() * 0.3,
                bounding_box: BoundingBox {
                    x: rng.gen_range(-50.0..50.0),
                    y: rng.gen_range(-50.0..50.0),
                    width: rng.gen_range(5.0..20.0),
                    height: rng.gen_range(5.0..20.0),
                },
            });
        }
        
        ObjectDetectionOutput {
            frame_id: input.frame_id.clone(),
            objects,
            processing_time_ms: start.elapsed().as_secs_f32() * 1000.0,
        }
    }
}