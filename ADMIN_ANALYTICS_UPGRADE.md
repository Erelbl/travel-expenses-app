# Admin Dashboard Analytics Upgrade

## Summary

Successfully upgraded the admin dashboard with real product-usage analytics, enhanced KPI cards, improved filters, and new user analytics columns. All changes are admin-only and do not affect core app behavior.

## Files Changed

### 1. Backend / Data Layer

#### `lib/server/adminStats.ts`
- **Added new KPI queries:**
  - `activeUsers7d`: Users who created at least 1 expense in last 7 days
  - `activeUsers30d`: Users who created at least 1 expense in last 30 days
  - `payingUsers`: Users with plan in ['plus', 'pro']
  - New users (7d) already existed

- **Enhanced `AdminUser` interface** with new columns:
  - `tripsCount`: Total trips created by user
  - `expensesCount`: Total expenses created by user
  - `activeDays`: Count of distinct days user created expenses
  - `lastActivity`: Max expense.createdAt (fallback to user.createdAt)
  - `totalSpend`: Sum of expense.convertedAmount (normalized to base currency)

- **New `UsersPageFilters` interface** for advanced filtering:
  - `plan`: Filter by plan (all/free/plus/pro)
  - `activity`: Activity window (all/last7d/last30d/last90d)
  - `minTrips`: Minimum trips threshold (0/1/3/5)
  - `minExpenses`: Minimum expenses threshold (0/5/20/50)
  - `search`: Search by email or name

- **Efficient query implementation:**
  - Uses Prisma `groupBy` and batch queries
  - Maximum 3 queries total for the users page
  - No N+1 queries
  - Post-filtering for computed columns (minTrips/minExpenses)

- **Added Top Users functions:**
  - `getTopUsersByExpenses()`: Top 5 users by expense count
  - `getTopUsersBySpend()`: Top 5 users by total spend (converted amounts)

### 2. UI Components

#### `app/(app)/admin/AdminContent.tsx`
- **New KPI cards section** at top (compact 6-column grid):
  - Active Users (7d)
  - Active Users (30d)
  - Paying Users
  - New Users (7d)
  - Total Trips
  - Total Expenses

- **New "Top Users" mini tables** (2-column grid):
  - Top by Expenses Count (top 5)
  - Top by Total Spend (top 5)
  - Each row shows: email + value

- **Updated props** to receive:
  - `topUsersByExpenses`
  - `topUsersBySpend`
  - `filters` (instead of `currentPlan`)

#### `app/(app)/admin/AdminUsersTable.tsx`
- **Completely redesigned filter bar** (compact, responsive):
  - Plan dropdown (All/Free/Plus/Pro)
  - Activity window dropdown (All/Last 7d/30d/90d)
  - Min Trips dropdown (0/1/3/5)
  - Min Expenses dropdown (0/5/20/50)
  - Search input (email or name)
  - Apply filters button

- **New table columns:**
  - Email (with truncation for long emails)
  - Name (displayName or fullName)
  - Plan
  - **Trips** (count)
  - **Expenses** (count)
  - **Active Days** (count)
  - **Last Activity** (date)
  - **Total Spend** (formatted as currency)
  - Actions (enable/disable)

- **Responsive design:**
  - Filters wrap nicely on mobile
  - Compact padding (px-4 instead of px-6)
  - Horizontal scroll for table if needed

#### `app/(app)/admin/page.tsx`
- **Updated to handle all filter params:**
  - `page`, `plan`, `activity`, `minTrips`, `minExpenses`, `search`
  - Builds `UsersPageFilters` object from query params
  
- **Fetches new data:**
  - `topUsersByExpenses`
  - `topUsersBySpend`
  
- **Passes to AdminContent:**
  - All new props including `filters` object

### 3. Internationalization

#### `messages/en.json` & `messages/he.json`
Added translations for all new labels:
- `activeUsers7d`, `activeUsers30d`, `payingUsers`, `newUsers7d`
- `topUsersByExpenses`, `topUsersBySpend`
- `tripsCount`, `expensesCount`, `activeDays`, `lastActivity`, `totalSpend`
- `filters`, `activityWindow`, `activityAll`, `activityLast7d`, etc.
- `minTrips`, `minExpenses`, `search`, `searchPlaceholder`
- `usageAnalytics`

All translations provided in both English and Hebrew.

## Technical Details

### Query Efficiency
- **KPI Stats**: 1 query with 10 parallel counts
- **Users Page**: 3 queries max
  1. Users list with basic fields (paginated)
  2. Trips count (groupBy)
  3. Expenses aggregation (for count, active days, last activity, total spend)

### Currency Normalization
- `totalSpend` uses `expense.convertedAmount` which is already normalized to trip base currency
- Uses the same logic as existing reports (no new conversion logic invented)
- Falls back to 0 if expense has no converted amount

### Active Days Calculation
- Counts distinct days (date only, not time) from `expense.createdAt`
- Uses `Set` to ensure uniqueness per user
- Efficient in-memory calculation after batch fetch

### Last Activity
- Uses `max(expense.createdAt)` per user
- Falls back to `user.createdAt` if user has no expenses

### Filter Behavior
- All filters are optional
- Filters combine with AND logic
- Search uses OR across email, name, nickname (case-insensitive)
- Activity filter uses `expenses.some()` relation filter
- minTrips/minExpenses are post-filtered (computed columns)

### Security
- No changes to admin guard (`isAdminEmail()` check preserved)
- No new DB tables
- All queries respect existing Prisma model relationships
- Admin-only routes remain protected

## UI/UX Improvements

1. **Compact KPI Grid**: 6 cards in responsive grid (2 cols mobile, 3 tablet, 6 desktop)
2. **Top Users Insight**: Quick view of power users without scrolling
3. **Inline Filters**: All filters visible without expanding panels
4. **Mobile-Friendly**: Filters wrap nicely, table scrolls horizontally if needed
5. **Real-Time Search**: Search input supports Enter key for quick filtering
6. **Clear Visual Hierarchy**: New analytics section at top, then existing stats, then users table

## Testing

- ✅ Build passes: `npm run build` completed successfully
- ✅ No TypeScript errors
- ✅ No linter errors
- ✅ All i18n keys added for both languages
- ✅ Prisma queries use efficient groupBy/aggregation

## Migration Notes

- No database migrations required
- No schema changes
- All queries work with existing data
- Backward compatible (all filters optional with sensible defaults)

## Commit Message

```
admin: add usage analytics + filters

- Add 6 new KPI cards: active users (7d/30d), paying users, new users (7d), total trips, total expenses
- Add Top Users mini tables: by expense count and by total spend
- Enhance users table with usage columns: trips count, expenses count, active days, last activity, total spend
- Add compact filter bar: plan, activity window, min trips, min expenses, search by email/name
- Implement efficient batch queries (max 3 queries per page, no N+1)
- Use existing currency normalization logic from reports
- Add full i18n support (en + he) for all new labels
- Maintain admin-only access, no core app changes
```

## Future Enhancements (Optional)

- Add charts for user growth over time
- Add cohort analysis (retention by signup week)
- Add export functionality for user analytics
- Add user detail drill-down page
- Add email campaign integration

