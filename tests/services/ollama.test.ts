import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "../../src/services/conversationStore";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("axios", () => ({ default: { post } }));

beforeEach(() => {
  vi.resetModules();
  post.mockReset();
  vi.stubEnv("OLLAMA_URL", "http://ollama.test:11434");
  vi.stubEnv("OLLAMA_MODEL", undefined);
  vi.stubEnv("OLLAMA_SYSTEM_PROMPT", undefined);
  post.mockResolvedValue({ data: { message: { content: "Hello!" } } });
});

describe("askOllama", () => {
  it("returns configuration guidance without making a request if no URL is set", async () => {
    vi.stubEnv("OLLAMA_URL", undefined);
    const { askOllama } = await import("../../src/services/ollama");

    expect(await askOllama([])).toMatch(/not configured/i);
    expect(post).not.toHaveBeenCalled();
  });

  it("sends the conversation and returns the assistant's response", async () => {
    const { askOllama } = await import("../../src/services/ollama");
    const history: ChatMessage[] = [{ role: "user", content: "Hello" }];

    expect(await askOllama(history)).toBe("Hello!");
    expect(post).toHaveBeenCalledExactlyOnceWith(
      "http://ollama.test:11434/api/chat",
      {
        model: "dolphin-mixtral:8x7b",
        messages: history,
        stream: false,
      },
    );
  });

  it("prepends the configured system prompt without mutating the conversation", async () => {
    vi.stubEnv("OLLAMA_SYSTEM_PROMPT", "Be concise.");
    vi.stubEnv("OLLAMA_MODEL", "configured-model");
    const { askOllama } = await import("../../src/services/ollama");
    const history: ChatMessage[] = [{ role: "user", content: "Hello" }];

    await askOllama(history);

    expect(post).toHaveBeenCalledExactlyOnceWith(expect.any(String), {
      model: "configured-model",
      messages: [
        { role: "system", content: "Be concise." },
        { role: "user", content: "Hello" },
      ],
      stream: false,
    });
    expect(history).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("lets an explicit model override the configured model", async () => {
    vi.stubEnv("OLLAMA_MODEL", "configured-model");
    const { askOllama } = await import("../../src/services/ollama");

    await askOllama([], "override-model");

    expect(post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ model: "override-model" }),
    );
  });

  it.each([
    ["HTTP errors", { response: { status: 503, data: "Service unavailable" } }],
    ["connection failures", { request: {}, message: "Connection refused" }],
    ["unexpected errors", new Error("Request failed")],
  ])("returns a helpful fallback for %s", async (_description, error) => {
    const { askOllama } = await import("../../src/services/ollama");
    post.mockRejectedValue(error);

    expect(await askOllama([])).toMatch(/unable to get a response/i);
    expect(post).toHaveBeenCalledOnce();
  });
});
