import { IStorage } from '../../server/storage';
import { 
  User, 
  InsertUser, 
  Income, 
  InsertIncome, 
  Valuation, 
  InsertValuation 
} from '@shared/schema';

/**
 * Mock implementation of the Storage interface for testing
 */
export class MockStorage implements IStorage {
  private users: User[] = [];
  private incomes: Income[] = [];
  private valuations: Valuation[] = [];
  private userId = 1;
  private incomeId = 1;
  private valuationId = 1;

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.userId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      ...user
    };
    this.users.push(newUser);
    return newUser;
  }

  // Income operations
  async getIncomesByUserId(userId: number): Promise<Income[]> {
    return this.incomes
      .filter(income => income.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getIncomeById(id: number): Promise<Income | undefined> {
    return this.incomes.find(income => income.id === id);
  }

  async createIncome(income: InsertIncome): Promise<Income> {
    const newIncome: Income = {
      id: this.incomeId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...income
    };
    this.incomes.push(newIncome);
    return newIncome;
  }

  async updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income | undefined> {
    const index = this.incomes.findIndex(i => i.id === id);
    if (index === -1) return undefined;

    const updatedIncome = {
      ...this.incomes[index],
      ...income,
      updatedAt: new Date()
    };
    this.incomes[index] = updatedIncome;
    return updatedIncome;
  }

  async deleteIncome(id: number): Promise<boolean> {
    const initialLength = this.incomes.length;
    this.incomes = this.incomes.filter(income => income.id !== id);
    return initialLength > this.incomes.length;
  }

  // Valuation operations
  async getValuationsByUserId(userId: number): Promise<Valuation[]> {
    return this.valuations
      .filter(valuation => valuation.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getValuationById(id: number): Promise<Valuation | undefined> {
    return this.valuations.find(valuation => valuation.id === id);
  }

  async createValuation(valuation: InsertValuation): Promise<Valuation> {
    const newValuation: Valuation = {
      id: this.valuationId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...valuation
    };
    this.valuations.push(newValuation);
    return newValuation;
  }

  async updateValuation(id: number, valuation: Partial<InsertValuation>): Promise<Valuation | undefined> {
    const index = this.valuations.findIndex(v => v.id === id);
    if (index === -1) return undefined;

    const updatedValuation = {
      ...this.valuations[index],
      ...valuation,
      updatedAt: new Date()
    };
    this.valuations[index] = updatedValuation;
    return updatedValuation;
  }

  async deleteValuation(id: number): Promise<boolean> {
    const initialLength = this.valuations.length;
    this.valuations = this.valuations.filter(valuation => valuation.id !== id);
    return initialLength > this.valuations.length;
  }

  // For testing: reset all data
  reset() {
    this.users = [];
    this.incomes = [];
    this.valuations = [];
    this.userId = 1;
    this.incomeId = 1;
    this.valuationId = 1;
  }
}