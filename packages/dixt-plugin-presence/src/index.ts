import { ActivitiesOptions, ActivityType } from "discord.js";
import { DixtPlugin } from "dixt";
import dotenv from "dotenv-flow";
import { name } from "../package.json";

dotenv.config({
  silent: true,
});

export type DixtPluginPresenceOptions = {
  interval?: number;
  activities?: ActivitiesOptions[][];
};

export const optionsDefaults = {
  interval: 15,
  activities: [
    [
      {
        name: "made with dixt",
        type: ActivityType.Playing,
      },
    ],
    [
      {
        name: "github.com/AntoineKM/dixt",
        type: ActivityType.Watching,
      },
    ],
  ],
};

const DixtPluginPresence: DixtPlugin = (
  instance,
  optionsValue?: DixtPluginPresenceOptions
) => {
  const options = { ...optionsDefaults, ...optionsValue };

  let activityIndex = 0;

  if (options.activities && options.activities.length > 0) {
    // every 15 seconds it will change the activity
    setInterval(async () => {
      await instance.client.user?.setPresence({
        activities: options.activities[activityIndex] as ActivitiesOptions[],
      });

      activityIndex =
        activityIndex === options.activities.length - 1 ? 0 : activityIndex + 1;
    }, 1000 * (options.interval >= 15 ? options.interval : 15));
  }

  return {
    name,
  };
};

export default DixtPluginPresence;
