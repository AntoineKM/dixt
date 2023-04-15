import dixt from "dixt";

const worktimeSchema = new dixt.database.Schema({
  userId: { type: String, required: true },
  startAt: { type: Date, required: true, default: Date.now() },
  endAt: { type: Date, required: false },
});

const Worktime = dixt.database.model("Worktime", worktimeSchema);

export default Worktime;
