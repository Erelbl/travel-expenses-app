# TravelExpense - Travel Expense Tracking App

A modern, clean travel expense tracking web application built with Next.js 15. Track expenses across multiple trips with multi-currency support and beautiful visualizations.

## Features

- ✈️ **Multi-Trip Management**: Create and manage multiple trips
- 💰 **Multi-Currency Support**: Track expenses in different currencies with automatic conversion
- 🌍 **Country Tracking**: Associate expenses with countries using flag emojis
- 📊 **Analytics Dashboard**: View spending by category, country, and currency
- 💾 **Local Storage**: All data persists in browser localStorage (MVP - no backend required)
- 🎨 **Modern UI**: Clean blue/white/green design with shadcn/ui components
- 🚀 **Fast Add Expense Flow**: Optimized UX for quickly adding expenses on the go

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Validation**: Zod
- **Icons**: Lucide React
- **Data Persistence**: localStorage (MVP only)

## Project Structure

```
travel-expenses-app/
├── app/                              # Next.js App Router pages
│   ├── layout.tsx                    # Root layout with navigation
│   ├── page.tsx                      # Home page (redirects to /trips)
│   ├── trips/
│   │   ├── page.tsx                  # Trips list
│   │   ├── new/page.tsx              # Create new trip
│   │   └── [tripId]/
│   │       ├── page.tsx              # Trip dashboard with analytics
│   │       └── add-expense/page.tsx  # Add expense form
├── components/                        # Reusable React components
│   ├── ui/                           # Base UI components (button, card, input, etc.)
│   ├── top-nav.tsx                   # Main navigation bar
│   ├── page-header.tsx               # Page header component
│   ├── stat-card.tsx                 # Statistics card
│   ├── expense-row.tsx               # Expense list item
│   └── trip-card.tsx                 # Trip card for list view
├── lib/                              # Core business logic
│   ├── schemas/                      # Zod schemas & TypeScript types
│   │   ├── trip.schema.ts
│   │   ├── expense.schema.ts
│   │   └── exchange-rate.schema.ts
│   ├── data/                         # Data layer abstraction
│   │   ├── repositories.ts           # Repository interfaces
│   │   ├── local/                    # localStorage implementations
│   │   │   ├── trips-local.repository.ts
│   │   │   ├── expenses-local.repository.ts
│   │   │   └── rates-local.repository.ts
│   │   └── index.ts                  # Export configured repositories
│   ├── utils/                        # Utility functions
│   │   ├── currency.ts               # Currency formatting & conversion
│   │   ├── countries.ts              # Country data with flags
│   │   ├── date.ts                   # Date formatting utilities
│   │   └── utils.ts                  # General utilities (cn helper)
│   └── ...
└── ...
```

## Data Models

### Trip
- `id`: Unique identifier
- `name`: Trip name
- `startDate` / `endDate`: Date range
- `baseCurrency`: Base currency for calculations (USD, EUR, ILS, etc.)
- `countries`: Array of visited countries (ISO codes)
- `members`: Trip members with roles (owner/editor/viewer)

### Expense
- `id`: Unique identifier
- `tripId`: Associated trip
- `amount`: Original amount
- `currency`: Original currency
- `amountInBase`: Converted to trip's base currency
- `category`: Food, Transport, Flights, Lodging, Activities, Shopping, Health, Other
- `country`: Country where expense occurred
- `merchant`: Optional merchant/place name
- `note`: Optional note
- `date`: Date of expense

### Exchange Rates
- Simple local rate table for MVP
- Supports USD, EUR, GBP, ILS, JPY, AUD, CAD, CHF
- Rates stored per base currency

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd travel-expenses-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Migrations

This project uses Prisma Migrate for database schema management.

**Local Development:**
- When you change the Prisma schema, run:
  ```bash
  npm run migrate:dev
  ```
  This creates a new migration and applies it to your local database.

**Production (Vercel):**
- Vercel runs `npm run build` automatically, which generates Prisma Client
- To apply migrations to production database, run:
  ```bash
  npm run migrate:deploy
  ```
  ⚠️ **Important:** Run this after deploying schema changes to apply migrations safely

**Important Notes:**
- Do NOT use `prisma db push` except for disposable dev databases
- Always commit migration files in `prisma/migrations/` to Git
- Production migrations should be reviewed before deployment

### Prisma Studio

To view and edit database records in Prisma Studio:
```bash
npm run studio
```
Then open [http://localhost:5556](http://localhost:5556) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage Guide

1. **Create a Trip**: Click "New Trip" and fill in trip details (name, dates, currency)
2. **Add Expenses**: Navigate to your trip and click "Add Expense"
3. **Fast Entry**: Large amount input, quick category chips, and country selector
4. **View Analytics**: Trip dashboard shows total spent, average per day, and breakdowns by category/country
5. **Multi-Currency**: Expenses automatically convert to your trip's base currency

## Architecture Highlights

### Clean Data Layer Abstraction

The app uses a repository pattern with interfaces, making it easy to swap localStorage for a real database later:

```typescript
// Current: localStorage
export const tripsRepository = new LocalTripsRepository()

// Future: API/Database
export const tripsRepository = new ApiTripsRepository()
```

UI code never directly touches localStorage - it only uses repository interfaces.

### Type Safety with Zod

All data is validated with Zod schemas that also generate TypeScript types:

```typescript
export const TripSchema = z.object({ ... })
export type Trip = z.infer<typeof TripSchema>
```

### Component Composition

UI is built with small, reusable components following single responsibility principle:
- Base UI components (`button`, `card`, `input`)
- Domain components (`trip-card`, `expense-row`)
- Layout components (`top-nav`, `page-header`)

## Future Enhancements (Not in MVP)

- 🔐 Authentication (NextAuth, Clerk, etc.)
- 🗄️ Database persistence (PostgreSQL, MongoDB)
- 👥 Real multi-user collaboration
- 📱 Mobile app (React Native / PWA)
- 📸 Receipt photo uploads
- 📧 Email reports
- 📈 Advanced analytics & charts
- 🔄 Real-time currency exchange rates API
- 💳 Split expenses between members
- 🌙 Dark mode

## Design System

### Colors
- **Primary**: Blue (#4A9FF5) - Main actions, branding
- **Secondary**: Green (#16A34A) - Success states
- **Background**: White with subtle gray tints
- **Accents**: Muted blues and greens

### Icons
- Globe, flags, and currency symbols for travel theme
- Lucide React for consistent icon style

## License

MIT

## Commands Reference

```bash
npm run dev             # Start development server
npm run build           # Build for production (includes prisma generate)
npm start               # Run production build
npm run lint            # Run ESLint
npm run migrate:dev     # Create and apply new migration (local dev)
npm run migrate:deploy  # Apply pending migrations (production)
npm run studio          # Open Prisma Studio (manual browser open)
npm run studio:auto     # Open Prisma Studio (auto-opens browser)
```

---

Built with ❤️ using Next.js 15 and TypeScript
