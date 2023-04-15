import {
  ActivityType,
  APIEmbed,
  ButtonStyle,
  Colors,
  Events,
  TextChannel,
} from "discord.js";
import { DixtPlugin, Log } from "dixt";
import dotenv from "dotenv-flow";
import packageJson from "../package.json";

export const name = packageJson.name;

dotenv.config({
  silent: true,
});

export type DixtPluginTwitchOptions = {
  channel?: string;
  roles?: string[];
};

export const optionsDefaults = {
  channel: process.env.DIXT_PLUGIN_TWITCH_CHANNEL || "",
  roles: [],
};

export const onlineStreamers: string[] = [];

const dixtPluginTwitch: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginTwitchOptions
) => {
  const options = { ...optionsDefaults, ...optionsValue };

  if (!options.channel) {
    Log.error(`${name} - channel is required`);
    throw new Error(`${name} - channel is required`);
  }

  instance.client.on(
    Events.PresenceUpdate,
    async (oldPresence, newPresence) => {
      // if newpresence is not streaming anymore and was in the onlineStreamers array before remove it
      if (
        newPresence.activities.every(
          (activity) => activity.type !== ActivityType.Streaming
        )
      ) {
        const index = onlineStreamers.indexOf(newPresence.userId);
        if (index > -1) {
          onlineStreamers.splice(index, 1);
        }
      }

      if (
        !newPresence?.activities ||
        newPresence?.activities.length === 0 ||
        oldPresence?.activities === newPresence?.activities ||
        onlineStreamers.includes(newPresence.userId)
      ) {
        return;
      }

      // fetch member
      await newPresence.member?.fetch();
      newPresence.activities.forEach((activity) => {
        if (activity.type === ActivityType.Streaming) {
          Log.info(
            `${newPresence.user} is streaming on ${activity.name} - ${activity.details} - ${activity.url}`
          );

          // check if roles are set
          if (options.roles && options.roles.length > 0) {
            // check if member has roles
            if (
              newPresence.member?.roles &&
              newPresence.member?.roles.cache.size > 0
            ) {
              // check if member has any of the roles
              if (
                newPresence.member?.roles.cache.some((role) =>
                  options.roles?.includes(role.id)
                )
              ) {
                onlineStreamers.push(newPresence.userId);
              } else {
                return;
              }
            }
          }

          const channel = instance.client.channels.cache.get(
            options.channel
          ) as TextChannel;

          const embed: APIEmbed = {
            title: activity.details || "",
            url: activity.url || "",
            author: {
              name: `${
                newPresence.member?.nickname || newPresence.user?.username
              } is now live on ${activity.name}`,
              icon_url: newPresence.user?.avatarURL() || undefined,
              url: activity.url || "",
            },
            color: Colors.Blurple,
            image: {
              url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${
                activity.url?.split("/")[3]
              }-1920x1080.jpg`,
            },
            fields: [
              {
                name: "Game",
                value: activity.state || "",
                inline: true,
              },
            ],
          };

          if (channel) {
            channel.send({
              embeds: [embed],
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      label: "Watch",
                      style: ButtonStyle.Link,
                      url: activity.url || "",
                    },
                  ],
                },
              ],
            });
          }
        }
      });
    }
  );

  return {
    name,
  };
};

export default dixtPluginTwitch;
