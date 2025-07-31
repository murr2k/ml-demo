use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::CorsLayer;
use tracing::{info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod handlers;
mod ml;
mod models;
mod state;

use crate::state::AppState;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "ml_server=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting ML Server...");

    // Initialize application state
    let app_state = Arc::new(AppState::new().await);

    // Build our application with routes
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/ws", get(websocket_handler))
        .route("/api/models", get(handlers::rest::list_models))
        .route("/api/inference/:model", post(handlers::rest::inference))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    // Run our application
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    info!("ML Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "ML Server is running"
}

async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| websocket(socket, state))
}

async fn websocket(socket: WebSocket, state: Arc<AppState>) {
    handlers::websocket::handle_socket(socket, state).await;
}
