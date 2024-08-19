# Custom Rover Control Language Datasheet

## Syntax

### 1. **SET Register, Value**
   - **Description**: Sets the specified register to a given value.
   - **Example**: `SET R0, 3` sets register `R0` to `3`.

### 2. **FWD Register**
   - **Description**: Moves the rover forward by the value in the specified register.
   - **Example**: `FWD R0` moves the rover forward by the value in `R0`.

### 3. **TURN Direction**
   - **Description**: Turns the rover in the specified direction between -360 and 360, 0 as facing foward.
   - **Example**: `TURN 90` turns the rover to the right 90 degrees.

### 4. **ADD Register, Value**
   - **Description**: Adds a value to the specified register.
   - **Example**: `ADD R0, 2` increases the value in `R0` by `2`.

### 5. **REM Register, Value**
   - **Description**: Removes (subtracts) a value from the specified register.
   - **Example**: `REM R0, 1` decreases the value in `R0` by `1`.

### 6. **EQU Label**
   - **Description**: Jumps to the specified label if the comparison (`CMP`) was equal.
   - **Example**: `EQU STOP_MOVE` jumps to `STOP_MOVE` if the previous comparison was equal.

### 7. **EQU Label, Register, Value/Register**
   - **Description**: Jumps to the specified label if the value in the register is equal to the given value.
   - **Example**: `EQU STOP_MOVE, R1, 100` jumps to `STOP_MOVE` if the value in `R1` is `100`.

### 8. **STOP**
   - **Description**: Stops the rover's movement.
   - **Example**: `STOP` stops the rover.

### 9. **JMP Label**
   - **Description**: Unconditionally jumps to the specified label.
   - **Example**: `JMP END` jumps to the label `END`.

## Registers

- **R0, R1, ...**: General-purpose registers used for holding values.

## Labels

- **START**: Beginning of the program.
- **STOP_MOVE**: A point in the program to stop the rover's movement.
- **END**: End of the program.

## Example Programs

### Program 1: Basic Movement with Conditional Jump
```plaintext
START:
    SET R0, 3      ; Set R0 to 3
    FWD R0         ; Move forward
    TURN 90        ; Turn right
    TURN -90       ; Turn left
    FWD R0         ; Move forward
    ADD R0, 2      ; Increase R0 by 2 units
    REM R0, 1      ; Remove 1 from the register
    FWD R0         ; Move forward
    JMP END        ; Jump to END

END:
    STOP           ; Stop the rover
    ; End of program
```

### Program 2: Loop Until Condition is Met
```plaintext
START:
    SET R0, 1               ; Set the R0 to 1
    SET R1, 1               ; Set the R1 to 1
    JMP LOOP                ; Jump to loop

LOOP:
    FWD R0                  ; Move forward by R0 value
    ADD R1, 1               ; Add 1 to R1
    BATT R2                 ; Store the battery level in R2
    LTE CHARGE, R2, 60      ; If R2 <= 60, jump to CHARGE else continue
    EQU END, R1, 10         ; If R2 == 10, jump to END else continue
    JMP LOOP                ; Jump to LOOP

CHARGE:
    BATT R2                 ; Check battery level and store in R2
    GTE LOOP, R2, 10        ; If R2 >= 100, jump back to LOOP
    JMP CHARGE              ; Continue charging until battery is full

END:
    STOP                    ; End of program
```