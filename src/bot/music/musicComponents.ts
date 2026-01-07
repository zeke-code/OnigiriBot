// filepath: src/utils/music/musicComponents.ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { MUSIC_BUTTONS } from "./constants";

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
    .setCustomId(MUSIC_BUTTONS.PREVIOUS)
    .setLabel("Prev")
    .setEmoji("⏮️")
    .setStyle(ButtonStyle.Secondary);

  const pauseResume = new ButtonBuilder()
    .setCustomId(MUSIC_BUTTONS.PAUSE)
    .setLabel(isPaused ? "Resume" : "Pause")
    .setEmoji(isPaused ? "▶️" : "⏸️")
    .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary);

  const stop = new ButtonBuilder()
    .setCustomId(MUSIC_BUTTONS.STOP)
    .setLabel("Stop")
    .setEmoji("⏹️")
    .setStyle(ButtonStyle.Danger);

  const skip = new ButtonBuilder()
    .setCustomId(MUSIC_BUTTONS.SKIP)
    .setLabel("Skip")
    .setEmoji("⏭️")
    .setStyle(ButtonStyle.Secondary);

  // Row 2: Volume & Shuffle
  const volDown = new ButtonBuilder()
    .setCustomId(MUSIC_BUTTONS.VOLUME_DOWN)
    .setLabel("-10%")
    .setEmoji("🔉")
    .setStyle(ButtonStyle.Secondary);

  const shuffle = new ButtonBuilder()
    .setCustomId(MUSIC_BUTTONS.SHUFFLE)
    .setLabel("Shuffle")
    .setEmoji("🔀")
    .setStyle(ButtonStyle.Primary);

  const volUp = new ButtonBuilder()
    .setCustomId(MUSIC_BUTTONS.VOLUME_UP)
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
