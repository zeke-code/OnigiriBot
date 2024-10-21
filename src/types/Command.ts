export interface Command {
  data: {
    name: string;
    description: string;
  };
  execute: (...args: any[]) => Promise<void> | void;
}
