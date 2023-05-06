import { APIEmbed, Events, TextChannel } from "discord.js";
import { DixtPlugin, Log, merge } from "dixt";
import dotenv from "dotenv-flow";

import { name } from "../package.json";

dotenv.config({
  silent: true,
});

export type DixtPluginJoinOptions = {
  channel?: string;
  messages?: {
    join?: string;
  };
};

export const optionsDefaults = {
  channel: process.env.DIXT_PLUGIN_JOIN_CHANNEL_ID || "",
  messages: {
    join: "🆕 **%member%** has joined the server !",
  },
};

const dixtPluginJoin: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginJoinOptions
) => {
  const options = merge({}, optionsDefaults, optionsValue);
  if (!options.channel) {
    Log.error(`${name} - channel is required`);
    throw new Error(`${name} - channel is required`);
  }

  instance.client.on(Events.GuildMemberAdd, async (member) => {
    const channel = (await member.guild.channels.fetch(
      options.channel
    )) as TextChannel;

    const embed: APIEmbed = {
      description: options.messages?.join?.replace(
        /%member%/g,
        `${member.user.username}#${member.user.discriminator}`
      ),
    };

    channel.send({ embeds: [embed] });
  });

  return {
    name,
  };
};

export default dixtPluginJoin;
