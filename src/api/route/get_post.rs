use warp::Rejection;
use serde::{Deserialize, Serialize};
use std::result::Result;
use crate::BColors;
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Post {
    pub id: u64,
    pub cmds: Vec<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct BodyData {
    pub code: String,
}

pub async fn get_post(id: u64, body: BodyData) -> Result<impl warp::Reply, Rejection> {
    let colors = BColors::new();
    println!("{}[Rust] Received code: {}{:?}{}", colors.blue, colors.fail, body.code, colors.endc);

    let commands = translate_code_to_threejs(&body.code);

    let post = Post {
        id,
        cmds: commands,
    };
    Ok(warp::reply::json(&post))
}

fn translate_code_to_threejs(code: &str) -> Vec<String> {
    let mut cmds = Vec::new();

    for line in code.lines() {
        let trimmed_line = line.trim();
        
        if trimmed_line.starts_with("MOV") {
            cmds.push(format!("setSpeed({});", parse_value(trimmed_line)));
        } else if trimmed_line.starts_with("FWD") {
            cmds.push("moveForward();".to_string());
        } else if trimmed_line.starts_with("TURN R") {
            cmds.push("turnRight();".to_string());
        } else if trimmed_line.starts_with("ADD") {
            cmds.push(format!("increaseSpeed({});", parse_value(trimmed_line)));
        } else if trimmed_line.starts_with("CMP") {
            cmds.push(format!("compareSpeed({});", parse_value(trimmed_line)));
        } else if trimmed_line.starts_with("JEQ") {
            cmds.push("ifSpeedEqualsJump();".to_string());
        } else if trimmed_line.starts_with("STOP") {
            cmds.push("stopMovement();".to_string());
        } else if trimmed_line.starts_with("JMP") {
            cmds.push("jumpToEnd();".to_string());
        } else if trimmed_line.starts_with("START:") || trimmed_line.starts_with("STOP_MOVE:") || trimmed_line.starts_with("END:") {
            // Handle labels or ignore them
        }
    }

    cmds
}

fn parse_value(line: &str) -> i32 {
    // Extract the numeric value from a line like "MOV R0, 3"
    line.split_whitespace()
        .last()
        .unwrap_or("0")
        .parse::<i32>()
        .unwrap_or(0)
}