# `@apibara/plugin-health`

This package provides a plugin to monitor the health of an indexer.

## Installation

```bash
npm add @apibara/plugin-health
```

## Usage

Import the plugin and then register it with the indexer.

```ts
import { health } from "@apibara/plugin-health";

export default defineIndexer(StarknetStream)({
  plugins: [health()],
})
```

By default, the plugin listens on port 9090.

Configure your health-monitoring tool to check `http://localhost:9090/health`.
The plugin returns a 200 status code if the indexer is healthy.
