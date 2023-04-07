import dotenv from "dotenv-flow";
import { Client, Options } from "discord.js";
import EventEmiter from "events";
import Log from "./utils/log";

dotenv.config({
  silent: true,
});

export type ClientOptions = Options;

export type dnextPlugin = (
  dnext: dnext,
  options?: object
) => {
  name: string;
};

export type dnextOptions = {
  clientOptions?: ClientOptions;
  application?: {
    id: string;
    bot: {
      token: string;
    };
  };
  plugins?: (dnextPlugin | [dnextPlugin, object])[];
};

export const dnextDefaults = {
  clientOptions: {
    intents: [],
  },
  application: {
    id: process.env.DNEXT_APPLICATION_ID || "",
    bot: {
      token: process.env.DNEXT_BOT_TOKEN || "",
    },
  },
  plugins: [],
};

class dnext {
  public client: Client;
  public application: dnextOptions["application"];
  public plugins: dnextOptions["plugins"];
  public static events = new EventEmiter();

  constructor(public options: dnextOptions = dnextDefaults) {
    this.client = new Client({
      ...dnextDefaults.clientOptions,
      ...options.clientOptions,
    });
    this.application = { ...dnextDefaults.application, ...options.application };
    this.plugins = options.plugins || [];
  }

  public start() {
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

    this.client.login(this.application.bot.token);
    this.client.on("ready", () => {
      Log.ready("client is ready");
    });
  }

  public stop() {
    this.client.destroy();
  }
}

export { default as reduceString } from "./utils/reduceString";
export { default as Log, prefixes, type LogType } from "./utils/log";
export default dnext;
