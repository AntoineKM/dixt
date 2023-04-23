import { DixtPluginAffixOptions } from "dixt-plugin-affix";
import { ROLES } from "../constants";

const dixtPluginAffixOptions: DixtPluginAffixOptions = {
  prefix: {
    [ROLES.CONTRIBUTOR]: "C",
  },
};

export default dixtPluginAffixOptions;
