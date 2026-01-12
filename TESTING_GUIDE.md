# 📱 Mobile-First Testing Guide

## 🚀 Quick Start

```bash
# Start the dev server (if not already running)
npm run dev

# Open in browser
http://localhost:3000
```

## 🧪 Complete Test Flow (15 minutes)

### Test 1: First Time User Experience (Mobile)
**Goal**: Create trip and add first expense with smart defaults

1. **Open app on mobile** (Chrome DevTools Device Mode: iPhone 12 Pro)
   - Should see "No trips yet" empty state
   - Large "Create Trip" button visible

2. **Create a trip**
   - Tap "Create Trip" button
   - Enter name: "Europe 2026"
   - Start date: Today
   - End date: 7 days from now
   - Base currency: USD
   - Your name: "Me"
   - Tap "Create Trip" (full-width button)
   - ✅ Should see toast: "Trip created!" (if we add it)
   - ✅ Should redirect to trip dashboard

3. **Verify trip dashboard (mobile)**
   - ✅ Should see compact header: "Europe 2026"
   - ✅ Should see 3 stat cards (stacked vertically)
   - ✅ Should see "No expenses yet" message
   - ✅ Should see bottom navigation (4 tabs)
   - ✅ "Dashboard" tab should be active (blue)

4. **Add first expense**
   - Tap center "Add" button in bottom nav (elevated circular button)
   - ✅ Should land on add expense page
   - ✅ Amount input should be HUGE (4xl font)
   - ✅ Numeric keyboard should appear (mobile)
   - ✅ Currency should be "USD" (trip default)
   - ✅ Country should be "US" (or trip's first country)
   - ✅ Date should be today
   - ✅ "Food" category should be pre-selected

5. **Fill expense form**
   - Enter amount: 25.50
   - Currency: Keep USD
   - Category: Tap "Transport" chip (should highlight blue)
   - Country: Keep US
   - Merchant: "Uber"
   - Note: "Airport to hotel"
   - ✅ Sticky "Save Expense" button visible at bottom

6. **Save expense**
   - Tap "Save Expense"
   - ✅ Should see toast: "Expense saved!"
   - ✅ Should redirect to dashboard
   - ✅ Should see expense in list
   - ✅ Stats should update (Total: $25.50, Avg: $3.64/day)

### Test 2: Smart Defaults
**Goal**: Verify last used currency/country are remembered

1. **Add second expense**
   - Tap "Add" in bottom nav
   - ✅ Currency should still be "USD" (last used)
   - ✅ Country should still be "US" (last used)

2. **Change currency and country**
   - Enter amount: 50
   - Change currency to "EUR"
   - Change country to "FR" (France 🇫🇷)
   - Category: "Food"
   - Merchant: "Le Cafe"
   - Tap "Save Expense"
   - ✅ Should see toast: "Expense saved!"

3. **Verify smart defaults updated**
   - Tap "Add" again
   - ✅ Currency should now be "EUR" (last used)
   - ✅ Country should now be "FR" (last used)
   - Press back (don't save)

### Test 3: Exchange Rate Warning
**Goal**: Test rate validation prevents bad data

1. **Go to Settings**
   - Tap "Settings" in bottom nav
   - ✅ Should see "Exchange Rates" tab active
   - ✅ Should see list of all currencies with rates

2. **Clear EUR rate**
   - Find EUR row
   - Clear the rate field (delete all text)
   - Tap "Save Rates"
   - ✅ Should see toast: "Exchange rates saved!"

3. **Try to add expense with EUR**
   - Tap "Add" in bottom nav
   - Enter amount: 100
   - Currency should be "EUR" (last used)
   - ✅ Should see RED WARNING: "⚠️ No exchange rate for EUR"
   - Tap "Save Expense"
   - ✅ Should see error toast: "No exchange rate found for EUR..."
   - ✅ Expense should NOT save

4. **Fix by using USD**
   - Change currency to "USD"
   - ✅ Warning should disappear
   - Tap "Save Expense"
   - ✅ Should save successfully

5. **Restore EUR rate**
   - Go to Settings > Exchange Rates
   - Set EUR rate to 0.92
   - Tap "Save Rates"
   - ✅ Toast: "Exchange rates saved!"

### Test 4: Filters
**Goal**: Test filtering expenses by multiple criteria

1. **Add more expenses** (to have data to filter)
   - Add expense: $30, USD, Food, US, "McDonald's"
   - Add expense: €20, EUR, Shopping, FR, "Souvenir Shop"
   - Add expense: $15, USD, Transport, US, "Metro"
   - ✅ Should have 5+ expenses total

2. **Open filters**
   - Go to Dashboard tab
   - Scroll to expenses list
   - Tap "Filters" button
   - ✅ Bottom sheet should slide up smoothly
   - ✅ Should see 4 filter options

3. **Filter by category**
   - Select category: "Food"
   - Tap "Apply"
   - ✅ Sheet should close
   - ✅ Should see only Food expenses
   - ✅ Counter should show "Expenses (2)" or similar
   - ✅ Filter button should show badge "!"

4. **Filter by country**
   - Tap "Filters" again
   - Clear category (select "All categories")
   - Select country: "France"
   - Tap "Apply"
   - ✅ Should see only FR expenses

5. **Search filter**
   - Tap "Filters"
   - Clear country
   - Enter search: "uber"
   - Tap "Apply"
   - ✅ Should see only Uber expense

6. **No matches**
   - Tap "Filters"
   - Enter search: "zzzzz"
   - Tap "Apply"
   - ✅ Should see "No expenses match your filters"
   - ✅ Should see "Clear filters" button
   - Tap "Clear filters"
   - ✅ All expenses should show again

7. **Clear all filters**
   - Tap "Filters"
   - Tap "Clear" button
   - Tap "Apply"
   - ✅ All expenses should show
   - ✅ Badge should disappear from filter button

### Test 5: Trip Members
**Goal**: Test adding/removing members

1. **Go to Settings > Members**
   - Tap "Settings" in bottom nav
   - Tap "Members" tab
   - ✅ Should see your initial member (owner)

2. **Add a member**
   - Enter name: "Jane Doe"
   - Select role: "Editor"
   - Tap "Add Member"
   - ✅ Toast: "Member added!"
   - ✅ Jane should appear in list with "editor" badge

3. **Add another member**
   - Enter name: "Bob Smith"
   - Select role: "Viewer"
   - Tap "Add Member"
   - ✅ Bob should appear in list

4. **Remove a member**
   - Tap trash icon next to Bob
   - ✅ Toast: "Member removed"
   - ✅ Bob should disappear from list

5. **Try to remove last owner**
   - Tap trash icon next to your owner member
   - ✅ Toast: "Cannot remove the last owner"
   - ✅ Member should still be there

### Test 6: Bottom Navigation
**Goal**: Test all nav tabs work correctly

1. **Test all tabs**
   - Tap "Dashboard" - ✅ Should show trip dashboard
   - Tap "Add" - ✅ Should show add expense form
   - Tap "Map" - ✅ Should show "Coming Soon" placeholder
   - Tap "Settings" - ✅ Should show settings page

2. **Verify active states**
   - On Dashboard: ✅ "Dashboard" should be blue
   - On Add: ✅ "Add" button should be elevated
   - On Settings: ✅ "Settings" should be blue

3. **Verify bottom nav doesn't hide content**
   - Go to Dashboard
   - Scroll to bottom of expenses list
   - ✅ Last expense should be fully visible (not hidden behind nav)
   - ✅ Should have padding at bottom

### Test 7: Desktop Responsive
**Goal**: Verify desktop layout works correctly

1. **Switch to desktop view**
   - In DevTools, click "Responsive" and drag to > 768px width
   - OR disable device toolbar
   - ✅ Bottom nav should disappear
   - ✅ Full PageHeaders should appear
   - ✅ Buttons should show text (not just icons)

2. **Test trip dashboard (desktop)**
   - ✅ Should see full header with description
   - ✅ Should see "Add Expense" button with text
   - ✅ Stats should be in 3-column grid
   - ✅ Breakdowns should be side-by-side (2 columns)

3. **Test add expense (desktop)**
   - Click "Add Expense"
   - ✅ Should see full PageHeader
   - ✅ Amount input still large but not 4xl
   - ✅ Actions at bottom of form (not sticky)
   - ✅ No bottom nav

4. **Test trips list (desktop)**
   - Go back to /trips
   - ✅ Should see full PageHeader
   - ✅ Should see "New Trip" button with text
   - ✅ No floating action button
   - ✅ Trip cards in grid (2-3 columns)

### Test 8: Category Chips Scroll
**Goal**: Test horizontal scroll on category chips

1. **Go to Add Expense**
   - Tap "Add" in bottom nav (mobile view)
   - ✅ Should see 8 category chips in a row

2. **Test horizontal scroll**
   - Swipe left on category chips
   - ✅ Should scroll horizontally
   - ✅ Should see all 8 categories (Food, Transport, Flights, Lodging, Activities, Shopping, Health, Other)
   - ✅ No vertical scrollbar

3. **Test category selection**
   - Tap "Flights"
   - ✅ Should highlight in blue
   - ✅ Previous selection should unhighlight
   - Tap "Lodging"
   - ✅ Should highlight Lodging, unhighlight Flights

### Test 9: Sticky Actions (Mobile)
**Goal**: Test sticky save button on add expense

1. **Go to Add Expense (mobile)**
   - ✅ Should see form fields

2. **Scroll down**
   - Fill some fields
   - Scroll down in the form
   - ✅ Sticky "Save Expense" bar should stay at bottom
   - ✅ Should be above bottom nav
   - ✅ Should have shadow/border

3. **Test buttons**
   - ✅ "Cancel" button should be 1/3 width
   - ✅ "Save Expense" button should be 2/3 width
   - ✅ Both should be large (h-12)

### Test 10: Toast Notifications
**Goal**: Verify all toasts appear correctly

1. **Success toasts** (green)
   - Save expense - ✅ "Expense saved!"
   - Save rates - ✅ "Exchange rates saved!"
   - Add member - ✅ "Member added!"
   - Remove member - ✅ "Member removed"

2. **Error toasts** (red)
   - Invalid amount - ✅ "Please enter a valid amount"
   - Missing rate - ✅ "No exchange rate found for EUR..."
   - Failed to save - ✅ "Failed to create expense..."

3. **Warning toasts** (yellow)
   - Last owner - ✅ "Cannot remove the last owner"

4. **Toast behavior**
   - ✅ Should appear at top-center
   - ✅ Should auto-dismiss after ~3 seconds
   - ✅ Should have icon (✓, ✗, ⚠)
   - ✅ Should have colored background

---

## ✅ Final Verification

### Mobile Checklist
- [ ] Bottom nav visible and functional
- [ ] All tabs navigate correctly
- [ ] Add button is larger and elevated
- [ ] Amount input is huge (4xl font)
- [ ] Numeric keyboard appears
- [ ] Category chips scroll horizontally
- [ ] Smart defaults work (currency/country)
- [ ] Exchange rate warning shows
- [ ] Filters slide up smoothly
- [ ] Sticky save button works
- [ ] Toasts appear for all actions
- [ ] No content hidden behind bottom nav
- [ ] Headers are compact
- [ ] Buttons are full-width or large
- [ ] All touch targets ≥ 48px

### Desktop Checklist
- [ ] Bottom nav hidden
- [ ] Full PageHeaders visible
- [ ] Text buttons (not just icons)
- [ ] Multi-column grids work
- [ ] No floating action buttons
- [ ] Proper spacing and padding
- [ ] Smooth responsive transition

### Data Integrity
- [ ] Expenses save correctly
- [ ] Rates persist in localStorage
- [ ] Members persist in trip
- [ ] Smart defaults persist across sessions
- [ ] Filters don't modify data
- [ ] Calculations are accurate

### Performance
- [ ] No lag when typing
- [ ] Smooth animations
- [ ] Fast page transitions
- [ ] Instant filter updates
- [ ] No console errors

---

## 🐛 Known Issues / Limitations

### MVP Limitations (By Design)
- No real authentication (localStorage only)
- No database (localStorage only)
- No real-time sync
- No receipt uploads
- Map is placeholder only
- No expense editing/deleting (can add in future)
- Members are local only (no real sharing)

### Browser Compatibility
- Tested on Chrome/Edge (Chromium)
- Should work on Safari/Firefox
- Requires modern browser (ES6+)

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Device: ___________
Browser: ___________

Test 1 - First Time User: [ PASS / FAIL ]
Test 2 - Smart Defaults: [ PASS / FAIL ]
Test 3 - Exchange Rate Warning: [ PASS / FAIL ]
Test 4 - Filters: [ PASS / FAIL ]
Test 5 - Trip Members: [ PASS / FAIL ]
Test 6 - Bottom Navigation: [ PASS / FAIL ]
Test 7 - Desktop Responsive: [ PASS / FAIL ]
Test 8 - Category Chips Scroll: [ PASS / FAIL ]
Test 9 - Sticky Actions: [ PASS / FAIL ]
Test 10 - Toast Notifications: [ PASS / FAIL ]

Overall: [ PASS / FAIL ]

Notes:
_________________________________
_________________________________
```

---

## 🎉 Success Criteria

✅ **All 10 tests pass**
✅ **No console errors**
✅ **No TypeScript errors**
✅ **Build succeeds**
✅ **Works on mobile (< 768px)**
✅ **Works on desktop (≥ 768px)**
✅ **Data persists in localStorage**
✅ **All toasts appear correctly**
✅ **Smart defaults work**
✅ **Exchange rate validation works**

---

**Ready to test!** Open `http://localhost:3000` and follow the guide above. 🚀

