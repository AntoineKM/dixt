import dotenv from "dotenv-flow";
import { Client } from "discord.js";
import DiscordApplication from "./services/discord";

const main = async () => {
  dotenv.config({
    default_node_env: "development",
    silent: true,
  });

  const client = new Client({
    intents: [],
  });

  try {
    client.login(DiscordApplication.bot.token);
  } catch (error) {
    console.error(error);
  }
};

main();
