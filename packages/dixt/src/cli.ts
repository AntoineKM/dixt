import { execSync } from "child_process";
import nodemon from "nodemon";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

import isSrc from "./utils/isSrc";
import isTypeScript from "./utils/isTypeScript";
import Log from "./utils/log";
import packageJson from "../package.json";

const commands = {
  dev: {
    name: "dev",
    description: "Start dixt in development mode.",
    handler: () => {
      const monitor = nodemon({
        exec: isTypeScript()
          ? `ts-node ${isSrc() ? "src/" : ""}index`
          : `node ${isSrc() ? "src/" : ""}index`,
      });

      monitor.on("restart", (files) => {
        Log.info(
          files ? `restarting due to changes on: ${files}` : "restarting..."
        );
      });
    },
  },
  build: {
    name: "build",
    description: "Build dixt for production.",
    handler: () => {
      Log.info("building dixt...");
      if (isTypeScript()) {
        try {
          execSync("tsc");
          Log.ready("typescript compilation successful.");
        } catch (error) {
          Log.error("typescript compilation failed.", error);
        }
      } else {
        Log.warn("no typescript config found. skipping build step.");
      }
    },
  },
  start: {
    name: "start",
    description: "Start dixt in production mode.",
    handler: () => {
      if (isTypeScript()) {
        try {
          execSync("node dist/index.js");
        } catch (error) {
          Log.info("failed to start dixt.", error);
        }
      } else {
        execSync(`node ${isSrc() ? "src/" : ""}index.js`);
      }
    },
  },
};

const cli = yargs(hideBin(process.argv))
  .scriptName(packageJson.name)
  .command(commands.dev.name, commands.dev.description, commands.dev.handler)
  .command(
    commands.build.name,
    commands.build.description,
    commands.build.handler
  )
  .command(
    commands.start.name,
    commands.start.description,
    commands.start.handler
  )
  .default("dev", commands.dev.handler, commands.dev.description)
  .help()
  .alias("h", "help")
  .alias("v", "version").argv;

export default cli;
