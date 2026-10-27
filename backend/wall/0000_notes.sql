CREATE TABLE `wall_notes` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`color` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wall_notes_id_unique` ON `wall_notes` (`id`);