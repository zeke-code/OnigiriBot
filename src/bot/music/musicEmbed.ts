import { EmbedBuilder, Client } from "discord.js";

export function createMusicEmbed(client?: Client): EmbedBuilder {
  const botName = client?.user?.username || "OnigiriBot";
  const botAvatar = client?.user?.displayAvatarURL() || "https://i.ibb.co/bFJ5GC1/Oni-Avatar.png";

  return new EmbedBuilder().setAuthor({
    name: `♪ ${botName} - Music Player ♪`,
    iconURL: botAvatar,
  });
}
