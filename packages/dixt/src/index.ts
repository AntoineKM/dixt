import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import dotenv from "dotenv-flow";
import EventEmiter from "events";
import fs from "fs";
import mongoose, { Mongoose } from "mongoose";
import path from "path";

import { DixtClient, DixtSlashCommandBuilder } from "./types";
import Log from "./utils/log";

dotenv.config({
  silent: true,
});

export type ClientOptions = Options;

export type DixtPlugin = (
  _dixt: dixt,
  _options?: object
) => {
  name: string;
  commands?: DixtSlashCommandBuilder[];
};

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

export const loadCommands = (instance: dixt, dir = __dirname) => {
  if (instance.client.commands && instance.client.commands.size > 0) {
    fs.readdirSync(path.join(__dirname, "commands"))
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
      .forEach((file) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const command = require(path.join(dir, "commands", file)).default;
          instance.client.commands?.set(command.data.name, command(instance));
          Log.ready(`loaded command ${file}`);
        } catch (error) {
          Log.error(`failed to load command ${file}`, error);
        }
      });
  }
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
    this.client = new Client({
      ...dixtDefaults.clientOptions,
      ...options.clientOptions,
    });
    this.application = { ...dixtDefaults.application, ...options.application };
    this.plugins = options.plugins || [];
    this.databaseUri = options.databaseUri || dixtDefaults.databaseUri;
    this.messages = { ...dixtDefaults.messages, ...options.messages };
  }

  public async start() {
    const projectDirectory = path.join(__dirname, "../../");

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

    Log.wait("loading commands");
    loadCommands(this);
    loadCommands(this, projectDirectory);

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.client.commands?.get(interaction.commandName);

      if (!command) return;

      try {
        await (command as DixtSlashCommandBuilder).execute(interaction);
      } catch (error) {
        Log.error(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        // command handling
      } else if (interaction.isAutocomplete()) {
        const command = (interaction.client as DixtClient).commands?.get(
          interaction.commandName
        );

        if (!command) {
          Log.error(
            `No command matching ${interaction.commandName} was found.`
          );
          return;
        }

        try {
          await (command as DixtSlashCommandBuilder).autocomplete(interaction);
        } catch (error) {
          Log.error(error);
        }
      }
    });

    this.client.on(Events.ClientReady, () => {
      Log.ready("client is ready");
    });

    await this.client.login(this.application.bot.token);
  }

  public stop() {
    this.client.destroy();
  }
}

export { default as capitalize } from "./utils/capitalize";
export { default as formatDuration } from "./utils/formatDuration";
export { default as Log, prefixes, type LogType } from "./utils/log";
export { default as pad } from "./utils/pad";
export { default as progressIndicator } from "./utils/progressIndicator";
export { default as reduceString } from "./utils/reduceString";

export { type DixtClient, type DixtSlashCommandBuilder } from "./types";

export default dixt;
