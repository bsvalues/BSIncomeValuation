import { Income, Valuation } from './schema';

// Extended Income interface for testing - adds propertyId for backward compatibility
export interface TestIncome extends Income {
  propertyId?: number; // Optional property for tests
}

// Extended Valuation interface for testing - adds propertyType and propertyId for backward compatibility
export interface TestValuation extends Valuation {
  propertyType?: string; // Optional property for tests
  propertyId?: number; // Optional property for tests
}