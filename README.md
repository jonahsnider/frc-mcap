# frc-mcap

Converts FRC WPILOG files into MCAP.

## Implementation

The CLI is written in TypeScript with [Clipanion](https://mael.dev/clipanion/).

[A parser](src/wpilib-struct/index.ts) for [the WPILib packed struct schema](https://github.com/wpilibsuite/allwpilib/blob/main/wpiutil/doc/struct.adoc) is written using [Chevrotain](https://chevrotain.io/docs/).

[A custom binary parser](src/wpilog/wpilog-reader.ts) for the WPILOG format, which operates on a raw stream of bytes.

[An MCAP writer](src/mcap/mcap-writer.ts) is built on top of the MCAP library for TypeScript, and outputs a stream of messages as WPILOG records are decoded.
