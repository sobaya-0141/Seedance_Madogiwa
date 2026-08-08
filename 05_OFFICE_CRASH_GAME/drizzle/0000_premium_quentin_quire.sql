CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`caps` integer DEFAULT 0 NOT NULL,
	`best_floor` integer DEFAULT 0 NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`total_runs` integer DEFAULT 0 NOT NULL,
	`total_destroyed` integer DEFAULT 0 NOT NULL,
	`clears` integer DEFAULT 0 NOT NULL,
	`forge` integer DEFAULT 0 NOT NULL,
	`vitality` integer DEFAULT 0 NOT NULL,
	`hustle` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`victory` integer DEFAULT false NOT NULL,
	`floor_reached` integer NOT NULL,
	`score` integer NOT NULL,
	`destroyed` integer NOT NULL,
	`max_combo` integer NOT NULL,
	`caps_earned` integer NOT NULL,
	`build_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `runs_player_created_idx` ON `runs` (`player_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `runs_score_idx` ON `runs` (`score`);