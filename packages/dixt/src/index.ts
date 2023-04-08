import dotenv from "dotenv-flow";
import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import EventEmiter from "events";
import Log from "./utils/log";

dotenv.config({
  silent: true,
});

export type ClientOptions = Options;

export type dixtPlugin = (
  dixt: dixt,
  options?: object
) => {
  name: string;
};

export type dixtOptions = {
  clientOptions?: ClientOptions;
  application?: {
    id: string;
    bot: {
      token: string;
    };
  };
  plugins?: (dixtPlugin | [dixtPlugin, object])[];
};

export const dixtDefaults = {
  clientOptions: {
    intents: Object.values(GatewayIntentBits) as GatewayIntentBits[],
  },
  application: {
    id: process.env.DIXT_APPLICATION_ID || "",
    bot: {
      token: process.env.DIXT_BOT_TOKEN || "",
    },
  },
  plugins: [],
};

class dixt {
  public client: Client;
  public application: dixtOptions["application"];
  public plugins: dixtOptions["plugins"];
  public static events = new EventEmiter();

  constructor(public options: dixtOptions = dixtDefaults) {
    this.client = new Client({
      ...dixtDefaults.clientOptions,
      ...options.clientOptions,
    });
    this.application = { ...dixtDefaults.application, ...options.application };
    this.plugins = options.plugins || [];
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

    if (!this.plugins || this.plugins.length === 0) {
      Log.info("skipping plugin loading, no plugins found");
    } else {
      Log.wait("loading plugins");
      this.plugins.forEach((plugin) => {
        if (Array.isArray(plugin)) {
          const [pluginModule, pluginOptions] = plugin;
          const { name: pluginName } = pluginModule(this, pluginOptions);
          Log.info(`loaded plugin ${pluginName}`);
        } else {
          const { name: pluginName } = plugin(this);
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

export { default as reduceString } from "./utils/reduceString";
export { default as Log, prefixes, type LogType } from "./utils/log";
export default dixt;
