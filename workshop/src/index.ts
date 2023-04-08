import dixt from "dixt";
import dixtPluginLogs from "dixt-plugin-logs";
import dixtPluginJoin from "dixt-plugin-join";
import dixtPluginReact from "dixt-plugin-react";
import { CHANNELS } from "../constants";

const main = async () => {
  const instance = new dixt({
    plugins: [
      dixtPluginLogs,
      [
        dixtPluginJoin,
        {
          channelId: CHANNELS.DIXT_PLUGIN_JOIN.NEWCOMERS,
        },
      ],
      [
        dixtPluginReact,
        {
          channels: [
            {
              id: CHANNELS.DIXT_PLUGIN_REACT.REACT,
              emoji: "👍",
            },
            {
              id: CHANNELS.DIXT_PLUGIN_REACT.REACT,
              emoji: "👋",
              matchs: [
                "hello",
                "hi",
                "hey",
                "yo",
                "salut",
                "bonjour",
                "coucou",
                "cc",
                "hola",
                "bonsoir",
                "bonne nuit",
                "good night",
                "good morning",
                "good evening",
              ],
            },
          ],
        },
      ],
    ],
  });

  await instance.start();
};

main();
