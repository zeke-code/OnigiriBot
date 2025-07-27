import { ClientEvents } from "discord.js";
import { BotClient } from "../../client/BotClient";

export abstract class Event {
  public name: keyof ClientEvents;
  public once: boolean = false;

  constructor(name: keyof ClientEvents, once: boolean = false) {
    this.name = name;
    this.once = once;
  }

  public abstract execute(client: BotClient, ...args: any[]): Promise<void>;
}
