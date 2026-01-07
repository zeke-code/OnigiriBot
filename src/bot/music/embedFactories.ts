import { EmbedBuilder, Client } from "discord.js";
import { LavalinkResponse, LoadType, Track } from "shoukaku";
import { formatTime } from "../../utils/formatTime";

export function createMusicEmbed(client?: Client): EmbedBuilder {
  const botName = client?.user?.username || "OnigiriBot";
  const botAvatar =
    client?.user?.displayAvatarURL() ||
    "https://i.ibb.co/bFJ5GC1/Oni-Avatar.png";

  return new EmbedBuilder().setAuthor({
    name: `♪ ${botName} - Music Player ♪`,
    iconURL: botAvatar,
  });
}

export function createAddedToQueueEmbed(
  client: Client,
  result: LavalinkResponse,
): EmbedBuilder {
  const embed = createMusicEmbed(client);

  switch (result.loadType) {
    case LoadType.TRACK:
    case LoadType.SEARCH: {
      const track =
        result.loadType === LoadType.TRACK ? result.data : result.data[0];
      const trackInfo = track.info;
      const artworkUrl =
        (trackInfo as any).artworkUrl || client.user?.displayAvatarURL();

      embed
        .setTitle("✅ Added to Queue")
        .setDescription(`**[${trackInfo.title}](${trackInfo.uri})**`)
        .setThumbnail(artworkUrl)
        .addFields(
          {
            name: "👤 Artist",
            value: trackInfo.author || "Unknown",
            inline: true,
          },
          {
            name: "⏳ Duration",
            value: trackInfo.isStream
              ? "🔴 LIVE"
              : formatTime(trackInfo.length),
            inline: true,
          },
        );
      break;
    }
    case LoadType.PLAYLIST: {
      const tracks = result.data.tracks;
      const playlistInfo = result.data.info;
      const firstTrackInfo = tracks[0]?.info;
      const artworkUrl =
        (firstTrackInfo as any)?.artworkUrl || client.user?.displayAvatarURL();
      const totalDuration = tracks.reduce(
        (acc, t) => acc + (t.info.length || 0),
        0,
      );

      embed
        .setTitle("✅ Playlist Added")
        .setDescription(`**${playlistInfo.name}**`)
        .setThumbnail(artworkUrl)
        .addFields(
          { name: "🔢 Tracks", value: `${tracks.length}`, inline: true },
          {
            name: "⏳ Total Duration",
            value: formatTime(totalDuration),
            inline: true,
          },
        );
      break;
    }
  }
  return embed;
}

export function createVolumeEmbed(
  client: Client | undefined,
  volume: number,
  isChanged: boolean = false,
  isIncreased: boolean = true,
): EmbedBuilder {
  const title = isChanged
    ? isIncreased
      ? "🔊 Volume Increased"
      : "🔉 Volume Decreased"
    : "🔊 Volume Level";

  const description = isChanged
    ? `Volume set to **${volume}%**`
    : `The current volume is **${volume}%**.`;

  return createMusicEmbed(client)
    .setTitle(title)
    .setDescription(description)
    .setColor("Blue");
}

export function createShuffleEmbed(client: Client | undefined): EmbedBuilder {
  return createMusicEmbed(client)
    .setTitle("🔀 Queue Shuffled")
    .setDescription("The queue has been shuffled successfully!")
    .setColor("Green");
}

export function createPauseEmbed(
  client: Client | undefined,
  isPaused: boolean,
): EmbedBuilder {
  return createMusicEmbed(client)
    .setTitle(isPaused ? "⏸️ Paused" : "▶️ Resumed")
    .setDescription(
      isPaused ? "The player has been paused." : "The player has been resumed.",
    )
    .setColor(isPaused ? "Yellow" : "Green");
}

export function createStopEmbed(client: Client | undefined): EmbedBuilder {
  return createMusicEmbed(client)
    .setTitle("🛑 Player Stopped")
    .setDescription(
      "The music has been stopped, the queue has been cleared, and I've left the voice channel.",
    )
    .setColor("Red");
}

export function createNowPlayingEmbed(
  client: Client | undefined,
  track: Track,
  volume: number,
  isShuffled: boolean,
): EmbedBuilder {
  const trackInfo = track.info;
  const artworkUrl =
    (trackInfo as any).artworkUrl || client?.user?.displayAvatarURL();

  return createMusicEmbed(client)
    .setTitle("💿 Now Playing")
    .setDescription(`**[${trackInfo.title}](${trackInfo.uri})**`)
    .setThumbnail(artworkUrl)
    .addFields(
      {
        name: "👤 Artist",
        value: trackInfo.author || "Unknown Artist",
        inline: true,
      },
      {
        name: "⏳ Duration",
        value: trackInfo.isStream ? "🔴 LIVE" : formatTime(trackInfo.length),
        inline: true,
      },
      {
        name: "🔊 Volume",
        value: `${volume}%`,
        inline: true,
      },
      {
        name: "🔀 Shuffle",
        value: isShuffled ? "✅ On" : "❌ Off",
        inline: true,
      },
    )
    .setColor("#1DB954");
}
