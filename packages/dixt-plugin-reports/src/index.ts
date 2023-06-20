import dixt, { DixtPlugin, Log, merge } from "dixt";
import dotenv from "dotenv-flow";

import ReportController from "./controllers/report";
import { name } from "../package.json";

dotenv.config({
  silent: true,
});

export type DixtPluginReportsOptions = {
  title?: string;
  channel?: string;
};

export const optionsDefaults = {
  title: process.env.DIXT_PLUGIN_REPORTS_TITLE || "Report",
  channel: process.env.DIXT_PLUGIN_REPORTS_CHANNEL_ID || "",
};

const DixtPluginReports: DixtPlugin<DixtPluginReportsOptions> = (
  instance,
  optionsValue
) => {
  const options = merge({}, optionsDefaults, optionsValue);
  const controller = new ReportController(instance, options);
  if (!options.channel) {
    Log.error(`${name} - channel is required`);
    throw new Error(`${name} - channel is required`);
  }

  dixt.events.on("report", async (report) => {
    try {
      await controller.send(report.message);
    } catch (error) {
      console.error(error);
    }
  });

  return {
    name,
  };
};

export default DixtPluginReports;
