ALTER TABLE `workshop_orders` ADD `parts` json;--> statement-breakpoint
ALTER TABLE `workshop_orders` ADD `other_cost_cents` int;--> statement-breakpoint
ALTER TABLE `workshop_orders` ADD `service_price_cents` int;