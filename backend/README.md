# PriceLess Backend API

A Node.js + Express backend API for the PriceLess application with PostgreSQL database and Prisma ORM.

## Features

- RESTful API with Express.js
- PostgreSQL database with Prisma ORM
- Type-safe request/response handling with Zod validation
- Comprehensive error handling
- CORS support
- Request logging middleware
- Pagination support for all list endpoints

## Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── config/                  # Configuration files
│   ├── middleware/
│   │   ├── errorHandler.ts      # Global error handling
│   │   └── requestLogger.ts     # Request logging
│   ├── routes/                  # API route handlers
│   │   ├── users.ts
│   │   ├── buyOffers.ts
│   │   ├── sellOffers.ts
│   │   ├── manualBuys.ts
│   │   └── shopPurchases.ts
│   ├── services/                # Business logic
│   │   ├── userService.ts
│   │   ├── buyOfferService.ts
│   │   ├── sellOfferService.ts
│   │   ├── manualBuyService.ts
│   │   └── shopPurchaseService.ts
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   │   ├── validation.ts        # Zod schemas and validation
│   │   └── pagination.ts        # Pagination helpers
│   └── errors/                  # Custom error classes
├── prisma/
│   └── schema.prisma            # Prisma schema definition
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your database connection string:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/priceless"
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

### 3. Set Up Database

```bash
# Run migrations to create tables
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# (Optional) Open Prisma Studio to view/manage data
npm run prisma:studio
```

### 4. Start the Server

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

The server will be available at `http://localhost:3000`

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/address/:userOwnerAddress` - Get user by wallet address
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Buy Offers
- `POST /api/buy-offers` - Create a new buy offer
- `GET /api/buy-offers` - Get all buy offers (paginated)
- `GET /api/buy-offers/:id` - Get buy offer by ID
- `GET /api/buy-offers/blockchain/:buyOfferId` - Get buy offer by blockchain ID
- `GET /api/buy-offers/owner/:ownerAddress` - Get buy offers by owner
- `GET /api/buy-offers/active/deadline` - Get active buy offers
- `PATCH /api/buy-offers/:id` - Update buy offer
- `DELETE /api/buy-offers/:id` - Delete buy offer

### Sell Offers
- `POST /api/sell-offers` - Create a new sell offer
- `GET /api/sell-offers` - Get all sell offers (paginated)
- `GET /api/sell-offers/:id` - Get sell offer by ID
- `GET /api/sell-offers/blockchain/:sellOfferId` - Get sell offer by blockchain ID
- `GET /api/sell-offers/buy-offer/:buyOfferId` - Get sell offers for a buy offer
- `GET /api/sell-offers/agent/:agentId` - Get sell offers by agent
- `PATCH /api/sell-offers/:id` - Update sell offer
- `DELETE /api/sell-offers/:id` - Delete sell offer

### Manual Buys
- `POST /api/manual-buys` - Create a new manual buy
- `GET /api/manual-buys` - Get all manual buys (paginated)
- `GET /api/manual-buys/:id` - Get manual buy by ID
- `GET /api/manual-buys/buyer/:buyer` - Get manual buys by buyer
- `GET /api/manual-buys/agent/:agentId` - Get manual buys by agent
- `GET /api/manual-buys/buy-offer/:buyOfferId` - Get manual buys for a buy offer
- `DELETE /api/manual-buys/:id` - Delete manual buy

### Shop Purchases
- `POST /api/shop-purchases` - Create a new shop purchase
- `GET /api/shop-purchases` - Get all shop purchases (paginated)
- `GET /api/shop-purchases/:id` - Get shop purchase by ID
- `GET /api/shop-purchases/agent/:agentId` - Get shop purchases by agent
- `GET /api/shop-purchases/sell-offer/:sellOfferId` - Get shop purchases for a sell offer
- `DELETE /api/shop-purchases/:id` - Delete shop purchase

## Scripts

```bash
npm run dev              # Start development server with hot reload
npm run build           # Build TypeScript to JavaScript
npm start              # Start production server
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate # Run database migrations
npm run prisma:deploy  # Deploy migrations to production
npm run prisma:studio  # Open Prisma Studio for data management
npm run lint           # Run ESLint
npm run typecheck      # Type check without emitting files
```

## Technologies

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Dev Tools**: tsx, ESLint

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { /* entity data */ },
  "pagination": { /* pagination meta (for list endpoints) */ },
  "timestamp": "2024-11-15T10:00:00Z"
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

## Error Codes

- `VALIDATION_ERROR` (400) - Request validation failed
- `NOT_FOUND` (404) - Resource not found
- `UNIQUE_CONSTRAINT_VIOLATION` (409) - Duplicate entry
- `CONFLICT` (409) - Conflict with existing data
- `UNAUTHORIZED` (401) - Authentication required
- `INTERNAL_SERVER_ERROR` (500) - Server error

## Development

### Adding New Endpoints

1. Create/update a route file in `src/routes/`
2. Create/update a service file in `src/services/` with business logic
3. Add validation schemas in `src/utils/validation.ts` if needed
4. Import and use in the route handler

### Prisma Migrations

After modifying `prisma/schema.prisma`:

```bash
npm run prisma:migrate -- --name <migration_name>
```

## Next Steps

- Implement authentication/authorization middleware
- Add API documentation (Swagger/OpenAPI)
- Add comprehensive error logging
- Implement caching strategies
- Add rate limiting
