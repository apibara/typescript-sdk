import {
  type ArgsDef,
  type CommandDef,
  type ParsedArgs,
  renderUsage,
} from "citty";
import consola from "consola";

export const commonArgs = <ArgsDef>{
  dir: {
    type: "string",
    description: "project root directory",
  },
};

export const checkForUnknownArgs = async <T extends ArgsDef = ArgsDef>(
  args: ParsedArgs<T>,
  cmd: CommandDef<T>,
) => {
  const definedArgs = Object.keys(cmd.args ?? {});
  const providedArgs = Object.keys(args).filter((arg) => arg !== "_");
  const wrongArgs = providedArgs.filter((arg) => !definedArgs.includes(arg));

  if (wrongArgs.length > 0) {
    consola.error(`Unknown arguments: ${wrongArgs.join(", ")}`);
    consola.info(await renderUsage(cmd));
    process.exit(1);
  }
};
