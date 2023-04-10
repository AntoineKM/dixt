import { DixtPluginReactOptions } from "dixt-plugin-react";
import { CHANNELS } from "../constants";

const dixtPluginReactOptions: DixtPluginReactOptions = {
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
};

export default dixtPluginReactOptions;
