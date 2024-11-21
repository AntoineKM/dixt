import { Client, Events, GatewayIntentBits, type Options } from "discord.js";
import dotenv from "dotenv-flow";
import EventEmiter from "events";
import { merge } from "lodash";
import mongoose, { type Mongoose } from "mongoose";
import process from "process";

import type { DixtClient, DixtSlashCommandBuilder } from "./types";
import Log from "./utils/log";

dotenv.config({
  silent: true,
});

export type ClientOptions = Options;

export type DixtPlugin<DixtPluginOptions = object> = (
  _dixt: dixt,
  _options?: DixtPluginOptions,
) =>
  | {
      name: string;
      commands?: DixtSlashCommandBuilder[];
    }
  | Promise<{
      name: string;
      commands?: DixtSlashCommandBuilder[];
    }>;

export type DixtOptions = {
  clientOptions?: ClientOptions;
  application?: {
    id?: string;
    name?: string;
    logo?: string;
    bot?: {
      token?: string;
    };
  };
  plugins?: (DixtPlugin | [DixtPlugin, object])[];
  databaseUri?: string;
  messages?: {
    error?: {
      dmBlocked?: string;
    };
  };
};

export const dixtDefaults = {
  clientOptions: {
    intents: Object.values(GatewayIntentBits) as GatewayIntentBits[],
  },
  application: {
    id: process.env.DIXT_APPLICATION_ID || "",
    name: process.env.DIXT_APPLICATION_NAME || "",
    logo: process.env.DIXT_APPLICATION_LOGO || "",
    bot: {
      token: process.env.DIXT_BOT_TOKEN || "",
    },
  },
  plugins: [],
  databaseUri: process.env.DIXT_DATABASE_URI || "",
  messages: {
    error: {
      // eslint-disable-next-line quotes
      dmBlocked: `it seems that your private messages are disabled. Please enable them in order to use this feature. To solve this problem, go to **Settings > Privacy & Security**, then check the box "Allow private messages from server members".\n\nIf the problem persists, please contact an administrator.`,
    },
  },
};

class dixt {
  public client: DixtClient;
  public application: DixtOptions["application"];
  public plugins: DixtOptions["plugins"];
  public databaseUri: DixtOptions["databaseUri"];
  public messages: DixtOptions["messages"];

  public static database: Mongoose = mongoose;
  public static events = new EventEmiter();

  constructor(public options: DixtOptions = dixtDefaults) {
    this.client = new Client(
      merge({}, dixtDefaults.clientOptions, options.clientOptions),
    );
    this.application = merge({}, dixtDefaults.application, options.application);
    this.plugins = options.plugins || [];
    this.databaseUri = options.databaseUri || dixtDefaults.databaseUri;
    this.messages = merge({}, dixtDefaults.messages, options.messages);
  }

  public async start() {
    Log.wait("loading env files");
    dotenv
      .listDotenvFiles(".", {
        node_env: process.env.NODE_ENV,
      })
      .forEach((file: string) => Log.info(`loaded env from ${file}`));

    if (!this.application?.id || !this.application?.bot?.token) {
      Log.error("missing discord application id or bot token");
      process.exit(1);
    }

    if (this.databaseUri) {
      Log.wait("connecting to database");
      try {
        await dixt.database.connect(this.databaseUri, {});
        Log.ready("connected to database");
      } catch (error) {
        Log.error("failed to connect to database");
        Log.error(error);
        process.exit(1);
      }
    }

    if (!this.plugins || this.plugins.length === 0) {
      Log.info("skipping plugin loading, no plugins found");
    } else {
      Log.wait("loading plugins");
      this.plugins.forEach(async (plugin) => {
        if (Array.isArray(plugin)) {
          const [pluginModule, pluginOptions] = plugin;
          const { name: pluginName } = await pluginModule(this, pluginOptions);
          Log.info(`loaded plugin ${pluginName}`);
        } else {
          const { name: pluginName } = await plugin(this);
          Log.info(`loaded plugin ${pluginName}`);
        }
      });
    }

    this.client.on(Events.ClientReady, () => {
      Log.ready("client is ready");
    });

    await this.client.login(this.application.bot.token);
  }

  public stop() {
    this.client.destroy();
  }
}

process.on("unhandledRejection", async (reason, promise) => {
  Log.error("unhandled promise rejection", promise, "reason:", reason);
});

process.on("uncaughtException", async (error) => {
  Log.error("uncaught exception", error);
});

process.on("uncaughtExceptionMonitor", async (error, origin) => {
  Log.error("uncaught exception monitor", error, "origin:", origin);
});

export { merge };
export { default as capitalize } from "./utils/capitalize";
export * from "./utils/discord";
export { default as formatDuration } from "./utils/formatDuration";
export { default as isNumber } from "./utils/isNumber";
export { default as isString } from "./utils/isString";
export { default as Log, prefixes, type LogType } from "./utils/log";
export { default as pad } from "./utils/pad";
export { default as progressIndicator } from "./utils/progressIndicator";
export { default as reduceString } from "./utils/reduceString";

export type { DixtClient, DixtSlashCommandBuilder } from "./types";

export default dixt;
