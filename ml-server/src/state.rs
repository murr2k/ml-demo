use std::sync::Arc;
use dashmap::DashMap;
use tokio::sync::RwLock;

use crate::ml::engine::MLEngine;
use crate::models::ModelType;

pub struct AppState {
    pub ml_engine: Arc<MLEngine>,
    pub active_connections: DashMap<String, tokio::sync::mpsc::Sender<String>>,
    pub model_versions: RwLock<std::collections::HashMap<ModelType, String>>,
}

impl AppState {
    pub async fn new() -> Self {
        let ml_engine = Arc::new(MLEngine::new().await);
        
        Self {
            ml_engine,
            active_connections: DashMap::new(),
            model_versions: RwLock::new(std::collections::HashMap::new()),
        }
    }
}