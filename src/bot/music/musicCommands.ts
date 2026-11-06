import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { ExtendedClient } from "../../types/ExtendedClient";
import { createNowPlayingCard, createQueueCard } from "./musicComponents";
import { inPlayerVoiceChannel } from "./musicInteractions";
import { formatTime } from "../../utils/formatTime";
import { LoopMode, safeText } from "./track";

const descriptions = {
  queue: "Browse the queue privately and jump to a track.",
  nowplaying: "Show the current track and playback progress.",
  loop: "Set looping: off, repeat the track, or repeat the queue.",
  seek: "Seek to a timestamp in the current track.",
  remove: "Remove an upcoming track by its queue position.",
  move: "Move an upcoming track to another queue position.",
  clear: "Clear upcoming tracks, keeping the current song playing.",
  autoplay: "Keep playing related tracks when the queue runs out.",
  pause: "Pause or resume playback.",
  previous: "Play the previous track.",
  skip: "Skip the current track.",
  stop: "End the music session and leave voice.",
  shuffle: "Shuffle the upcoming queue once.",
  volume: "Show or change the volume.",
} as const;

export function parseTimestamp(value: string): number | null {
  if (!/^\d+(?::[0-5]\d){0,2}$/.test(value)) return null;
  const seconds = value
    .split(":")
    .reduce((sum, part) => sum * 60 + Number(part), 0);
  return Number.isSafeInteger(seconds) ? seconds * 1000 : null;
}

export function createMusicCommand(name: keyof typeof descriptions) {
  const data = new SlashCommandBuilder()
    .setName(name)
    .setDescription(descriptions[name])
    .setContexts(InteractionContextType.Guild);
  if (name === "loop")
    data.addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Loop mode")
        .setRequired(true)
        .addChoices(
          { name: "Off", value: "off" },
          { name: "Track", value: "track" },
          { name: "Queue", value: "queue" },
        ),
    );
  if (name === "seek")
    data.addStringOption((option) =>
      option
        .setName("position")
        .setDescription("Seconds, m:ss, or h:mm:ss")
        .setRequired(true),
    );
  if (name === "remove")
    data.addIntegerOption((option) =>
      option
        .setName("position")
        .setDescription("Queue position (starts at 1)")
        .setRequired(true)
        .setMinValue(1),
    );
  if (name === "move") {
    data.addIntegerOption((option) =>
      option
        .setName("from")
        .setDescription("Current queue position")
        .setRequired(true)
        .setMinValue(1),
    );
    data.addIntegerOption((option) =>
      option
        .setName("to")
        .setDescription("New queue position")
        .setRequired(true)
        .setMinValue(1),
    );
  }
  if (name === "autoplay")
    data.addBooleanOption((option) =>
      option
        .setName("enabled")
        .setDescription("Enable or disable autoplay")
        .setRequired(true),
    );
  if (name === "volume")
    data.addIntegerOption((option) =>
      option
        .setName("level")
        .setDescription("Volume from 0 to 150")
        .setMinValue(0)
        .setMaxValue(150),
    );
  return {
    data,
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const queue = interaction.guildId
        ? (interaction.client as ExtendedClient).musicManager.queues.get(
            interaction.guildId,
          )
        : undefined;
      if (!queue || queue.destroyed) {
        await interaction.editReply("There is no active music session.");
        return;
      }
      if (name === "queue") {
        await interaction.editReply(createQueueCard(queue));
        return;
      }
      if (name === "nowplaying") {
        if (!queue.currentTrack) {
          await interaction.editReply("Loading the next track…");
          return;
        }
        await queue.updateNowPlayingMessage(true);
        await interaction.editReply(createNowPlayingCard(queue, false));
        return;
      }
      if (!(await inPlayerVoiceChannel(interaction, queue))) {
        await interaction.editReply(
          "You must be in the same voice channel as me to control playback.",
        );
        return;
      }
      await queue.runExclusive(async () => {
        let response: string;
        switch (name) {
          case "loop":
            queue.loopMode = interaction.options.getString(
              "mode",
              true,
            ) as LoopMode;
            response = `Loop: ${queue.loopMode}.`;
            break;
          case "autoplay":
            queue.autoplay = interaction.options.getBoolean("enabled", true);
            response = `Autoplay ${queue.autoplay ? "enabled" : "disabled"}.`;
            break;
          case "seek": {
            const position = parseTimestamp(
              interaction.options.getString("position", true),
            );
            if (position === null) {
              response =
                "Use seconds, m:ss, or h:mm:ss (for example 90 or 1:30).";
              break;
            }
            await queue.seek(position);
            response = `Seeked to ${formatTime(position)}.`;
            break;
          }
          case "remove": {
            const removed = queue.remove(
              interaction.options.getInteger("position", true),
            );
            response = `Removed **${safeText(removed.info.title)}**.`;
            break;
          }
          case "move":
            queue.move(
              interaction.options.getInteger("from", true),
              interaction.options.getInteger("to", true),
            );
            response = "Queue order updated.";
            break;
          case "clear": {
            const count = queue.tracks.length;
            queue.tracks = [];
            response = `Cleared ${count} queued tracks. The current song continues${queue.autoplay ? "; autoplay is still on" : ""}.`;
            break;
          }
          case "pause":
            await queue.pause(!queue.isPaused);
            response = queue.isPaused ? "Paused." : "Resumed.";
            break;
          case "skip":
            response = (await queue.skip())
              ? "Skipped the current track."
              : "There is no current track to skip.";
            break;
          case "previous":
            response = (await queue.previous())
              ? "Playing the previous track."
              : "No previous track in history.";
            break;
          case "stop":
            await queue.destroy();
            response = "Music session ended.";
            break;
          case "shuffle":
            if (queue.tracks.length < 2)
              response = "Add at least two upcoming tracks to shuffle.";
            else {
              await queue.shuffle();
              response = "Queue shuffled.";
            }
            break;
          case "volume": {
            const level = interaction.options.getInteger("level");
            if (level !== null) await queue.setVolume(level);
            response = `Volume: ${queue.volume}%.`;
            break;
          }
        }
        await queue.updateNowPlayingMessage();
        await interaction.editReply({
          content: response,
          allowedMentions: { parse: [] },
        });
      });
    },
  };
}
