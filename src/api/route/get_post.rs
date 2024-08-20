use crate::BColors;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::result::Result;
use warp::Rejection;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Post {
    pub id: u64,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct BodyData {
    pub code: Vec<String>,
}

pub async fn get_post(id: u64, body: BodyData) -> Result<impl warp::Reply, Rejection> {
    let colors = BColors::new();
    println!(
        "{}[Rust] Received code: {}{:?}{}",
        colors.blue, colors.fail, body.code, colors.endc
    );

    let rust_code = convert_code_to_rust(&body.code);

    std::fs::write("./src/api/template/src/main.rs", rust_code).expect("Unable to write file");

    let output = Command::new("cmd")
        .args(&["/C", "cd ./src/api/template && cargo rustc -- -C link-arg=./linker.ld && arm-none-eabi-objcopy -O binary target/armv7a-none-eabi/debug/template ./firmware/kernel7.img"])
        .output()
        .expect("Failed to execute cargo rustc command");

    if !output.status.success() {
        println!(
            "{}Error: Failed to compile with cargo rustc{}",
            colors.fail, colors.endc
        );
    } else {
        println!("{}Evaluation successful{}", colors.cyan_green, colors.endc);
    }

    let post = Post { id };
    Ok(warp::reply::json(&post))
}

fn convert_code_to_rust(code_lines: &[String]) -> String {
    let mut rust_code = String::new();
    let mut labels = std::collections::HashMap::new();
    let mut current_label = String::new();

    rust_code.push_str("#![no_std]\n#![no_main]\n#![allow(warnings)]\n\nuse core::panic::PanicInfo;\nuse core::arch::asm;");
    rust_code.push_str("\n\nmod start {\n    use core::arch::global_asm;\n    global_asm!(\".section .text._start\");\n}");

    rust_code.push_str("\n\n#[panic_handler]\nfn panic(_info: &PanicInfo) -> ! {\n    loop {}\n}");

    rust_code.push_str("\n\n#[no_mangle]\npub extern \"C\" fn _start() -> ! {\n");

    for i in 0..10 {
        rust_code.push_str(&format!("    static mut r{}: i32 = 0;\n", i));
    }

    rust_code.push_str("\n    fn main() {\n");
    rust_code.push_str("        goto_start();\n    }\n\n");

    rust_code.push_str("\n    fn get_battery_level() -> i32 {\n");
    rust_code.push_str("        100 // Return a dummy value\n    }\n\n");

    rust_code.push_str("\n    fn move_forward(_reg: i32) {\n");
    rust_code.push_str("        // Implementation for moving forward\n    }\n\n");

    for line in code_lines {
        let line = line.trim();
        if let Some((label, _)) = line.split_once(':') {
            labels.insert(
                label.trim().to_string(),
                format!("goto_{}", label.trim().to_lowercase()),
            );
        }
    }

    for line in code_lines {
        let line = line.trim();
        if line.is_empty() || line.starts_with(';') {
            continue;
        }

        if let Some((label, instruction)) = line.split_once(':') {
            if !current_label.is_empty() {
                rust_code.push_str("        }\n    }\n\n");
            }
            current_label = labels.get(label.trim()).unwrap().clone();
            rust_code.push_str(&format!("    fn {}() {{\n        unsafe {{\n", current_label));
            if !instruction.trim().is_empty() {
                parse_instruction(instruction.trim(), &mut rust_code, &labels);
            }
            continue;
        }

        parse_instruction(line, &mut rust_code, &labels);
    }

    if !current_label.is_empty() {
        rust_code.push_str("        }\n    }\n    main();\n    loop {}\n}\n\n");
    }

    rust_code
}

fn parse_instruction(
    instruction: &str,
    rust_code: &mut String,
    labels: &std::collections::HashMap<String, String>,
) {
    let parts: Vec<&str> = instruction
        .split_whitespace()
        .map(|part| part.trim_end_matches(','))
        .collect();

    match parts.as_slice() {
        ["SET", reg, val] => {
            rust_code.push_str(&format!("            {} = {};\n", reg.to_lowercase(), val));
        }
        ["FWD", reg] => {
            rust_code.push_str(&format!("            move_forward({});\n", reg.to_lowercase()));
        }
        ["ADD", reg, val] => {
            rust_code.push_str(&format!("            {} += {};\n", reg.to_lowercase(), val));
        }
        ["BATT", reg] => {
            rust_code.push_str(&format!("            {} = get_battery_level();\n", reg.to_lowercase()));
        }
        ["LTE", label, reg, val] => {
            if let Some(target) = labels.get(*label) {
                rust_code.push_str(&format!(
                    "            if {} <= {} {{ {}(); }}\n",
                    reg.to_lowercase(),
                    val,
                    target
                ));
            } else {
                rust_code.push_str(&format!("            // Unknown label: {}\n", label));
            }
        }
        ["GTE", label, reg, val] => {
            if let Some(target) = labels.get(*label) {
                rust_code.push_str(&format!(
                    "            if {} >= {} {{ {}(); }}\n",
                    reg.to_lowercase(),
                    val,
                    target
                ));
            } else {
                rust_code.push_str(&format!("            // Unknown label: {}\n", label));
            }
        }
        ["EQU", label, reg, val] => {
            if let Some(target) = labels.get(*label) {
                rust_code.push_str(&format!(
                    "            if {} == {} {{ {}(); }}\n",
                    reg.to_lowercase(),
                    val,
                    target
                ));
            } else {
                rust_code.push_str(&format!("            // Unknown label: {}\n", label));
            }
        }
        ["JMP", label] => {
            if let Some(target) = labels.get(*label) {
                rust_code.push_str(&format!("            {}();\n", target));
            } else {
                rust_code.push_str(&format!("            // Unknown label: {}\n", label));
            }
        }
        ["STOP"] => {
            rust_code.push_str("            unsafe { loop {} }\n");
        }
        _ => {
            rust_code.push_str(&format!("            // Unknown instruction: {}\n", instruction));
        }
    }
}
