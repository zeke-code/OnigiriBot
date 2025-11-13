import axios, { AxiosError } from "axios";
import logger from "../utils/logger";

const OLLAMA_URL = process.env.OLLAMA_URL;
const OLLAMA_SYSTEM_PROMPT = process.env.OLLAMA_SYSTEM_PROMPT;

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

/**
 * Sends a prompt to the Ollama API and returns the response.
 * @param prompt The question to ask the AI.
 * @param model The model to use for the response.
 * @returns The AI's response as a string, or an error message.
 */
export async function askOllama(
  prompt: string,
  model: string = "dolphin-mixtral:8x7b",
): Promise<string> {
  if (!OLLAMA_URL) {
    logger.error("OLLAMA_URL is not defined in the environment variables.");
    return "The Ollama service is not configured. Please contact the bot administrator.";
  }

  try {
    logger.info(`Sending prompt to Ollama model ${model}: "${prompt}"`);

    const payload: {
      model: string;
      prompt: string;
      stream: boolean;
      system?: string;
    } = {
      model: model,
      prompt: prompt,
      stream: false,
    };

    if (OLLAMA_SYSTEM_PROMPT) {
      payload.system = OLLAMA_SYSTEM_PROMPT;
    }

    const response = await axios.post<OllamaResponse>(
      `${OLLAMA_URL}/api/generate`,
      payload,
    );

    return response.data.response;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      logger.error(
        `Ollama API responded with status ${axiosError.response.status}: ${axiosError.response.data}`,
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
