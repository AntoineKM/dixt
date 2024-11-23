import dixt from "dixt";
import schedule from "node-schedule";

import WorktimeController from "../controllers/worktime";

const worktimeLeaderboardTask = (
  instance: dixt,
  controller: WorktimeController,
) => {
  schedule.scheduleJob(
    controller.options.tasks?.leaderboard || "",
    async () => {
      await controller.handleWeeklyReset();
    },
  );
};

export default worktimeLeaderboardTask;
