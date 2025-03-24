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
  // Create a list of defined args including both the main arg names and their aliases
  const definedArgs: string[] = [];
  if (cmd.args) {
    for (const [argName, argDef] of Object.entries(cmd.args)) {
      definedArgs.push(argName);
      // Add alias to definedArgs if it exists
      if (argDef.alias) {
        definedArgs.push(argDef.alias);
      }
    }
  }

  const providedArgs = Object.keys(args).filter((arg) => arg !== "_");
  const wrongArgs = providedArgs.filter((arg) => !definedArgs.includes(arg));

  if (wrongArgs.length > 0) {
    consola.error(`Unknown arguments: ${wrongArgs.join(", ")}`);
    consola.info(await renderUsage(cmd));
    process.exit(1);
  }
};
