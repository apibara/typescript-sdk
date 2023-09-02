/** Console sink type. */
export type Console = {
  sinkType: "console";

  /** Accept any options.
   *
   * @remarks We do this so that users can quickly switch to the console sink to debug,
   * without having to remove the options from the config file.
   */
  sinkOptions: object;
};
