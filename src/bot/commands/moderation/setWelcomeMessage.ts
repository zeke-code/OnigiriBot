import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  InteractionContextType,
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  Colors,
} from "discord.js";
import logger from "../../../utils/logger";
import { prisma } from "../../../services/database";

const setWelcomeCommand = {
  data: new SlashCommandBuilder()
    .setName("setwelcomemessage")
    .setDescription("Let's you customize the welcome message in this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((welcomeMessage) =>
      welcomeMessage
        .setName("welcome_message")
        .setDescription("The welcome message for this server")
        .setMaxLength(100)
        .setRequired(true),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const welcomeMessageOption = interaction.options.get(
      "welcome_message",
      true,
    );
    const welcomeMessage = welcomeMessageOption.value as string;
    const guildId = interaction.guildId;

    await interaction.deferReply();
    if (!guildId) {
      interaction.reply({
        content:
          "I cannot retrieve your server ID in this moment... try later!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await prisma.guild.upsert({
        where: { guildId: guildId },
        create: {
          guildId: guildId,
          welcomeMessage: welcomeMessage,
        },
        update: {
          guildId: guildId,
          welcomeMessage: welcomeMessage,
        },
      });

      const embed = new EmbedBuilder()
        .setTitle("Welcome Message Updated!")
        .setDescription(
          `Your server's welcome message has been updated to:\n\n"${welcomeMessage}"`,
        )
        .setColor(Colors.White);

      await interaction.editReply({ embeds: [embed] });
    } catch {
      logger.error(
        `Something went wrong while trying to update welcome message for guild ${interaction.guildId}`,
      );
      logger.error(`Welcome message input by users: ${welcomeMessage}`);
      await interaction.editReply({
        content:
          "Something went wrong while trying to update welcome message for this server... try again later.",
      });
    }
  },
};

export default setWelcomeCommand;
