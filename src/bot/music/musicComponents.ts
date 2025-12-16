// filepath: src/utils/music/musicComponents.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

/**
 * Creates the interactive buttons for the music player.
 * @param isPaused - Whether the player is currently paused.
 * @returns An array of ActionRows containing the buttons.
 */
export function createMusicButtons(
  isPaused: boolean = false,
): ActionRowBuilder<ButtonBuilder>[] {
  // Row 1: Playback Controls
  const previous = new ButtonBuilder()
    .setCustomId("music_previous")
    .setLabel("Prev")
    .setEmoji("⏮️")
    .setStyle(ButtonStyle.Secondary);

  const pauseResume = new ButtonBuilder()
    .setCustomId("music_pause")
    .setLabel(isPaused ? "Resume" : "Pause")
    .setEmoji(isPaused ? "▶️" : "⏸️")
    .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary);

  const stop = new ButtonBuilder()
    .setCustomId("music_stop")
    .setLabel("Stop")
    .setEmoji("⏹️")
    .setStyle(ButtonStyle.Danger);

  const skip = new ButtonBuilder()
    .setCustomId("music_skip")
    .setLabel("Skip")
    .setEmoji("⏭️")
    .setStyle(ButtonStyle.Secondary);

  // Row 2: Volume & Shuffle
  const volDown = new ButtonBuilder()
    .setCustomId("music_voldown")
    .setLabel("-10%")
    .setEmoji("🔉")
    .setStyle(ButtonStyle.Secondary);

  const shuffle = new ButtonBuilder()
    .setCustomId("music_shuffle")
    .setLabel("Shuffle")
    .setEmoji("🔀")
    .setStyle(ButtonStyle.Primary);

  const volUp = new ButtonBuilder()
    .setCustomId("music_volup")
    .setLabel("+10%")
    .setEmoji("🔊")
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    previous,
    pauseResume,
    stop,
    skip,
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    volDown,
    shuffle,
    volUp,
  );

  return [row1, row2];
}
