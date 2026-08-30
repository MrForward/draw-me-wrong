CREATE TABLE `short_challenges` (
	`code` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`day` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `short_challenges_expires_at_idx` ON `short_challenges` (`expires_at`);