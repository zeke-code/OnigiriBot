import { ChatInputCommandInteraction } from "discord.js";
import { BotClient } from "../client/BotClient";

export type MiddlewareNext = () => Promise<void>;

export abstract class Middleware {
  public abstract execute(
    interaction: ChatInputCommandInteraction,
    client: BotClient,
    next: MiddlewareNext
  ): Promise<void>;
}
