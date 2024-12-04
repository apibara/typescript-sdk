CREATE TABLE IF NOT EXISTS "checkpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"order_key" integer NOT NULL,
	"unique_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ethereum_usdc_transfers" (
	"number" bigint,
	"hash" text,
	"_cursor" "int8range" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "filters" (
	"id" text NOT NULL,
	"filter" text NOT NULL,
	"from_block" integer NOT NULL,
	"to_block" integer,
	CONSTRAINT "filters_id_from_block_pk" PRIMARY KEY("id","from_block")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "starknet_usdc_transfers" (
	"number" bigint,
	"hash" text,
	"_cursor" "int8range" NOT NULL
);
