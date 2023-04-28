import { Events } from "discord.js";
import { DixtPlugin, Log, reduceString } from "dixt";

import { name } from "../package.json";

export type DixtPluginAffixOptions = {
  pattern?: string;
  prefix?: {
    [roleId: string]: string;
  };
  suffix?: {
    [roleId: string]: string;
  };
  prefixPattern?: RegExp;
  suffixPattern?: RegExp;
};

export const optionsDefaults = {
  pattern: "[%prefix%] %name% [%suffix%]",
  prefixPattern: /\[(\S+)\]/,
  suffixPattern: /\[(\S+)\]$/,
};

const DixtPluginAffix: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginAffixOptions
) => {
  const options = { ...optionsDefaults, ...optionsValue };

  instance.client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (oldMember.roles.cache.size === newMember.roles.cache.size) return;

    const roles = newMember.roles.cache;
    const name = newMember.nickname || newMember.user.username;
    let nickname = name;

    // remove affixes
    const prefixMatch = name.match(options.prefixPattern);
    const suffixMatch = name.match(options.suffixPattern);

    if (prefixMatch) {
      nickname = nickname.replace(prefixMatch[0], "").trim();
    }
    if (suffixMatch) {
      nickname = nickname.replace(suffixMatch[0], "").trim();
    }

    // add affixes if needed
    nickname = options.pattern.replace(/%name%/g, nickname);

    const prefixRole = roles
      .sort((a, b) => b.position - a.position)
      .find((r) => Object.keys(options.prefix || {}).includes(r.id));

    if (prefixRole && options.prefix) {
      nickname = nickname.replace(
        /%prefix%/g,
        options.prefix[prefixRole.id] || ""
      );
    } else {
      nickname = nickname.replace(options.prefixPattern, "");
    }

    const suffixRole = roles
      .sort((a, b) => a.position - b.position)
      .find((r) => Object.keys(options.suffix || {}).includes(r.id));

    if (suffixRole && options.suffix) {
      nickname = nickname.replace(
        /%suffix%/g,
        options.suffix[suffixRole.id] || ""
      );
    } else {
      nickname = nickname.replace(options.suffixPattern, "");
    }

    try {
      await newMember.setNickname(reduceString(nickname, 32));
    } catch (error) {
      Log.error(
        `${newMember} could not be renamed to ${nickname}, an error occured: ${error}`
      );
    }
  });

  return {
    name,
  };
};

export default DixtPluginAffix;
