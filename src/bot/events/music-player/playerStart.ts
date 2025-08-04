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
import logger from "../../../utils/logger";
import { QueueMetadata } from "../../../types/QueueMetadata";
import { createMusicEmbed } from "../../../utils/music/musicEmbed";

const player: Player | undefined = useMainPlayer();

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

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          buttons.slice(0, 5).map(btn => createButton(btn.customId, btn.label, btn.emoji))
        );

        const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          buttons.slice(5).map(btn => createButton(btn.customId, btn.label, btn.emoji))
        );

        const embed = createMusicEmbed()
          .setURL(track.url)
          .setTitle(`${track.title}`)
          .setThumbnail(track.thumbnail || null)
          .addFields(
            {
              name: `Artist`,
              value: `\`${track.author}\``,
              inline: true,
            },
            {
              name: `Playing in`,
              value: `\`${(queue.metadata.voiceChannel as VoiceChannel).name}\``,
              inline: true,
            },
            {
              name: `Requested by`,
              value: `${queue.metadata.requestedBy}`,
              inline: true,
            },
            { name: "Duration", value: `\`${track.duration}\``, inline: true },
            {
              name: "Position in Queue", value: `\`#${queue.tracks.size}\``, inline: true,
            }
          )
          .setColor("#ffffff");

        if (queue.metadata.nowPlayingMessage) {
          await queue.metadata.nowPlayingMessage.edit({
            embeds: [embed],
            components: [row, secondRow],
          });
        } else {
          const sentMessage: Message = await (
            queue.metadata.textChannel as TextChannel
          ).send({
            embeds: [embed],
            components: [row, secondRow],
          });
          queue.metadata.nowPlayingMessage = sentMessage;
        }
      } catch (error) {
        logger.error("Error in playerStart event:", error);
      }
    }
  );
} else {
  logger.error("Player instance is not available.");
}