CREATE TABLE "blogs" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"images" text
);
