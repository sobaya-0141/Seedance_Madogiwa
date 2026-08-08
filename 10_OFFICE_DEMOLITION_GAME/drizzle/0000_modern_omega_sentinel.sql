CREATE TABLE `demolition_players` (
	`id` text PRIMARY KEY NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`clears` integer DEFAULT 0 NOT NULL,
	`total_destroyed` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `demolition_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`score` integer NOT NULL,
	`destroyed` integer NOT NULL,
	`max_combo` integer NOT NULL,
	`play_seconds` real NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `demolition_players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `demolition_runs_player_created_idx` ON `demolition_runs` (`player_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `demolition_runs_score_idx` ON `demolition_runs` (`score`);--> statement-breakpoint
CREATE TABLE `demolition_saves` (
	`player_id` text PRIMARY KEY NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`destroyed` integer DEFAULT 0 NOT NULL,
	`max_combo` integer DEFAULT 0 NOT NULL,
	`play_seconds` real DEFAULT 0 NOT NULL,
	`cleared` integer DEFAULT false NOT NULL,
	`destroyed_json` text DEFAULT '[]' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `demolition_players`(`id`) ON UPDATE no action ON DELETE no action
);
