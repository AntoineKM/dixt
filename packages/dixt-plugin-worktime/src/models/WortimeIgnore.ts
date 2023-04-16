import dixt from "dixt";

const worktimeIgnoreReminderSchema = new dixt.database.Schema({
  userId: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now() },
});

const WorktimeIgnoreReminder = dixt.database.model(
  "WorktimeIgnoreReminder",
  worktimeIgnoreReminderSchema
);

export default WorktimeIgnoreReminder;
