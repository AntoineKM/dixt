import {
  APIEmbed,
  Colors,
  Events,
  HexColorString,
  TextChannel,
} from "discord.js";
import { DixtPlugin, Log, merge, isString } from "dixt";
import dotenv from "dotenv-flow";
import urlcat from "urlcat";

import convertHexColortoNumber from "./utils/convertHexColortoNumber";
import { name } from "../package.json";

dotenv.config({
  silent: true,
});

export type DixtPluginJoinOptions = {
  channel?: string;
  background?: string;
  messages?: {
    content?: string;
    line1?: string;
    line2?: string;
    line3?: string;
  };
  color?: typeof Colors | number | HexColorString;
};

export const optionsDefaults = {
  channel: process.env.DIXT_PLUGIN_JOIN_CHANNEL_ID || "",
  messages: {
    content: "🆕 **%member%** has joined the server !",
    line1: "%member%",
    line2: "Welcome to dixt community !",
    line3: "%memberCount% members",
  },
  color: Colors.NotQuiteBlack,
  background: "https://i.goopics.net/m9bbrn.png",
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

    const welcomeCard = urlcat("https://api.popcat.xyz/welcomecard", {
      background: options.background,
      avatar: member.user.displayAvatarURL(),
      text1: options.messages?.line1?.replace(
        /%member%/g,
        member.user.username
      ),
      text2: options.messages?.line2,
      text3: options.messages?.line3?.replace(
        /%memberCount%/g,
        member.guild.memberCount.toString()
      ),
    });

    // check if color is string
    const color: number = isString(options.color)
      ? convertHexColortoNumber(options.color as unknown as `#${string}`)
      : (options.color as number);

    const embed: APIEmbed = {
      description: options.messages?.content?.replace(
        /%member%/g,
        `${member.user.username}#${member.user.discriminator}`
      ),
      image: {
        url: decodeURIComponent(welcomeCard),
      },
      footer: {
        text: instance.application?.name || "",
        icon_url: instance.application?.logo || "",
      },
      color,
    };

    channel.send({ embeds: [embed] });
  });

  return {
    name,
  };
};

export default dixtPluginJoin;
