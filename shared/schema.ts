import { pgTable, text, serial, integer, numeric, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Income sources enum
export const incomeSourceEnum = pgEnum("income_source", [
  "salary",
  "business",
  "freelance",
  "investment",
  "rental",
  "other"
]);

// Income model
export const incomes = pgTable("incomes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  source: incomeSourceEnum("source").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(), // monthly, yearly, etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Valuation model
export const valuations = pgTable("valuations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalAnnualIncome: numeric("total_annual_income", { precision: 12, scale: 2 }).notNull(),
  multiplier: numeric("multiplier", { precision: 5, scale: 2 }).notNull(),
  valuationAmount: numeric("valuation_amount", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  incomes: many(incomes),
  valuations: many(valuations),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
  user: one(users, {
    fields: [incomes.userId],
    references: [users.id],
  }),
}));

export const valuationsRelations = relations(valuations, ({ one }) => ({
  user: one(users, {
    fields: [valuations.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export const insertIncomeSchema = createInsertSchema(incomes).pick({
  userId: true,
  source: true,
  amount: true,
  frequency: true,
  description: true,
});

export const insertValuationSchema = createInsertSchema(valuations).pick({
  userId: true,
  totalAnnualIncome: true,
  multiplier: true,
  valuationAmount: true,
  notes: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Income = typeof incomes.$inferSelect;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;

export type Valuation = typeof valuations.$inferSelect;
export type InsertValuation = z.infer<typeof insertValuationSchema>;
