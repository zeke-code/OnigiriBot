import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import logger from "../../utils/logger";

const whisperCommand = {
  data: new SlashCommandBuilder()
    .setName("whisper")
    .setDescription("I will send your message anonymously in a text channel!")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Your anonymous message!")
        .setMaxLength(500)
        .setRequired(true)
    ),

  async execute(interaction: CommandInteraction) {
    const messageOption = interaction.options.get("message", true);
    const message = messageOption.value as string;

    if (!message) {
      await interaction.reply({
        content: "You must provide a message!",
        ephemeral: true,
      });
      return;
    }

    try {
      const embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setTitle("Someone whispered...")
        .setDescription(message)
        .setTimestamp();

      await interaction.channel?.send({ embeds: [embed] });
      await interaction.reply({
        content: "Your whisper has been sent!",
        ephemeral: true,
      });
    } catch (e) {
      await interaction.reply({
        content: "Something went wrong. Try again!",
        ephemeral: true,
      });
      logger.error(
        `Something went wrong while trying to whisper a message: ${e}`
      );
    }
  },
};

export default whisperCommand;