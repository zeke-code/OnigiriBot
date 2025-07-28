import { Player, PlayerInitOptions } from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";
import { DefaultExtractors } from "@discord-player/extractor";
import { Client } from "discord.js";

export function initializePlayer(client: Client): Player {
  const player = new Player(client, {
    ytdlOptions: {
      quality: "highestaudio",
      filter: "audioonly",
    },
  } as PlayerInitOptions);

  player.extractors.loadMulti(DefaultExtractors);
  player.extractors.register(YoutubeiExtractor, undefined);

  return player;
}