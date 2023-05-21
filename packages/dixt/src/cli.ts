#!/usr/bin/env node
import path from "path";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

// Specify the available commands
const commands = {
  dev: {
    description: "Start the development server",
    handler: async () => {
      // Your development server logic goes here
      const appPath = path.resolve("./src/app.js");
      console.log(`Starting development server at ${appPath}`);
      // Execute your development server code using appPath
    },
  },
};

const cli = yargs(hideBin(process.argv))
  .command("dev", commands.dev.description)
  // Add more commands as needed
  .demandCommand(1, "Please specify a command")
  .strict()
  .help()
  .alias("h", "help")
  .alias("v", "version");

cli.parse(process.argv);

export default cli;
