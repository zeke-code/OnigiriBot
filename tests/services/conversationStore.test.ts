import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendMessages,
  clearHistory,
  getHistory,
  type ChatMessage,
} from "../../src/services/conversationStore";

function messages(count: number, offset = 0): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `Message ${index + offset}`,
  }));
}

function resetHistory() {
  clearHistory("channel-a");
  clearHistory("channel-b");
}

beforeEach(resetHistory);
afterEach(resetHistory);

describe("conversation history", () => {
  it("starts empty and keeps messages in conversation order", () => {
    expect(getHistory("channel-a")).toEqual([]);
    const firstExchange = messages(2);
    const secondExchange = messages(2, 2);

    appendMessages("channel-a", firstExchange);
    appendMessages("channel-a", secondExchange);

    expect(getHistory("channel-a")).toEqual([
      ...firstExchange,
      ...secondExchange,
    ]);
  });

  it("keeps conversations isolated between channels", () => {
    appendMessages("channel-a", messages(2));
    appendMessages("channel-b", messages(1, 100));

    expect(getHistory("channel-a")).toEqual(messages(2));
    expect(getHistory("channel-b")).toEqual(messages(1, 100));
  });

  it("discards the oldest messages when later appends exceed the limit", () => {
    const history = messages(24);
    appendMessages("channel-a", history.slice(0, 20));
    expect(getHistory("channel-a")).toEqual(history.slice(0, 20));

    appendMessages("channel-a", history.slice(20));

    expect(getHistory("channel-a")).toEqual(history.slice(-20));
  });

  it("also bounds a single oversized append", () => {
    const history = messages(25);
    appendMessages("channel-a", history);

    expect(getHistory("channel-a")).toEqual(history.slice(-20));
  });

  it("does not expose its stored array to callers", () => {
    appendMessages("channel-a", messages(2));
    const history = getHistory("channel-a");
    history.pop();
    history.push({ role: "user", content: "Not appended to the store" });

    expect(getHistory("channel-a")).toEqual(messages(2));
  });

  it("clears only the requested channel and accepts a new conversation", () => {
    appendMessages("channel-a", messages(2));
    appendMessages("channel-b", messages(2, 100));

    clearHistory("channel-a");
    clearHistory("channel-a");

    expect(getHistory("channel-a")).toEqual([]);
    expect(getHistory("channel-b")).toEqual(messages(2, 100));
    appendMessages("channel-a", messages(1, 200));
    expect(getHistory("channel-a")).toEqual(messages(1, 200));
  });
});
