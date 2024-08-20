#![no_std]
#![no_main]
#![allow(warnings)]

use core::panic::PanicInfo;
use core::arch::asm;

mod start {
    use core::arch::global_asm;
    global_asm!(".section .text._start");
}


#[no_mangle]
pub extern "C" fn _start() -> ! {
    let gpio_fsel2 = 1<<3;

    unsafe {
        core::ptr::write_volatile(0x3F20_0008 as *mut u32, gpio_fsel2);
    }

    unsafe {
        loop {
            // turn PIN21 on
            core::ptr::write_volatile(0x3F20_001C as *mut u32, 1 << 21);

            for _ in 0..5000 {
                asm!("nop");
            }

            // turn PIN21 off
            core::ptr::write_volatile(0x3F20_0028 as *mut u32, 1 << 21);

            for _ in 0..5000 {
                asm!("nop");
            }
        }
    }
}

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}