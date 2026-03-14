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

const MANUAL_RECONNECT_INTERVAL_MS = 30_000;

export class MusicManager {
  public readonly client: ExtendedClient;
  public readonly shoukaku: Shoukaku;
  public readonly queues: Collection<string, GuildQueue>;
  private readonly _reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(client: ExtendedClient) {
    this.client = client;
    this.queues = new Collection();
    this.shoukaku = new Shoukaku(
      new Connectors.DiscordJS(this.client),
      nodes,
      shoukakuOptions,
    );

    this.shoukaku.on("ready", (name, reconnected) => {
      logger.info(
        `Lavalink node: ${name} is now connected. ${reconnected ? "(Reconnected)" : ""}`,
      );
      // Cancel any pending manual reconnect for this node
      const timer = this._reconnectTimers.get(name);
      if (timer) {
        clearTimeout(timer);
        this._reconnectTimers.delete(name);
      }
    });

    this.shoukaku.on("error", (name, error) =>
      logger.error(`Lavalink node: ${name} encountered an error.`, error),
    );

    this.shoukaku.on("close", (name, code, reason) =>
      logger.warn(
        `Lavalink node: ${name} closed with code ${code}. Reason: ${reason || "No reason"}`,
      ),
    );

    this.shoukaku.on("disconnect", (name, count) => {
      logger.error(
        `Lavalink node: ${name} disconnected after all retry attempts. Cleaning up ${count} player(s)...`,
      );
      for (const queue of this.queues.values()) {
        queue.destroy().catch(() => {});
      }
      this._scheduleManualReconnect(name);
    });

    this.shoukaku.on("debug", (name, info) => {
      if (process.env.NODE_ENV !== "production") {
        logger.debug(`Lavalink node: ${name} debug: ${info}`);
      }
    });
  }

  private _scheduleManualReconnect(nodeName: string) {
    if (this._reconnectTimers.has(nodeName)) return;

    logger.info(
      `Scheduling manual reconnect for node "${nodeName}" in ${MANUAL_RECONNECT_INTERVAL_MS / 1000}s...`,
    );

    const timer = setTimeout(async () => {
      this._reconnectTimers.delete(nodeName);

      if (this.shoukaku.nodes.has(nodeName)) return; // already back online

      const nodeOption = nodes.find((n) => n.name === nodeName);
      if (!nodeOption) return;

      logger.info(`Attempting manual reconnect to Lavalink node: "${nodeName}"`);
      try {
        this.shoukaku.addNode(nodeOption);
        // If successful, the "ready" event will fire and cancel future retries
      } catch (error) {
        logger.error(`Manual reconnect to node "${nodeName}" failed.`, error);
        this._scheduleManualReconnect(nodeName); // keep retrying
      }
    }, MANUAL_RECONNECT_INTERVAL_MS);

    this._reconnectTimers.set(nodeName, timer);
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
