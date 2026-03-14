import axios, { AxiosError } from "axios";
import logger from "../utils/logger";
import { ChatMessage } from "./conversationStore";

const OLLAMA_URL = process.env.OLLAMA_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "dolphin-mixtral:8x7b";
const OLLAMA_SYSTEM_PROMPT = process.env.OLLAMA_SYSTEM_PROMPT;

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

/**
 * Sends a conversation history to the Ollama chat API and returns the reply.
 * @param history The full message history for this conversation.
 * @param model The model to use for the response.
 * @returns The AI's response as a string.
 */
export async function askOllama(
  history: ChatMessage[],
  model: string = OLLAMA_MODEL,
): Promise<string> {
  if (!OLLAMA_URL) {
    logger.error("OLLAMA_URL is not defined in the environment variables.");
    return "The Ollama service is not configured. Please contact the bot administrator.";
  }

  const messages: ChatMessage[] = [];

  if (OLLAMA_SYSTEM_PROMPT) {
    messages.push({ role: "system", content: OLLAMA_SYSTEM_PROMPT });
  }

  messages.push(...history);

  try {
    logger.info(
      `Sending ${messages.length} message(s) to Ollama model "${model}"`,
    );

    const response = await axios.post<OllamaChatResponse>(
      `${OLLAMA_URL}/api/chat`,
      { model, messages, stream: false },
    );

    return response.data.message.content;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      logger.error(
        `Ollama API responded with status ${axiosError.response.status}: ${JSON.stringify(axiosError.response.data)}`,
      );
    } else if (axiosError.request) {
      logger.error(
        `Could not connect to Ollama service at ${OLLAMA_URL}. Is it running?`,
      );
    } else {
      logger.error(`Error sending request to Ollama: ${axiosError.message}`);
    }
    return "Sorry, I was unable to get a response from the AI. Please try again later.";
  }
}
