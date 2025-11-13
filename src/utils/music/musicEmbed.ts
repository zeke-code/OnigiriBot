import { EmbedBuilder } from "discord.js";

/**
 * Creates a new EmbedBuilder instance with the default music player author.
 * @returns {EmbedBuilder} A new EmbedBuilder instance.
 */
export function createMusicEmbed(): EmbedBuilder {
  return new EmbedBuilder().setAuthor({
    name: "♪ Onigiri - Music Player ♪",
    iconURL: "https://i.ibb.co/bFJ5GC1/Oni-Avatar.png",
  });
}
