import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  InteractionContextType,
} from "discord.js";
import { Command, CommandCategory } from "../base/Command";
import { BotClient } from "../../client/BotClient";

export default class PingCommand extends Command {
  constructor() {
    super();
    this.data = new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Shows bot latency")
      .setContexts(
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
        InteractionContextType.PrivateChannel
      );

    this.category = CommandCategory.GENERAL;
    this.cooldown = 5;
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    client: BotClient
  ) {
    const startTime = interaction.createdTimestamp;

    await interaction.reply({
      content: "Pinging...",
    });

    // Fetch the reply to get timing
    const sent = await interaction.fetchReply();
    const latency = sent.createdTimestamp - startTime;
    const apiLatency = Math.round(client.ws.ping);

    await interaction.editReply({
      content:
        `🏓 Pong!\n` +
        `Latency: ${latency}ms\n` +
        `API Latency: ${apiLatency}ms`,
    });
  }
}
