import { db } from "./db";
import { incomeMultipliers } from "@shared/schema";
import { eq } from "drizzle-orm";

interface SeedMultiplier {
  source: string;
  multiplier: string;
  description: string;
}

const defaultMultipliers: SeedMultiplier[] = [
  {
    source: "salary",
    multiplier: "2.5",
    description: "Regular employment income with benefits and stability"
  },
  {
    source: "business",
    multiplier: "3.5",
    description: "Business ownership with established operations and track record"
  },
  {
    source: "freelance",
    multiplier: "2.0",
    description: "Independent contractor work with variable income"
  },
  {
    source: "investment",
    multiplier: "4.0",
    description: "Return on investments from assets, stocks, bonds, etc."
  },
  {
    source: "rental",
    multiplier: "5.0",
    description: "Passive income from property rentals"
  },
  {
    source: "other",
    multiplier: "1.5",
    description: "Miscellaneous income sources"
  }
];

export async function seedIncomeMultipliers() {
  try {
    console.log("Starting seed process for income multipliers...");
    
    // Check if we already have multipliers
    const existingMultipliers = await db.select().from(incomeMultipliers);
    
    if (existingMultipliers.length > 0) {
      console.log(`Found ${existingMultipliers.length} existing multipliers. Skipping seed.`);
      return;
    }
    
    // Insert default multipliers
    for (const multiplier of defaultMultipliers) {
      await db.insert(incomeMultipliers).values({
        source: multiplier.source,
        multiplier: multiplier.multiplier,
        description: multiplier.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added multiplier for source: ${multiplier.source}`);
    }
    
    console.log("Successfully seeded income multipliers!");
  } catch (error) {
    console.error("Error seeding income multipliers:", error);
  }
}