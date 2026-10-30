CREATE TABLE `arcade_runs` (
	`run_id` text PRIMARY KEY NOT NULL,
	`seed` integer NOT NULL,
	`version` text NOT NULL,
	`client_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `arcade_runs_client_created` ON `arcade_runs` (`client_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `arcade_runs_created` ON `arcade_runs` (`created_at`);--> statement-breakpoint
CREATE TABLE `arcade_scores` (
	`run_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`score` integer NOT NULL,
	`level` integer NOT NULL,
	`deliveries` integer NOT NULL,
	`total_collected` integer NOT NULL,
	`ticks` integer NOT NULL,
	`replay_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `arcade_scores_ranking` ON `arcade_scores` (`score`,`created_at`);--> statement-breakpoint
CREATE INDEX `arcade_scores_created` ON `arcade_scores` (`created_at`);--> statement-breakpoint
CREATE INDEX `arcade_scores_name` ON `arcade_scores` (`name_key`);