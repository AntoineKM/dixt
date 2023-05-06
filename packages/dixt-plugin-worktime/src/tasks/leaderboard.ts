import { ChannelType, TextChannel } from "discord.js";
import dixt, { Log } from "dixt";
import schedule from "node-schedule";

import WorktimeController from "../controllers/worktime";
import Worktime from "../models/Worktime";

const worktimeLeaderboardTask = (
  instance: dixt,
  controller: WorktimeController
) => {
  schedule.scheduleJob(
    controller.options.tasks?.leaderboard || "",
    async () => {
      Log.event(
        "leaderboard task has been started",
        controller.options.tasks?.leaderboard
      );
      const channel = instance.client.channels.cache.get(
        controller.options.channels?.leaderboard || ""
      );

      if (!channel) return;
      // if channel is guildtext channel
      if (channel.type === ChannelType.GuildText) {
        const textChannel = channel as TextChannel;

        // send the leaderboard embed
        textChannel.send({
          embeds: [await controller.getLeaderboardEmbed()],
        });
      }

      // get worktimes from current working users
      const currentWorktimes = await Worktime.find({
        endAt: undefined,
      });

      // remove all worktimes from the database
      await Worktime.deleteMany({});

      // restart all worktimes
      currentWorktimes.forEach(async (worktime) => {
        await Worktime.create({
          userId: worktime.userId,
          startAt: new Date(),
        });
      });

      Log.info("worktimes has been resetted and restarted");
    }
  );
};

export default worktimeLeaderboardTask;
