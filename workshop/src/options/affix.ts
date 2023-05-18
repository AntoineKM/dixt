import { DixtPluginAffixOptions } from "dixt-plugin-affix";

import { ROLES } from "../constants";

const dixtPluginAffixOptions: DixtPluginAffixOptions = {
  prefix: {
    [ROLES.MAINTAINER]: "M",
    [ROLES.CONTRIBUTOR]: "C",
    [ROLES.TESTER]: "T",
  },
};

export default dixtPluginAffixOptions;
