import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { askOllama } from "../../../services/ollama";
import {
  getHistory,
  appendMessages,
  clearHistory,
} from "../../../services/conversationStore";
import logger from "../../../utils/logger";

const askCommand = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Talk to the OnigiriBot AI.")
    .addSubcommand((sub) =>
      sub
        .setName("chat")
        .setDescription("Send a message to the AI.")
        .addStringOption((option) =>
          option
            .setName("prompt")
            .setDescription("Your message.")
            .setRequired(true)
            .setMaxLength(500),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Clear the conversation history for this channel."),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const channelId = interaction.channelId;

    if (sub === "clear") {
      clearHistory(channelId);
      await interaction.reply({
        content: "Conversation history for this channel has been cleared.",
        ephemeral: true,
      });
      return;
    }

    const prompt = interaction.options.getString("prompt", true);
    await interaction.deferReply();

    try {
      const history = getHistory(channelId);
      const response = await askOllama([
        ...history,
        { role: "user", content: prompt },
      ]);

      appendMessages(channelId, [
        { role: "user", content: prompt },
        { role: "assistant", content: response },
      ]);

      const FIELD_LIMIT = 1024;
      const embed = new EmbedBuilder()
        .setColor("#f5f7f5")
        .setTitle("🍙 AI Response")
        .setAuthor({
          name: interaction.user.displayName,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .addFields(
          { name: "Your Question", value: prompt },
          {
            name: "My Answer",
            value:
              response.length > FIELD_LIMIT
                ? response.slice(0, FIELD_LIMIT - 3) + "..."
                : response,
          },
        );

      await interaction.followUp({ embeds: [embed] });
    } catch (error) {
      logger.error(`Error executing /ask chat command: ${error}`);
      await interaction.followUp({
        content:
          "An error occurred while trying to get a response from the AI. Please try again later.",
        ephemeral: true,
      });
    }
  },
};

export default askCommand;
