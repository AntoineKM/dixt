import { Events } from "discord.js";
import { dixtPlugin, Log } from "dixt";
import dotenv from "dotenv-flow";

export const name = "dixt-plugin-react";

dotenv.config({
  silent: true,
});

export type dixtPluginReactOptions = {
  channels?: {
    id: string;
    emoji: string;
    matchs?: string[];
  }[];
};

export const optionsDefaults = {
  channels: [],
};

const dixtPluginReact: dixtPlugin = (
  instance,
  optionsValue?: dixtPluginReactOptions
) => {
  const options = { ...optionsDefaults, ...optionsValue };
  if (options.channels.length === 0) {
    Log.error(`${name} - channels are empty`);
  }

  instance.client.on(Events.MessageCreate, async (message) => {
    options.channels.forEach(async (channel) => {
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
    });
  });

  return {
    name,
  };
};

export default dixtPluginReact;
