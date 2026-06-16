import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const blogs = pgTable("blogs", {
  id: serial().primaryKey(),
  title: text().notNull(),
  author: text().notNull(),
  category: text().notNull(),
  content: text().notNull(),
  images: text(),
});
