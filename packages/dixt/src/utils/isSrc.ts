import fs from "fs";

const isSrc = () => {
  try {
    const srcStats = fs.statSync("src");
    return srcStats.isDirectory();
  } catch (_error) {
    return false;
  }
};

export default isSrc;
