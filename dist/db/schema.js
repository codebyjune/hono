import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    password: text("password").notNull(),
    createdAt: integer("created_at", {
        mode: "timestamp",
    })
        .default(sql `(unixepoch())`)
        .notNull(),
});
