import {
  CommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from "discord.js";
import { BotClient } from "../../client/BotClient";

export enum CommandCategory {
  GENERAL = "General",
  MODERATION = "Moderation",
  ADMIN = "Admin",
  FUN = "Fun",
  UTILITY = "Utility",
}

export abstract class Command {
  public data: SlashCommandBuilder;
  public category?: CommandCategory;
  public cooldown: number = 3;
  public ownerOnly: boolean = false;
  public guildOnly: boolean = true;

  constructor() {
    this.data = new SlashCommandBuilder();
  }

  public abstract execute(
    interaction: ChatInputCommandInteraction,
    client: BotClient
  ): Promise<void>;
}
