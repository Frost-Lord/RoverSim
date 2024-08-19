use warp::Rejection;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::result::Result;
use crate::BColors;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Post {
    pub id: u64,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct BodyData {
    pub code: String,
}

pub async fn get_post(id: u64, body: BodyData) -> Result<impl warp::Reply, Rejection> {
    let colors = BColors::new();
    println!("{}[Rust] Received code: {}{:?}{}", colors.blue, colors.fail, body.code, colors.endc);

    // Write code to file
    let code = body.code;
    let rust_code = convert_code_to_rust(&code);

    std::fs::write("./main.rs", rust_code).expect("Unable to write file");

    let output = Command::new("sh")
        .arg("-c")
        .arg("cd ../template && cargo rustc -- -C link-arg=--script=./linker.ld && arm-none-eabi-objcopy -O binary target/armv7a-none-eabi/debug/template ./firmware/kernel7.img")
        .output()
        .expect("Failed to execute cargo rustc command");

    if !output.status.success() {
        println!("{}Error: Failed to compile with cargo rustc{}", colors.fail, colors.endc);
    } else {
        println!("{}Compilation successful{}", colors.cyan_green, colors.endc);
    }

    let post = Post { id };
    Ok(warp::reply::json(&post))
}

fn convert_code_to_rust(code: &str) -> String {
    let mut rust_code = String::from("fn main() {\n");

    let mut labels = std::collections::HashMap::new();
    let mut label_counter = 0;
    
    for line in code.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with(';') {
            continue;
        }
        
        if let Some((label, instruction)) = line.split_once(':') {
            labels.insert(label.trim().to_string(), label_counter);
            rust_code.push_str(&format!("    // Label: {}\n", label.trim()));
            label_counter += 1;
            if instruction.trim().is_empty() {
                continue;
            }
        } else {
            label_counter += 1;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        match parts.as_slice() {
            ["SET", reg, val] => {
                rust_code.push_str(&format!("    let mut {} = {};\n", reg.to_lowercase(), val));
            }
            ["FWD", reg] => {
                rust_code.push_str(&format!("    move_forward({});\n", reg.to_lowercase()));
            }
            ["ADD", reg, val] => {
                rust_code.push_str(&format!("    {} += {};\n", reg.to_lowercase(), val));
            }
            ["BATT", reg] => {
                rust_code.push_str(&format!("    let {} = check_battery_level();\n", reg.to_lowercase()));
            }
            ["LTE", label, reg, val] => {
                rust_code.push_str(&format!("    if {} <= {} {{ goto_{}(); }}\n", reg.to_lowercase(), val, label.to_lowercase()));
            }
            ["GTE", label, reg, val] => {
                rust_code.push_str(&format!("    if {} >= {} {{ goto_{}(); }}\n", reg.to_lowercase(), val, label.to_lowercase()));
            }
            ["EQU", label, reg, val] => {
                rust_code.push_str(&format!("    if {} == {} {{ goto_{}(); }}\n", reg.to_lowercase(), val, label.to_lowercase()));
            }
            ["JMP", label] => {
                rust_code.push_str(&format!("    goto_{}();\n", label.to_lowercase()));
            }
            ["STOP"] => {
                rust_code.push_str("    stop();\n");
            }
            _ => {
                rust_code.push_str(&format!("    // Unknown instruction: {}\n", line));
            }
        }
    }

    for (label, _) in labels {
        rust_code.push_str(&format!("fn goto_{}() {{\n    main();\n}}\n", label.to_lowercase()));
    }

    rust_code.push_str("}\n");
    rust_code
}