import { pgTable, text, serial, integer, numeric, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Income multipliers configuration
export const incomeMultipliers = pgTable("income_multipliers", {
  id: serial("id").primaryKey(),
  source: text("source").notNull().unique(),
  multiplier: numeric("multiplier", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  role: text("role").default("user").notNull(),
});

// Auth tokens table for JWT refresh tokens
export const authTokens = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revoked: boolean("revoked").default(false).notNull(),
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
  name: text("name").notNull(),
  totalAnnualIncome: numeric("total_annual_income", { precision: 12, scale: 2 }).notNull(),
  multiplier: numeric("multiplier", { precision: 5, scale: 2 }).notNull(),
  valuationAmount: numeric("valuation_amount", { precision: 15, scale: 2 }).notNull(),
  incomeBreakdown: text("income_breakdown"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().optional(),
});

export const insertIncomeSchema = createInsertSchema(incomes)
  .pick({
    userId: true,
    source: true,
    amount: true,
    frequency: true,
    description: true,
  })
  .extend({
    amount: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? val : val.toString()
    ),
  });

export const insertValuationSchema = createInsertSchema(valuations)
  .pick({
    userId: true,
    name: true,
    totalAnnualIncome: true,
    multiplier: true,
    valuationAmount: true,
    incomeBreakdown: true,
    notes: true,
  })
  .extend({
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    totalAnnualIncome: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? val : val.toString()
    ),
    multiplier: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? val : val.toString()
    ),
    valuationAmount: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? val : val.toString()
    ),
  });

export const insertIncomeMultiplierSchema = createInsertSchema(incomeMultipliers)
  .pick({
    source: true,
    multiplier: true,
    description: true,
    isActive: true,
  })
  .extend({
    multiplier: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? val : val.toString()
    ),
  });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Income = typeof incomes.$inferSelect;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;

export type Valuation = typeof valuations.$inferSelect;
export type InsertValuation = z.infer<typeof insertValuationSchema>;

export type IncomeMultiplier = typeof incomeMultipliers.$inferSelect;
export type InsertIncomeMultiplier = z.infer<typeof insertIncomeMultiplierSchema>;
