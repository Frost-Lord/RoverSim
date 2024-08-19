# Rov-eval
 

# Install ARM GNU toolchain from Arm Developer
https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads

## CMDS
```bash
rustup target add armv7a-none-eabi

cargo rustc -- -C link-arg=--script=./linker.ld
arm-none-eabi-objcopy -O binary target/armv7a-none-eabi/debug/template ./firmware/kernel7.img
```

# Ref
https://science.nasa.gov/resource/curiosity-rover-3d-model/