use warp::{Filter, Rejection, Reply, http::StatusCode};
use crate::BColors;

pub async fn handle_rejection(err: Rejection) -> Result<impl Reply, Rejection> {
    let colors = BColors::new();

    if let Some(e) = err.find::<warp::filters::body::BodyDeserializeError>() {
        let json = warp::reply::json(&serde_json::json!({
            "error": "Request body could not be deserialized",
            "message": format!("Could not deserialize the body: {}", e)
        }));
        return Ok(warp::reply::with_status(json, StatusCode::BAD_REQUEST));
    }

    let message = "Internal Server Error";
    eprintln!("{}[Rust]{} Unhandled Rejection:{} {:?}", colors.blue, colors.fail, colors.endc, err);
    let json = warp::reply::json(&serde_json::json!({"error": message}));
    Ok(warp::reply::with_status(json, StatusCode::INTERNAL_SERVER_ERROR))
}

fn get_post() -> impl Filter<Extract = impl Reply, Error = warp::Rejection> + Clone {
    warp::path!("evaluate" / u64)
        .and(warp::post())
        .and(
            warp::body::json()
                .or(warp::body::form())
                .unify()
        )
        .and_then(super::route::get_post::get_post)
}

fn serve_static_files() -> impl Filter<Extract = impl Reply, Error = warp::Rejection> + Clone {
    warp::path("static")
        .and(warp::fs::dir("src/api/web/"))
}

fn serve_index() -> impl Filter<Extract = impl Reply, Error = warp::Rejection> + Clone {
    warp::path::end()
        .and(warp::fs::file("src/api/web/index.html"))
}

mod routes_mod {
    use super::*;
    
    pub fn routes() -> impl Filter<Extract = impl Reply, Error = warp::Rejection> + Clone {
        serve_index()
            .or(serve_static_files())
            .or(get_post())
            .recover(handle_rejection)
    }
}

pub use routes_mod::routes;
