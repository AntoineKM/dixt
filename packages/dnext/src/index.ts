import dotenv from "dotenv-flow";
import { Client, Options } from "discord.js";
import EventEmiter from "events";
import Log from "./utils/log";

dotenv.config({
  silent: true,
});

type ClientOptions = Options;

export type dnextOptions = {
  clientOptions?: ClientOptions;
  application?: {
    id: string;
    bot: {
      token: string;
    };
  };
};

export const dnextDefaults = {
  clientOptions: {
    intents: [],
  },
  application: {
    id: process.env.DISCORD_APPLICATION_ID || "",
    bot: {
      token: process.env.DISCORD_BOT_TOKEN || "",
    },
  },
};

class dnext extends EventEmiter {
  public client: Client;
  public application: dnextOptions["application"];

  constructor(public options: dnextOptions = dnextDefaults) {
    super();
    this.client = new Client({
      ...dnextDefaults.clientOptions,
      ...options.clientOptions,
    });
    this.application = options.application;
  }

  public start() {
    dotenv
      .listDotenvFiles(".", process.env.NODE_ENV)
      .forEach((file: string) => Log.info(`loaded env from ${file}`));

    if (!this.application?.id || !this.application?.bot?.token) {
      Log.error("missing discord application id or bot token");
      process.exit(1);
    }

    this.client.login(this.application.bot.token);
    this.client.on("ready", () => {
      Log.ready("client is ready");
    });
  }

  public stop() {
    this.client.destroy();
  }
}

export default dnext;
