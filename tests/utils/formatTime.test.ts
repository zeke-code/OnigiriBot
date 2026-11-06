import { describe, expect, it } from "vitest";
import { formatTime } from "../../src/utils/formatTime";

describe("formatTime", () => {
  it.each([
    [0, "00:00"],
    [999, "00:00"],
    [1_000, "00:01"],
    [59_999, "00:59"],
    [60_000, "01:00"],
    [61_000, "01:01"],
    [3_599_999, "59:59"],
    [3_600_000, "01:00:00"],
    [3_661_000, "01:01:01"],
    [86_400_000, "24:00:00"],
    [90_061_000, "25:01:01"],
    [360_000_000, "100:00:00"],
  ])("formats %i milliseconds as %s", (duration, expected) => {
    expect(formatTime(duration)).toBe(expected);
  });
});
