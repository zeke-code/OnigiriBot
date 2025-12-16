import { Client, Collection } from "discord.js";
import { Command } from "./Command";
import { MusicManager } from "../bot/music/MusicManager";

export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
  musicManager: MusicManager;
}
