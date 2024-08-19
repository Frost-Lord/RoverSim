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

    let code = body.code;
    let rust_code = convert_code_to_rust(&code);

    std::fs::write("./main.rs", rust_code).expect("Unable to write file");

    let output = Command::new("cmd")
        .args(&["/C", "cd ./src/api/template && cargo rustc -- -C link-arg=./linker.ld && arm-none-eabi-objcopy -O binary target/armv7a-none-eabi/debug/template ./firmware/kernel7.img"])
        .output()
        .expect("Failed to execute cargo rustc command");

    if !output.status.success() {
        println!("{}Error: Failed to compile with cargo rustc{}", colors.fail, colors.endc);
    } else {
        println!("{}Evaluation successful{}", colors.cyan_green, colors.endc);
    }

    let post = Post { id };
    Ok(warp::reply::json(&post))
}
fn convert_code_to_rust(code: &str) -> String {
    let mut rust_code = String::new();
    let mut labels = std::collections::HashMap::new();
    let mut label_functions = String::new();

    // First pass: Collect all labels
    for line in code.lines() {
        let line = line.trim();
        if let Some((label, _)) = line.split_once(':') {
            labels.insert(label.trim().to_string(), format!("goto_{}", label.trim().to_lowercase()));
        }
    }

    // Second pass: Convert instructions to Rust code
    for line in code.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with(';') {
            continue;
        }

        if let Some((label, instruction)) = line.split_once(':') {
            let function_name = labels.get(label.trim()).unwrap();
            rust_code.push_str(&format!("    {}();\n", function_name));
            label_functions.push_str(&format!("fn {}() {{\n", function_name));
            if !instruction.trim().is_empty() {
                parse_instruction(instruction, &mut label_functions, &labels);
            }
            label_functions.push_str("}\n\n");
            continue;
        }

        parse_instruction(line, &mut label_functions, &labels);
    }

    rust_code.insert_str(0, "fn main() {\n");
    rust_code.push_str("}\n\n");
    rust_code.push_str(&label_functions);

    rust_code
}

fn parse_instruction(instruction: &str, rust_code: &mut String, labels: &std::collections::HashMap<String, String>) {
    let parts: Vec<&str> = instruction.split_whitespace().collect();
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
            if let Some(target) = labels.get(*label) {
                rust_code.push_str(&format!("    if {} <= {} {{ {}(); }}\n", reg.to_lowercase(), val, target));
            } else {
                rust_code.push_str(&format!("    // Unknown label: {}\n", label));
            }
        }
        ["GTE", label, reg, val] => {
            if let Some(target) = labels.get(*label) {
                rust_code.push_str(&format!("    if {} >= {} {{ {}(); }}\n", reg.to_lowercase(), val, target));
            } else {
                rust_code.push_str(&format!("    // Unknown label: {}\n", label));
            }
        }
        ["EQU", label, reg, val] => {
            if let Some(target) = labels.get(*label) {
                rust_code.push_str(&format!("    if {} == {} {{ {}(); }}\n", reg.to_lowercase(), val, target));
            } else {
                rust_code.push_str(&format!("    // Unknown label: {}\n", label));
            }
        }
        ["JMP", label] => {
            if let Some(target) = labels.get(*label) {
                rust_code.push_str(&format!("    {}();\n", target));
            } else {
                rust_code.push_str(&format!("    // Unknown label: {}\n", label));
            }
        }
        ["STOP"] => {
            rust_code.push_str("    stop();\n");
        }
        _ => {
            rust_code.push_str(&format!("    // Unknown instruction: {}\n", instruction));
        }
    }
}
