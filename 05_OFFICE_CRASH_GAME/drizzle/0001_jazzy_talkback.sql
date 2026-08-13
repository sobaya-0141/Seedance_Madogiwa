ALTER TABLE `runs` ADD `overtime_rank` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `runs` ADD `build_name` text DEFAULT '単品ジョッキ' NOT NULL;