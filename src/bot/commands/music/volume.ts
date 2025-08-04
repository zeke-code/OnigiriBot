import {
  SlashCommandBuilder,
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  ModalSubmitInteraction,
  InteractionContextType,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from "discord.js";
import { GuildQueue, useQueue } from "discord-player";
import logger from "../../../utils/logger";
import { validateMusicInteraction } from "../../../utils/music/validateMusicInteraction";
import { QueueMetadata } from "../../../types/QueueMetadata";
import { createMusicEmbed } from "../../../utils/music/musicEmbed";

export default {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setContexts([InteractionContextType.Guild])
    .setDescription("Change the global volume of the bot in the server."),

  async execute(interaction: ButtonInteraction) {
    let queue: GuildQueue<QueueMetadata> | null = useQueue(
      interaction.guildId!
    );

    const validation = await validateMusicInteraction(interaction, queue, {
      requireQueue: false,
      requireBotInChannel: true,
      requirePlaying: true,
    });
    if (!validation) return;

    const modal = new ModalBuilder()
      .setCustomId(`adjust_volume_${interaction.guild?.id}`)
      .setTitle(`Adjust Volume - Currently at ${queue?.node.volume}%`)
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
      i.customId.includes(`adjust_volume_${interaction.guild?.id}`);

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

        const volumeEmbed =  createMusicEmbed()
          .setColor("#FFFFFF")
          .setTitle("Volume adjusted 🔊")
          .setDescription(`The volume has been set to **${userResponse}%**!`)
          .setFooter({
            text: `Requested by: \`${interaction.user.displayName}\``,
          });

        try {
          queue?.node.setVolume(Number(userResponse));
          submit.reply({ embeds: [volumeEmbed] });
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
