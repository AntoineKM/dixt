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
};

export const optionsDefaults = {
  pattern: "[%prefix%] %name% [%suffix%]",
};

const DixtPluginAffix: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginAffixOptions
) => {
  const options = { ...optionsDefaults, ...optionsValue };

  instance.client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    console.log("GuildMemberUpdate");
    if (oldMember.roles.cache.size === newMember.roles.cache.size) return;

    const roles = newMember.roles.cache;
    let name = newMember.nickname || newMember.user.username;

    const prefix = roles
      .filter((role) => options.prefix?.[role.id])
      .map((role) => options.prefix?.[role.id])
      .join(" ");

    const suffix = roles
      .filter((role) => options.suffix?.[role.id])
      .map((role) => options.suffix?.[role.id])
      .join(" ");

    name = options.pattern.replace(
      /%prefix%/g,
      prefix ? reduceString(prefix, 32) : ""
    );
    name = name.replace(/%name%/g, reduceString(name, 32));
    name = name.replace(/%suffix%/g, suffix ? reduceString(suffix, 32) : "");

    try {
      await newMember.setNickname(reduceString(name, 32));
    } catch (error) {
      Log.error(
        `${newMember} could not be renamed to ${name}, an error occured: ${error}`
      );
    }

    console.log("Nickname changed");
  });

  return {
    name,
  };
};

export default DixtPluginAffix;
