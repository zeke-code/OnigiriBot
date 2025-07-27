import { Client, Collection, ClientOptions } from "discord.js";
import { Command } from "../commands/base/Command";
import { Logger } from "../../services/LoggerService";

export class BotClient extends Client {
  public commands: Collection<string, Command>;
  public aliases: Collection<string, string>;
  public cooldowns: Collection<string, Collection<string, number>>;
  public logger: Logger;

  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
    this.aliases = new Collection();
    this.cooldowns = new Collection();
    this.logger = new Logger();
  }
}
