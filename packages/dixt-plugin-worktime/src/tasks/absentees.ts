import dixt from "dixt";
import schedule from "node-schedule";

import WorktimeController from "../controllers/worktime";

const worktimeAbsenteesTask = (
  instance: dixt,
  controller: WorktimeController,
) => {
  schedule.scheduleJob(controller.options.tasks?.absentees || "", async () => {
    const absentees = await controller.getAbsentees(
      controller.options.reports?.maximumDaysAbsent || 2,
    );
    if (!absentees || absentees.length === 0) return;
    absentees.forEach((absentee) => {
      dixt.events.emit("report", {
        message: `${absentee} is absent for more than ${
          controller.options.reports?.maximumDaysAbsent || 2
        } days.`,
      });
    });
  });
};

export default worktimeAbsenteesTask;
