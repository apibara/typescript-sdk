import type { Cursor } from "@apibara/protocol";

export type VcrConfig = {
  cassetteDir: string;
};

export type CassetteOptions = {
  name: string;
  startingCursor: Cursor;
  endingCursor: Cursor;
};
