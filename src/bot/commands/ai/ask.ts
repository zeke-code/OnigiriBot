import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { askOllama } from "../../../services/ollama";
import logger from "../../../utils/logger";

const askCommand = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask a question to the OnigiriBot AI.")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The question you want to ask the AI.")
        .setRequired(true)
        .setMaxLength(500)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const prompt = interaction.options.getString("prompt", true);

    await interaction.deferReply();

    try {
      const response = await askOllama(prompt);

      const embed = new EmbedBuilder()
        .setColor("#f5f7f5")
        .setTitle("🍙 AI Response")
        .setAuthor({
          name: interaction.user.displayName,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .addFields(
          { name: "Your Question", value: prompt },
          { name: "My Answer", value: response }
        );
      await interaction.followUp({ embeds: [embed] });
    } catch (error) {
      logger.error(`Error executing /ask command: ${error}`);
      await interaction.followUp({
        content:
          "An error occurred while trying to get a response from the AI. Please try again later.",
        ephemeral: true,
      });
    }
  },
};

export default askCommand;