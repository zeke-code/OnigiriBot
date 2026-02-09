import { Collection } from "discord.js";
import { Shoukaku, Connectors, NodeOption, ShoukakuOptions } from "shoukaku";
import { ExtendedClient } from "../../types/ExtendedClient";
import logger from "../../utils/logger";
import { GuildQueue } from "./GuildQueue";

const nodes: NodeOption[] = [
  {
    name: process.env.LAVALINK_NAME || "main-node",
    url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
    auth: process.env.LAVALINK_PASSWORD!,
    secure: process.env.LAVALINK_SECURE === "true",
  },
];

const shoukakuOptions: ShoukakuOptions = {
  moveOnDisconnect: false,
  resume: true,
  resumeTimeout: 60,
  reconnectTries: 10,
  reconnectInterval: 20,
  restTimeout: 10,
};

export class MusicManager {
  public readonly client: ExtendedClient;
  public readonly shoukaku: Shoukaku;
  public readonly queues: Collection<string, GuildQueue>;

  constructor(client: ExtendedClient) {
    this.client = client;
    this.queues = new Collection();
    this.shoukaku = new Shoukaku(
      new Connectors.DiscordJS(this.client),
      nodes,
      shoukakuOptions,
    );

    this.shoukaku.on("ready", (name, reconnected) =>
      logger.info(
        `Lavalink node: ${name} is now connected. ${reconnected ? "(Reconnected)" : ""}`,
      ),
    );

    this.shoukaku.on("error", (name, error) =>
      logger.error(`Lavalink node: ${name} encountered an error.`, error),
    );

    this.shoukaku.on("close", (name, code, reason) =>
      logger.warn(
        `Lavalink node: ${name} closed with code ${code}. Reason: ${reason || "No reason"}`,
      ),
    );

    this.shoukaku.on("debug", (name, info) => {
      if (process.env.NODE_ENV !== "production") {
        logger.debug(`Lavalink node: ${name} debug: ${info}`);
      }
    });
  }

  /**
   * Retrieves or creates a queue for a server (guild)
   * @param guildId
   * @returns Istance of GuildQueue
   */
  public getQueue(guildId: string): GuildQueue {
    let queue = this.queues.get(guildId);
    if (!queue) {
      queue = new GuildQueue(this, guildId);
      this.queues.set(guildId, queue);
    }
    return queue;
  }

  public async search(query: string) {
    const node = this.shoukaku.getIdealNode();
    if (!node) return null;
    return node.rest.resolve(query);
  }
}
