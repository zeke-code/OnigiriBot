import { Collection } from "discord.js";
import {
  Shoukaku,
  Connectors,
  LavalinkResponse,
  Node as LavalinkNode,
  NodeOption,
  ShoukakuOptions,
} from "shoukaku";
import { ExtendedClient } from "../../types/ExtendedClient";
import logger from "../../utils/logger";
import { GuildQueue } from "./GuildQueue";

const shoukakuOptions: ShoukakuOptions = {
  moveOnDisconnect: false,
  resume: true,
  resumeTimeout: 60,
  // Shoukaku 4.3.0 can discard a successful connection if an earlier attempt
  // failed. Keep its retry window short and let the recovery loop re-add a
  // failed node until the upstream fix is released.
  reconnectTries: 3,
  reconnectInterval: 5,
  restTimeout: 60,
};

const MANUAL_RECONNECT_INTERVAL_MS = 10_000;
const NODE_RECOVERY_AUDIT_INTERVAL_MS = 15_000;
const NODE_STATE_NAMES = [
  "connecting",
  "connected",
  "disconnecting",
  "disconnected",
] as const;

export class LavalinkUnavailableError extends Error {
  constructor(nodeStates: string) {
    super(`No connected Lavalink node is available (${nodeStates}).`);
    this.name = "LavalinkUnavailableError";
  }
}

export class MusicManager {
  public readonly client: ExtendedClient;
  public readonly shoukaku: Shoukaku;
  public readonly queues: Collection<string, GuildQueue>;
  private readonly _nodeOptions: NodeOption[];
  private readonly _watchedNodes = new WeakSet<LavalinkNode>();
  private readonly _reconnectTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private _recoveryAuditTimer: ReturnType<typeof setInterval> | null = null;

  constructor(client: ExtendedClient) {
    this.client = client;
    this.queues = new Collection();
    this._nodeOptions = [
      {
        name: process.env.LAVALINK_NAME || "main-node",
        url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
        auth: process.env.LAVALINK_PASSWORD!,
        secure: process.env.LAVALINK_SECURE === "true",
      },
    ];
    this.shoukaku = new Shoukaku(
      new Connectors.DiscordJS(this.client),
      this._nodeOptions,
      shoukakuOptions,
    );

    this.shoukaku.on("ready", (name, reconnected) => {
      logger.info(
        `Lavalink node: ${name} is now connected. ${reconnected ? "(Reconnected)" : ""}`,
      );
      this._watchNodeDisconnect(name);

      const timer = this._reconnectTimers.get(name);
      if (timer) {
        clearTimeout(timer);
        this._reconnectTimers.delete(name);
      }
    });

    this.shoukaku.on("reconnecting", (name, attemptsLeft, interval) => {
      this._watchNodeDisconnect(name);
      logger.warn(
        `Lavalink node: ${name} is reconnecting in ${interval}s (${attemptsLeft} attempt(s) left).`,
      );
    });

    this.shoukaku.on("error", (name, error) =>
      logger.error(`Lavalink node: ${name} encountered an error.`, error),
    );

    this.shoukaku.on("close", (name, code, reason) => {
      // The manager does not forward the node-level "disconnect" event in
      // Shoukaku 4.3.0, so attach directly while the node is still in its map.
      this._watchNodeDisconnect(name);
      logger.warn(
        `Lavalink node: ${name} closed with code ${code}. Reason: ${reason || "No reason"}`,
      );
    });

    this.shoukaku.on("debug", (name, info) => {
      if (process.env.NODE_ENV !== "production") {
        logger.debug(`Lavalink node: ${name} debug: ${info}`);
      }
    });

    const startRecovery = () => this._startNodeRecoveryAudit();
    if (this.client.isReady()) {
      startRecovery();
    } else {
      this.client.once("clientReady", startRecovery);
    }
  }

  private _startNodeRecoveryAudit() {
    if (this._recoveryAuditTimer) return;

    this._auditNodes();
    this._recoveryAuditTimer = setInterval(
      () => this._auditNodes(),
      NODE_RECOVERY_AUDIT_INTERVAL_MS,
    );
    this._recoveryAuditTimer.unref();
  }

  private _auditNodes() {
    for (const nodeOption of this._nodeOptions) {
      const node = this.shoukaku.nodes.get(nodeOption.name);
      if (node) {
        this._watchNodeDisconnect(nodeOption.name);
        continue;
      }

      logger.warn(
        `Lavalink node: ${nodeOption.name} is missing from the node pool. Scheduling recovery.`,
      );
      this._scheduleManualReconnect(nodeOption.name);
    }
  }

  private _watchNodeDisconnect(nodeName: string) {
    const node = this.shoukaku.nodes.get(nodeName);
    if (!node || this._watchedNodes.has(node)) return;

    this._watchedNodes.add(node);
    node.once("disconnect", () => {
      const affectedQueues = [...this.queues.values()].filter(
        (queue) => queue.player?.node.name === nodeName,
      );
      logger.error(
        `Lavalink node: ${nodeName} disconnected after all retry attempts. Cleaning up ${affectedQueues.length} queue(s)...`,
      );
      void Promise.allSettled(
        affectedQueues.map((queue) => queue.destroy()),
      );
      this._scheduleManualReconnect(nodeName);
    });
  }

  private _scheduleManualReconnect(nodeName: string) {
    if (this._reconnectTimers.has(nodeName)) return;

    logger.info(
      `Scheduling manual reconnect for node "${nodeName}" in ${MANUAL_RECONNECT_INTERVAL_MS / 1000}s...`,
    );

    const timer = setTimeout(() => {
      this._reconnectTimers.delete(nodeName);

      const existingNode = this.shoukaku.nodes.get(nodeName);
      if (existingNode) {
        this._watchNodeDisconnect(nodeName);
        return;
      }

      const nodeOption = this._nodeOptions.find((node) => node.name === nodeName);
      if (!nodeOption) return;

      logger.info(`Attempting manual reconnect to Lavalink node: "${nodeName}"`);
      try {
        this.shoukaku.addNode(nodeOption);
        this._watchNodeDisconnect(nodeName);
      } catch (error) {
        // addNode reports normal asynchronous connection failures through its
        // events. This catch only covers synchronous configuration failures.
        logger.error(`Could not add Lavalink node "${nodeName}".`, error);
        this._scheduleManualReconnect(nodeName);
      }
    }, MANUAL_RECONNECT_INTERVAL_MS);

    timer.unref();
    this._reconnectTimers.set(nodeName, timer);
  }

  /**
   * Retrieves or creates a queue for a server (guild)
   * @param guildId
   * @returns Instance of GuildQueue
   */
  public getQueue(guildId: string): GuildQueue {
    let queue = this.queues.get(guildId);
    if (!queue) {
      queue = new GuildQueue(this, guildId);
      this.queues.set(guildId, queue);
    }
    return queue;
  }

  public async search(query: string): Promise<LavalinkResponse> {
    const node = this.shoukaku.getIdealNode();
    if (!node) {
      const nodeStates = [...this.shoukaku.nodes.values()]
        .map(
          (candidate) =>
            `${candidate.name}:${NODE_STATE_NAMES[candidate.state] ?? candidate.state}`,
        )
        .join(", ");
      throw new LavalinkUnavailableError(nodeStates || "node pool is empty");
    }

    const result = await node.rest.resolve(query);
    if (!result) {
      throw new Error(
        `Lavalink node "${node.name}" returned an empty HTTP response.`,
      );
    }
    return result;
  }
}
