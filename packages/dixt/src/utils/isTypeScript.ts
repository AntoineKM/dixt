import fs from "fs";

const isTypeScript = () => {
  try {
    const tsConfigStats = fs.statSync("tsconfig.json");
    return tsConfigStats.isFile();
  } catch (_error) {
    return false;
  }
};

export default isTypeScript;
