use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::models::{
    trajectory::{TrajectoryPredictor, TrajectoryPredictionInput, TrajectoryPredictionOutput},
    anomaly::{AnomalyDetector, AnomalyDetectionInput, AnomalyDetectionOutput},
    objects::{ObjectDetector, ObjectDetectionInput, ObjectDetectionOutput},
    fusion::{SensorFusion, FusionInput, FusionOutput},
    ModelType,
};

pub struct MLEngine {
    trajectory_predictor: Arc<RwLock<TrajectoryPredictor>>,
    anomaly_detector: Arc<RwLock<AnomalyDetector>>,
    object_detector: Arc<RwLock<ObjectDetector>>,
    sensor_fusion: Arc<RwLock<SensorFusion>>,
}

impl MLEngine {
    pub async fn new() -> Self {
        Self {
            trajectory_predictor: Arc::new(RwLock::new(
                TrajectoryPredictor::new().expect("Failed to create trajectory predictor")
            )),
            anomaly_detector: Arc::new(RwLock::new(AnomalyDetector::new())),
            object_detector: Arc::new(RwLock::new(ObjectDetector::new())),
            sensor_fusion: Arc::new(RwLock::new(SensorFusion::new())),
        }
    }

    pub async fn predict_trajectory(
        &self,
        input: TrajectoryPredictionInput,
    ) -> Result<TrajectoryPredictionOutput> {
        let predictor = self.trajectory_predictor.read().await;
        Ok(predictor.predict(&input)?)
    }

    pub async fn detect_anomaly(
        &self,
        input: AnomalyDetectionInput,
    ) -> Result<AnomalyDetectionOutput> {
        let detector = self.anomaly_detector.read().await;
        Ok(detector.detect(&input))
    }

    pub async fn detect_objects(
        &self,
        input: ObjectDetectionInput,
    ) -> Result<ObjectDetectionOutput> {
        let detector = self.object_detector.read().await;
        Ok(detector.detect(&input))
    }

    pub async fn fuse_sensors(
        &self,
        input: FusionInput,
    ) -> Result<FusionOutput> {
        let fusion = self.sensor_fusion.read().await;
        Ok(fusion.fuse(&input))
    }

    pub async fn update_anomaly_threshold(&self, threshold: f32) -> Result<()> {
        let mut detector = self.anomaly_detector.write().await;
        detector.update_threshold(threshold);
        Ok(())
    }
}