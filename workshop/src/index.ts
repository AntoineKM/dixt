import dixt from "dixt";
import dixtPluginLogs from "dixt-plugin-logs";

const instance = new dixt({
  plugins: [dixtPluginLogs],
});

instance.start();
