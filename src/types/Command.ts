import type { AutocompleteInteraction } from "discord.js";

export interface Command {
  data: {
    name: string;
    description: string;
  };
  execute: (...args: any[]) => Promise<void> | void;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}
