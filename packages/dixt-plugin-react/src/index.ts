import { Events } from "discord.js";
import { DixtPlugin, Log, merge } from "dixt";
import dotenv from "dotenv-flow";

import { name } from "../package.json";

dotenv.config({
  silent: true,
});

export type DixtPluginReactOptions = {
  channels?: {
    id: string;
    emoji: string;
    matchs?: string[];
  }[];
};

export const optionsDefaults = {
  channels: [],
};

const dixtPluginReact: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginReactOptions
) => {
  const options = merge({}, optionsDefaults, optionsValue);
  if (options.channels.length === 0) {
    Log.error(`${name} - channels are empty`);
  }

  instance.client.on(Events.MessageCreate, async (message) => {
    (options.channels as DixtPluginReactOptions["channels"])?.forEach(
      async (channel) => {
        if (message.channel.id === channel.id) {
          if (channel.matchs && channel.matchs.length > 0) {
            channel.matchs.forEach((match) => {
              if (message.content.includes(match)) {
                message.react(channel.emoji);
              }
            });
          } else {
            message.react(channel.emoji);
          }
        }
      }
    );
  });

  return {
    name,
  };
};

export default dixtPluginReact;
