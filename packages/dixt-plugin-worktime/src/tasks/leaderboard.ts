import dixt, { Log, getTextChannel } from "dixt";
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
      const channel = getTextChannel(
        instance.client,
        controller.options.channels?.leaderboard || ""
      );

      channel.send({
        embeds: [await controller.getLeaderboardEmbed()],
      });

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
