use std::error::Error;
use std::result::Result;

mod api {
    pub mod routes;
    pub mod route {
        pub mod get_post;
    }
}

async fn run_server() -> Result<(), Box<dyn Error>> {
    let colors = BColors::new();

    let routes = api::routes::routes();
    println!("{}[Rust]{} Server started at http://localhost:8000", colors.blue, colors.endc);
    warp::serve(routes).run(([127, 0, 0, 1], 8000)).await;
    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {

    tokio::runtime::Builder::new_multi_thread()
    .worker_threads(2)
    .enable_all()
    .build()
    .unwrap()
    .block_on(run_server())?;

    Ok(())
}

pub struct BColors {
    pub header: &'static str,
    pub blue: &'static str,
    pub cyan: &'static str,
    pub cyan_green: &'static str,
    pub warning: &'static str,
    pub fail: &'static str,
    pub endc: &'static str,
    pub bold: &'static str,
    pub underline: &'static str,
}

impl BColors {
    pub fn new() -> Self {
        BColors {
            header: "\x1b[95m",
            blue: "\x1b[94m",
            cyan: "\x1b[96m",
            cyan_green: "\x1b[92m",
            warning: "\x1b[93m",
            fail: "\x1b[91m",
            endc: "\x1b[0m",
            bold: "\x1b[1m",
            underline: "\x1b[4m",
        }
    }
}