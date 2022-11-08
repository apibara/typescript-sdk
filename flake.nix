{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem(system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
        {
          devShells.default = pkgs.mkShell {
            nativeBuildInputs = with pkgs; [
              protobuf
              prisma-engines
              nodejs-16_x
              nodePackages.prisma
              nodePackages.pnpm
              nodePackages.typescript
              nodePackages.typescript-language-server
            ];
            shellHook = with pkgs; ''
              export PRISMA_MIGRATION_ENGINE_BINARY="${prisma-engines}/bin/migration-engine"
              export PRISMA_QUERY_ENGINE_BINARY="${prisma-engines}/bin/query-engine"
              export PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines}/lib/libquery_engine.node"
              export PRISMA_INTROSPECTION_ENGINE_BINARY="${prisma-engines}/bin/introspection-engine"
              export PRISMA_FMT_BINARY="${prisma-engines}/bin/prisma-fmt"
            '';
          };
        }
    );
}