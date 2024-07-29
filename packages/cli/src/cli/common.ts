import type { ArgsDef } from "citty";

export const commonArgs = <ArgsDef>{
  dir: {
    type: "string",
    description: "project root directory",
  },
};
