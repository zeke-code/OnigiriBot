import {
  SlashCommandBuilder,
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  ModalSubmitInteraction,
} from "discord.js";
import { useQueue } from "discord-player";
import logger from "../../utils/logger";

export default {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Change the global volume of the bot."),

  async execute(interaction: any) {
    if (!interaction.member.voice.channelId) {
      return interaction.reply({
        content: "You are not in a voice channel!",
        ephemeral: true,
      });
    }

    if (
      interaction.guild.members.me?.voice?.channelId &&
      interaction.member.voice.channelId !==
        interaction.guild.members.me.voice.channelId
    ) {
      return interaction.reply({
        content: "You are not in my voice channel!",
        ephemeral: true,
      });
    }

    const queue = useQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({
        content: "There doesn't seem to be any active playlist in this server.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`adjust_volume_${interaction.guild.id}`)
      .setTitle(`Adjust Volume - Currently at ${queue.node.volume}%`)
      .addComponents([
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("volume-input")
            .setLabel("Insert the desired volume level (0-100)")
            .setStyle(1) // Style 1 represents a short input field
            .setMinLength(1)
            .setMaxLength(6)
            .setPlaceholder("New volume level...")
            .setRequired(true)
        ),
      ]);

    await interaction.showModal(modal);

    const filter = (i: ModalSubmitInteraction) =>
      i.customId.includes(`adjust_volume_${interaction.guild.id}`);

    interaction
      .awaitModalSubmit({ filter, time: 240000 })
      .then(async (submit: ModalSubmitInteraction) => {
        const userResponse = submit.fields.getTextInputValue("volume-input");

        if (
          Number(userResponse) < 0 ||
          Number(userResponse) > 100 ||
          isNaN(Number(userResponse))
        ) {
          return submit.reply({
            content: "❌ | Volume input must be between 0-100.",
            ephemeral: true,
          });
        }

        const volumeembed = new EmbedBuilder()
          .setAuthor({
            name: "OnigiriBot",
            iconURL: interaction.client.user.displayAvatarURL(),
          })
          .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
          .setColor("#FFFFFF")
          .setTitle("Volume adjusted 🎧")
          .setDescription(`The volume has been set to **${userResponse}%**!`)
          .setTimestamp()
          .setFooter({
            text: `Requested by: ${interaction.user.displayName}`,
          });

        try {
          queue.node.setVolume(Number(userResponse));
          submit.reply({ embeds: [volumeembed] });
        } catch (err) {
          logger.error(
            `Error adjusting volume in guild ${interaction.guildId}: ${err}`
          );
          submit.reply({
            content:
              "❌ | Ooops... something went wrong, there was an error adjusting the volume. Please try again.",
            ephemeral: true,
          });
        }
      })
      .catch((error: any) => {
        logger.error(
          `Error awaiting modal submit in guild ${interaction.guildId}: ${error}`
        );
      });
  },
};
