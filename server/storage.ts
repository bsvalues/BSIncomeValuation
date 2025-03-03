import { 
  users, 
  incomes, 
  valuations, 
  type User, 
  type InsertUser, 
  type Income, 
  type InsertIncome, 
  type Valuation, 
  type InsertValuation 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Income operations
  getIncomesByUserId(userId: number): Promise<Income[]>;
  createIncome(income: InsertIncome): Promise<Income>;
  updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income | undefined>;
  deleteIncome(id: number): Promise<boolean>;
  
  // Valuation operations
  getValuationsByUserId(userId: number): Promise<Valuation[]>;
  getValuationById(id: number): Promise<Valuation | undefined>;
  createValuation(valuation: InsertValuation): Promise<Valuation>;
  updateValuation(id: number, valuation: Partial<InsertValuation>): Promise<Valuation | undefined>;
  deleteValuation(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Income operations
  async getIncomesByUserId(userId: number): Promise<Income[]> {
    return db
      .select()
      .from(incomes)
      .where(eq(incomes.userId, userId))
      .orderBy(desc(incomes.createdAt));
  }

  async createIncome(income: InsertIncome): Promise<Income> {
    const [newIncome] = await db
      .insert(incomes)
      .values(income)
      .returning();
    return newIncome;
  }

  async updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income | undefined> {
    const [updatedIncome] = await db
      .update(incomes)
      .set(income)
      .where(eq(incomes.id, id))
      .returning();
    return updatedIncome;
  }

  async deleteIncome(id: number): Promise<boolean> {
    const result = await db
      .delete(incomes)
      .where(eq(incomes.id, id))
      .returning({ id: incomes.id });
    return result.length > 0;
  }

  // Valuation operations
  async getValuationsByUserId(userId: number): Promise<Valuation[]> {
    return db
      .select()
      .from(valuations)
      .where(eq(valuations.userId, userId))
      .orderBy(desc(valuations.createdAt));
  }

  async getValuationById(id: number): Promise<Valuation | undefined> {
    const [valuation] = await db
      .select()
      .from(valuations)
      .where(eq(valuations.id, id));
    return valuation;
  }

  async createValuation(valuation: InsertValuation): Promise<Valuation> {
    const [newValuation] = await db
      .insert(valuations)
      .values(valuation)
      .returning();
    return newValuation;
  }

  async updateValuation(id: number, valuation: Partial<InsertValuation>): Promise<Valuation | undefined> {
    const [updatedValuation] = await db
      .update(valuations)
      .set(valuation)
      .where(eq(valuations.id, id))
      .returning();
    return updatedValuation;
  }

  async deleteValuation(id: number): Promise<boolean> {
    const result = await db
      .delete(valuations)
      .where(eq(valuations.id, id))
      .returning({ id: valuations.id });
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
