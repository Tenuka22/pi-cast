CREATE TABLE `follow` (
	`follower_id` text NOT NULL,
	`following_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`follower_id`, `following_id`),
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `follow_follower_idx` ON `follow` (`follower_id`);--> statement-breakpoint
CREATE INDEX `follow_following_idx` ON `follow` (`following_id`);--> statement-breakpoint
CREATE TABLE `lesson` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`thumbnail_url` text,
	`creator_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`level` text,
	`duration` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_creator_idx` ON `lesson` (`creator_id`);--> statement-breakpoint
CREATE INDEX `lesson_status_idx` ON `lesson` (`status`);--> statement-breakpoint
CREATE INDEX `lesson_creator_status_idx` ON `lesson` (`creator_id`,`status`);--> statement-breakpoint
CREATE TABLE `lesson_bookmark` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`user_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`label` text,
	`is_public` integer DEFAULT false,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_bookmark_lesson_idx` ON `lesson_bookmark` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `lesson_bookmark_user_idx` ON `lesson_bookmark` (`user_id`);--> statement-breakpoint
CREATE INDEX `lesson_bookmark_creator_idx` ON `lesson_bookmark` (`user_id`);--> statement-breakpoint
CREATE TABLE `lesson_like` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_like_lesson_idx` ON `lesson_like` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `lesson_like_user_idx` ON `lesson_like` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_like_unique` ON `lesson_like` (`lesson_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`username` text,
	`bio` text,
	`location` text,
	`website` text,
	`followers_count` integer DEFAULT 0 NOT NULL,
	`following_count` integer DEFAULT 0 NOT NULL,
	`lessons_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profile_username_unique` ON `user_profile` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_profile_username_idx` ON `user_profile` (`username`);