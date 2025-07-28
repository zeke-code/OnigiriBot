import {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  InteractionContextType,
  ChatInputCommandInteraction,
} from "discord.js";
import logger from "../../../utils/logger";

const command = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription(
      "Deletes a specified amount of recent messages from a channel!"
    )
    .setContexts([InteractionContextType.Guild])
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The number of messages to delete")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const amountOption = interaction.options.get("amount", true);
    const amount = amountOption.value as number;

    if (amount <= 0 || amount > 100) {
      return interaction.reply({
        content: "The amount needs to be between 1 and 100!",
        ephemeral: true,
      });
    }

    const channel = interaction.channel as TextChannel;

    try {
      const deletedMessages = await channel.bulkDelete(amount, true);
      await interaction.reply(
        `I deleted **${deletedMessages.size} recent messages** from this channel under ${interaction.member}'s request!`
      );
    } catch (error) {
      logger.error(
        `Something went wrong while trying to purge messages from a channel: ${error}`
      );
      await interaction.reply({
        content: "Something went wrong. Try again later.",
        ephemeral: true,
      });
    }
  },
};

export default command;
