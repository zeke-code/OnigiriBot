import { useMainPlayer, Track, Player, GuildQueue } from "discord-player";
import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  TextChannel,
  Message,
  VoiceChannel,
} from "discord.js";
import logger from "../../utils/logger";
import { QueueMetadata } from "../../types/QueueMetadata";

const player: Player | undefined = useMainPlayer();

let embedMessageId: string | null = null;

const createButton = (
  customId: string,
  label: string,
  emoji: string,
  style: ButtonStyle = ButtonStyle.Secondary
): ButtonBuilder => {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setStyle(style)
    .setLabel(label)
    .setEmoji(emoji);
};

if (player) {
  player.events.on(
    "playerStart",
    async (queue: GuildQueue<QueueMetadata>, track: Track) => {
      try {
        const buttons = [
          { customId: "previous", label: "Previous", emoji: "⏮️" },
          { customId: "pauseresume", label: "Pause/Resume", emoji: "⏯️" },
          { customId: "skip", label: "Skip", emoji: "⏭️" },
          { customId: "stop", label: "Stop", emoji: "⏹️" },
          { customId: "shuffle", label: "Shuffle", emoji: "🔀" },
          { customId: "volume", label: "Volume", emoji: "🔊" },
        ];

        // Create action rows for buttons
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          buttons
            .slice(0, 5)
            .map(({ customId, label, emoji }) =>
              createButton(customId, label, emoji)
            )
        );

        const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          buttons
            .slice(5)
            .map(({ customId, label, emoji }) =>
              createButton(customId, label, emoji)
            )
        );

        const embed = new EmbedBuilder()
          .setURL(track.url)
          .setTitle(`${track.title}`)
          .setAuthor({
            name: "♪ OnigiriBot - Music Player ♪",
            iconURL: "https://i.ibb.co/bFJ5GC1/Oni-Avatar.png",
          })
          .addFields(
            {
              name: `Artist`,
              value: `${track.author}`,
              inline: true,
            },
            {
              name: `Playing in ${
                (queue.metadata.voiceChannel as VoiceChannel).name
              }`,
              value: `Requested by ${queue.metadata.requestedBy}`,
              inline: true,
            },
            { name: "Duration", value: track.duration, inline: true }
          )
          .setColor("#ffffff");

        if (track.thumbnail?.trim()) {
          embed.setThumbnail(track.thumbnail);
        }

        // Delete previous embed message if exists
        if (embedMessageId) {
          try {
            const message = await (
              queue.metadata.textChannel as TextChannel
            ).messages.fetch(embedMessageId);

            if (message) {
              await message.delete();
              embedMessageId = null;
            }
          } catch (error) {
            logger.error("Error deleting the previous embed:", error);
          } finally {
            embedMessageId = null;
          }
        }

        const sentMessage: Message = await (
          queue.metadata.textChannel as TextChannel
        ).send({
          embeds: [embed],
          components: [row, secondRow],
        });
        embedMessageId = sentMessage.id;
      } catch (error) {
        logger.error("Error in playerStart event:", error);
      }
    }
  );
} else {
  logger.error("Player instance is not available.");
}
