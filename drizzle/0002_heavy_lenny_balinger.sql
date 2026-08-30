CREATE TABLE `live_guesses` (
	`room_code` text NOT NULL,
	`round_number` integer NOT NULL,
	`player_id` text NOT NULL,
	`option_index` integer NOT NULL,
	`is_correct` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`room_code`, `round_number`, `player_id`)
);
--> statement-breakpoint
CREATE TABLE `live_players` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`token_hash` text NOT NULL,
	`nickname` text NOT NULL,
	`language_id` integer DEFAULT 0 NOT NULL,
	`seat_order` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`joined_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`left_at` integer
);
--> statement-breakpoint
CREATE INDEX `live_players_room_idx` ON `live_players` (`room_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `live_players_room_seat_idx` ON `live_players` (`room_code`,`seat_order`);--> statement-breakpoint
CREATE TABLE `live_reports` (
	`room_code` text NOT NULL,
	`round_number` integer NOT NULL,
	`reporter_player_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`room_code`, `round_number`, `reporter_player_id`)
);
--> statement-breakpoint
CREATE TABLE `live_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`host_player_id` text NOT NULL,
	`language_id` integer NOT NULL,
	`queue_slot` integer,
	`player_count` integer DEFAULT 1 NOT NULL,
	`round_number` integer DEFAULT 0 NOT NULL,
	`max_rounds` integer DEFAULT 0 NOT NULL,
	`drawer_player_id` text,
	`prompt_id` integer,
	`drawing_payload` text,
	`phase_ends_at` integer,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `live_rooms_match_idx` ON `live_rooms` (`kind`,`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `live_rooms_expires_at_idx` ON `live_rooms` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `live_rooms_queue_slot_idx` ON `live_rooms` (`queue_slot`);