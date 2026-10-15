CREATE TABLE `workshop_customers` (
	`id` varchar(64) NOT NULL,
	`owner_id` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(200) NOT NULL,
	`notes` text NOT NULL,
	CONSTRAINT `workshop_customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_orders` (
	`id` varchar(64) NOT NULL,
	`owner_id` int NOT NULL,
	`customer_id` varchar(64) NOT NULL,
	`vehicle_id` varchar(64) NOT NULL,
	`number` varchar(40) NOT NULL,
	`title` varchar(160) NOT NULL,
	`received_date` varchar(10) NOT NULL,
	`deadline` varchar(10) NOT NULL,
	`completed_date` varchar(10) NOT NULL,
	`status` enum('new','working','done') NOT NULL,
	`damages` text NOT NULL,
	`services` text NOT NULL,
	`measurements` json NOT NULL,
	`cost_cents` int NOT NULL,
	`price_cents` int NOT NULL,
	CONSTRAINT `workshop_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workshop_vehicles` (
	`id` varchar(64) NOT NULL,
	`owner_id` int NOT NULL,
	`customer_id` varchar(64) NOT NULL,
	`plate` varchar(24) NOT NULL,
	`make` varchar(80) NOT NULL,
	`model` varchar(120) NOT NULL,
	`year` varchar(4) NOT NULL,
	`vin` varchar(40) NOT NULL,
	`mileage` int NOT NULL,
	`fuel` varchar(40) NOT NULL,
	CONSTRAINT `workshop_vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `workshop_customers` ADD CONSTRAINT `workshop_customers_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshop_orders` ADD CONSTRAINT `workshop_orders_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshop_orders` ADD CONSTRAINT `workshop_orders_customer_id_workshop_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `workshop_customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshop_orders` ADD CONSTRAINT `workshop_orders_vehicle_id_workshop_vehicles_id_fk` FOREIGN KEY (`vehicle_id`) REFERENCES `workshop_vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshop_vehicles` ADD CONSTRAINT `workshop_vehicles_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workshop_vehicles` ADD CONSTRAINT `workshop_vehicles_customer_id_workshop_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `workshop_customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `customer_owner_idx` ON `workshop_customers` (`owner_id`);--> statement-breakpoint
CREATE INDEX `order_owner_idx` ON `workshop_orders` (`owner_id`);--> statement-breakpoint
CREATE INDEX `order_vehicle_idx` ON `workshop_orders` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `vehicle_owner_idx` ON `workshop_vehicles` (`owner_id`);--> statement-breakpoint
CREATE INDEX `vehicle_customer_idx` ON `workshop_vehicles` (`customer_id`);