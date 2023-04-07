import dixt from "dixt";
import dixtPluginLogs from "dixt-plugin-logs";

const client = new dixt({
  plugins: [[dixtPluginLogs, {}]],
});

client.start();
