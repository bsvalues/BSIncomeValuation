# Income Valuation SaaS Platform

A comprehensive Income Valuation SaaS platform that provides detailed financial insights and analysis for professionals, enabling users to understand and maximize their income potential.

## Features

- **Advanced Valuation Engine**: Calculate personal valuations based on multiple income sources with type-specific multipliers
- **Interactive Calculator**: Real-time valuation calculation with adjustable income sources
- **Income Management**: Track and manage different income sources with detailed information
- **Historical Tracking**: Store and visualize valuation history over time
- **User Authentication**: Secure JWT-based authentication system
- **Responsive Dashboard**: Modern, responsive interface displaying key financial metrics

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, React Query
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based auth with refresh tokens
- **Data Visualization**: Recharts for interactive charts
- **Styling**: Tailwind CSS with shadcn/ui components
- **Testing**: Jest + Supertest for unit and integration tests

## Core Valuation Logic

The platform uses a sophisticated valuation algorithm based on income type multipliers:

| Income Source | Multiplier | Description                        |
|---------------|------------|-----------------------------------|
| Rental        | 5.0x       | Income from property rentals       |
| Investment    | 4.0x       | Returns from investments           |
| Business      | 3.5x       | Income from business ownership     |
| Salary        | 2.5x       | Regular employment income          |
| Freelance     | 2.0x       | Independent contractor work        |
| Other         | 1.5x       | Miscellaneous income sources       |

The calculation process includes:

1. Converting all income to annual amounts based on frequency
2. Applying the appropriate multiplier based on income source
3. Calculating a weighted multiplier based on income distribution
4. Computing the final valuation as total annual income × weighted multiplier

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables in `.env` file
4. Initialize the database:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - Create a new user account
- `POST /auth/login` - Authenticate a user
- `POST /auth/refresh-token` - Refresh authentication token
- `POST /auth/logout` - Logout user

### Incomes
- `GET /api/users/:userId/incomes` - Get all incomes for a user
- `GET /api/incomes/:id` - Get a specific income
- `POST /api/incomes` - Create a new income
- `PUT /api/incomes/:id` - Update an existing income
- `DELETE /api/incomes/:id` - Delete an income

### Valuations
- `GET /api/users/:userId/valuations` - Get all valuations for a user
- `GET /api/valuations/:id` - Get a specific valuation
- `POST /api/valuations` - Create a new valuation
- `PUT /api/valuations/:id` - Update an existing valuation
- `DELETE /api/valuations/:id` - Delete a valuation

### Dashboard
- `GET /api/dashboard` - Get dashboard data for the authenticated user
- `GET /api/dashboard/detailed` - Get detailed dashboard data

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
./run-all-tests.sh

# Run only unit tests
./run-unit-tests.sh

# Run only integration tests
./run-integration-tests.sh
```

## Project Structure

```
.
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── contexts/      # Context providers 
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Page components
├── server/                # Express backend
│   ├── auth.ts            # Authentication utils
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database access layer
│   └── errorHandler.ts    # Error handling
├── shared/                # Shared code (frontend & backend)
│   └── schema.ts          # Database schema and types
└── __tests__/             # Test files
    ├── integration/       # API integration tests
    ├── unit/              # Unit tests
    └── mocks/             # Test mocks
```

## Error Handling

The application implements a comprehensive error handling system with:

- Custom error classes for different error types
- Standardized error responses for all API endpoints
- Validation errors with detailed field-level feedback
- Client-side error handling with toast notifications

## License

This project is licensed under the MIT License - see the LICENSE file for details.