import { ActivityType, PresenceData } from "discord.js";
import { DixtPlugin } from "dixt";

import { name } from "../package.json";

export type DixtPluginPresenceOptions = {
  interval?: number;
  presences?: PresenceData[];
};

export const optionsDefaults = {
  interval: 15,
  presences: [
    {
      status: "online",
      activities: [
        {
          name: "made with dixt",
          type: ActivityType.Playing,
        },
      ],
    },
    {
      status: "dnd",
      activities: [
        {
          name: "github.com/AntoineKM/dixt",
          type: ActivityType.Watching,
        },
      ],
    },
  ],
};

const DixtPluginPresence: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginPresenceOptions
) => {
  const options = { ...optionsDefaults, ...optionsValue };

  let presenceIndex = 0;

  if (options.presences && options.presences.length > 0) {
    // every 15 seconds it will change the activity
    setInterval(async () => {
      await instance.client.user?.setPresence(
        options.presences[presenceIndex] as PresenceData
      );

      presenceIndex =
        presenceIndex === options.presences.length - 1 ? 0 : presenceIndex + 1;
    }, 1000 * (options.interval >= 15 ? options.interval : 15));
  }

  return {
    name,
  };
};

export default DixtPluginPresence;
