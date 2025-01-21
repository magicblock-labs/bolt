import type BN from "bn.js";

export enum Direction {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

export function padCenter(value: string, width: number) {
  const length = value.length;
  if (width <= length) {
    return value;
  }
  const padding = (width - length) / 2;
  const align = width - padding;
  return value.padStart(align, " ").padEnd(width, " ");
}

export function logPosition(title: string, { x, y, z }: { x: BN; y: BN; z: BN }) {
  console.log(" +----------------------------------+");
  console.log(` | ${padCenter(title, 32)} |`);
  console.log(" +-----------------+----------------+");
  console.log(` | X Position      | ${String(x).padEnd(14, " ")} |`);
  console.log(` | Y Position      | ${String(y).padEnd(14, " ")} |`);
  console.log(` | Z Position      | ${String(z).padEnd(14, " ")} |`);
  console.log(" +-----------------+----------------+");
}

export function logVelocity(
  title: string,
  { x, y, z, lastApplied }: { x: BN; y: BN; z: BN; lastApplied: BN },
) {
  console.log(" +----------------------------------+");
  console.log(` | ${padCenter(title, 32)} |`);
  console.log(" +-----------------+----------------+");
  console.log(` | X Velocity      | ${String(x).padEnd(14, " ")} |`);
  console.log(` | Y Velocity      | ${String(y).padEnd(14, " ")} |`);
  console.log(` | Z Velocity      | ${String(z).padEnd(14, " ")} |`);
  console.log(` | Last Applied    | ${String(lastApplied).padEnd(14, " ")} |`);
  console.log(" +-----------------+----------------+");
}
