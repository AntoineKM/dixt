/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import dixt from "..";

export type LogType = keyof typeof Log;

export const prefixes: {
  [K in LogType]: string;
} = {
  wait: chalk.yellow("wait") + "  -",
  error: chalk.red("error") + " -",
  warn: chalk.yellow("warn") + "  -",
  ready: chalk.green("ready") + " -",
  info: chalk.cyan("info") + "  -",
  event: chalk.magenta("event") + " -",
};

const logger = (type: LogType, ...message: any[]) => {
  console.log(`${prefixes[type]} ${message.join(" ")}`);
  dixt.events.emit("log", { type, message });
};

const Log = {
  info: (...message: any[]) => logger("info", ...message),
  warn: (...message: any[]) => logger("warn", ...message),
  error: (...message: any[]) => logger("error", ...message),
  ready: (...message: any[]) => logger("ready", ...message),
  wait: (...message: any[]) => logger("wait", ...message),
  event: (...message: any[]) => logger("event", ...message),
};

export default Log;
