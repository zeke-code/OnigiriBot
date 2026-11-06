import { vi } from "vitest";

// Expected failure paths should not print production logs during a test run.
vi.mock("../src/utils/logger", () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
