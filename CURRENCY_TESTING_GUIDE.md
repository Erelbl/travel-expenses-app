# 🧪 Currency Improvements - Quick Testing Guide

## 🚀 Quick Start
```bash
npm run dev
# Open http://localhost:3000
```

---

## ✅ 5-Minute Test Flow

### Test 1: Create Multi-Country Trip (2 min)

**Goal**: Verify planned countries and currency preview

1. Navigate to `/trips/new`
2. Enter trip name: **"Southeast Asia 2026"**
3. Dates: Today → 14 days from now
4. **Planned Countries** dropdown:
   - Select **Thailand** 🇹🇭
   - Select **Vietnam** 🇻🇳
   - Select **Cambodia** 🇰🇭
5. Observe badges appear with X buttons
6. **Check currency preview box**:
   ```
   Currencies for this trip: KHR, THB, VND
   Based on your planned countries, these currencies will be shown first
   ```
7. Base currency: **USD**
8. Click **"Create Trip"**

**Expected Results**:
- ✅ Countries show as removable badges
- ✅ Currency preview updates dynamically
- ✅ Toast: "Trip created!"
- ✅ Redirects to trip dashboard

---

### Test 2: Smart Currency Defaults (1 min)

**Goal**: Verify currency auto-selects based on country

1. On trip dashboard, tap **"Add"** in bottom nav (mobile) or button (desktop)
2. **Observe initial state**:
   - Currency dropdown: Should show **only THB, VND, KHR** (not all currencies)
   - Currency selected: **THB** (first planned country)
   - Country selected: **TH** (Thailand)
   - Button visible: **"Show all currencies"**

**Expected Results**:
- ✅ Currency dropdown filtered to 3 currencies
- ✅ Default currency is THB
- ✅ Default country is TH

---

### Test 3: Auto-Currency on Country Change (1 min)

**Goal**: Verify currency updates when country changes

1. Still on add expense page
2. Change **Country** to **Vietnam** 🇻🇳
3. **Watch currency field** (should auto-change)
4. Change **Country** to **Cambodia** 🇰🇭
5. **Watch currency field** (should auto-change again)

**Expected Results**:
- ✅ VN selected → Currency changes to **VND**
- ✅ KH selected → Currency changes to **KHR**
- ✅ No page reload, instant update
- ✅ Smooth UX

---

### Test 4: Manual Override with "Show All" (30 sec)

**Goal**: Verify user can access all currencies

1. Still on add expense page
2. Click **"Show all currencies"** button
3. Open currency dropdown
4. **Observe**: Now shows all major currencies (USD, EUR, GBP, etc.)
5. Select **USD**
6. **Check hint text**: "Showing all currencies. Recommended for this trip: KHR, THB, VND"

**Expected Results**:
- ✅ Button click expands currency list
- ✅ All currencies now available
- ✅ Hint shows recommended currencies
- ✅ Can select any currency

---

### Test 5: Per-Trip Currency Memory (30 sec)

**Goal**: Verify last used currency is remembered per trip

1. Fill expense:
   - Amount: **500**
   - Currency: **VND** (if not already)
   - Country: **VN**
   - Category: **Food**
2. Click **"Save Expense"**
3. Toast: "Expense saved!"
4. Tap **"Add"** again
5. **Observe currency**: Should be **VND** (last used)

6. Change currency to **THB**
7. Save another expense
8. Tap **"Add"** again
9. **Observe currency**: Should now be **THB** (new last used)

**Expected Results**:
- ✅ First add: Currency is VND (last used)
- ✅ Second add: Currency is THB (new last used)
- ✅ Memory is per-trip specific

---

## 🎯 Edge Case Tests (Optional)

### Test 6: Trip Without Planned Countries

**Goal**: Verify backward compatibility

1. Create new trip: **"Mystery Trip"**
2. **Don't select any planned countries**
3. Base currency: **USD**
4. Create trip
5. Tap "Add" expense

**Expected**:
- ✅ Currency dropdown shows all major currencies (USD, EUR, GBP, ILS, JPY, AUD, CAD, CHF)
- ✅ Default currency is USD (base currency)
- ✅ No errors, graceful fallback

---

### Test 7: Remove Country from Trip Creation

**Goal**: Verify dynamic updates in create form

1. Start creating trip
2. Add **Thailand**, **Vietnam**, **Cambodia**
3. Currency preview: "KHR, THB, VND"
4. Click **X** on Vietnam badge
5. **Observe preview**: Should update to "KHR, THB"
6. Click **X** on Cambodia badge
7. **Observe preview**: Should update to "THB"
8. Click **X** on Thailand badge
9. **Observe**: Currency preview box should disappear

**Expected**:
- ✅ Preview updates instantly
- ✅ Can remove and re-add countries
- ✅ Preview disappears when no countries

---

### Test 8: Exchange Rate Validation

**Goal**: Verify validation still works with new system

1. On Southeast Asia trip
2. Add expense
3. Click "Show all currencies"
4. Select **EUR** (if not in exchange rates)
5. Try to save

**Expected**:
- ✅ Red warning: "⚠️ No exchange rate for EUR"
- ✅ Save button disabled OR shows error toast
- ✅ Must add rate in Settings or change currency

---

## 📱 Mobile-Specific Tests

### Test 9: Mobile Country Selector

1. Open on mobile (Chrome DevTools Device Mode)
2. Create trip
3. Tap "Planned Countries" dropdown
4. Select multiple countries
5. Tap X on badges

**Expected**:
- ✅ Dropdown is touch-friendly (large)
- ✅ Badges are tappable
- ✅ X buttons are large enough (48px target)

---

### Test 10: Mobile Currency Picker

1. On mobile add expense page
2. Currency dropdown should be large (h-16)
3. "Show all currencies" button should be visible
4. Tap to expand

**Expected**:
- ✅ Currency dropdown is h-16 (64px)
- ✅ Easy to tap with thumb
- ✅ Toggle button accessible

---

## 🎨 Visual Checks

### Create Trip Page
- [ ] Country badges have flags
- [ ] X buttons are visible
- [ ] Currency preview box has muted background
- [ ] Preview text is clear and helpful

### Add Expense Page
- [ ] Currency dropdown shows filtered list
- [ ] "Show all currencies" button is subtle (ghost variant)
- [ ] Hint text is muted and small
- [ ] Country help text: "Currency will auto-update based on country"

---

## 🐛 Common Issues to Check

### Issue: Currency doesn't auto-update
**Check**:
- Is the country in the mapping? (See `lib/utils/countryCurrency.ts`)
- Is the currency in allowed list for trip?
- Is "Show all currencies" enabled? (Auto-update only works with filtered list)

### Issue: All currencies showing instead of filtered
**Check**:
- Does trip have planned countries?
- Is `trip.plannedCountries` populated?
- Check browser console for errors

### Issue: Last used currency not remembered
**Check**:
- Is expense saving successfully?
- Check localStorage: `travel-expenses:trip-preferences`
- Is tripId correct?

---

## ✅ Success Criteria

All tests should pass:
- [x] Create trip with planned countries
- [x] Currency preview shows correct currencies
- [x] Currency dropdown is filtered
- [x] Auto-currency on country change
- [x] "Show all currencies" works
- [x] Per-trip currency memory works
- [x] Backward compatible (no planned countries)
- [x] Exchange rate validation still works
- [x] Mobile-friendly UI
- [x] No console errors

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Device: ___________

Test 1 - Create Multi-Country Trip: [ PASS / FAIL ]
Test 2 - Smart Currency Defaults: [ PASS / FAIL ]
Test 3 - Auto-Currency on Country Change: [ PASS / FAIL ]
Test 4 - Manual Override: [ PASS / FAIL ]
Test 5 - Per-Trip Memory: [ PASS / FAIL ]
Test 6 - No Planned Countries: [ PASS / FAIL ]
Test 7 - Remove Country: [ PASS / FAIL ]
Test 8 - Exchange Rate Validation: [ PASS / FAIL ]

Overall: [ PASS / FAIL ]

Notes:
_________________________________
```

---

## 🎉 Quick Visual Test (30 seconds)

**Fastest way to verify it works**:

1. Create trip with Thailand + Vietnam
2. See currency preview: "THB, VND"
3. Add expense
4. See filtered currencies: THB, VND
5. Change country to Vietnam
6. Watch currency change to VND
7. ✅ **IT WORKS!**

---

**Ready to test!** Start with the 5-minute flow above. 🚀

