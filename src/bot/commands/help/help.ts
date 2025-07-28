import {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
} from "discord.js";
import { ExtendedClient } from "../../../types/ExtendedClient";
import { Command } from "../../../types/Command";

const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Gives you a list of things that I can do!"),

  async execute(interaction: CommandInteraction) {
    const client = interaction.client as ExtendedClient;
    const commands = client.commands;

    const helpEmbed = new EmbedBuilder()
      .setColor("#f5f7f5")
      .setTitle("🍙OnigiriBot Help🍙")
      .setImage("https://i.ibb.co/2tYNK54/Oni-Avatar.png")
      .setFooter({
        text: "🍙 I'll be happy to assist you at the best of my abilities! 🍙",
      });

    commands.forEach((command: Command) => {
      helpEmbed.addFields({
        name: `/${command.data.name}`,
        value: command.data.description,
      });
    });

    // Send the embed as a reply to the user
    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  },
};

export default helpCommand;
