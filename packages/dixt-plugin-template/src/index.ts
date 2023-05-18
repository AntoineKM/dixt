import { Events } from "discord.js";
import { DixtPlugin, Log, merge } from "dixt";
import dotenv from "dotenv-flow";

import { name } from "../package.json";

dotenv.config({
  silent: true,
});

export type DixtPluginTemplateOptions = {
  channel?: string;
};

export const optionsDefaults = {
  channel: process.env.DIXT_PLUGIN_TEMPLATE_CHANNEL_ID || "",
};

const dixtPluginTemplate: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginTemplateOptions
) => {
  const options = merge({}, optionsDefaults, optionsValue);
  if (!options.channel) {
    Log.error(`${name} - channel is required`);
    throw new Error(`${name} - channel is required`);
  }

  instance.client.on(Events.ClientReady, () => {
    Log.ready(`${name} - is now running, create your own plugin!`);
  });

  return {
    name,
  };
};

export default dixtPluginTemplate;
