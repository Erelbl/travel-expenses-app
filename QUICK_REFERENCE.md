# 🌍 Travel Passport Theme - Quick Reference

## 🎯 Three Tweak Points

### 1️⃣ Primary Color (Turquoise)
```css
/* File: app/globals.css (line 21) */
--turquoise-primary: #14b8a6;  /* ← CHANGE THIS */
```

### 2️⃣ Background Gradient (2 colors)
```tsx
/* File: components/TopographicBackground.tsx (line 13) */
background: 'linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)'
                                    /* ↑ START    ↑ END */
```

### 3️⃣ Paper Surface
```css
/* File: app/globals.css (line 8) */
--paper-surface: #fef8f0;  /* ← CHANGE THIS */
```

---

## 🎨 Color Palette

```
Background Gradient:
  Start: #06b6d4 (cyan-500)
  End:   #14b8a6 (teal-500)

Surfaces:
  Paper:    #fef8f0 (warm off-white)
  Elevated: #ffffff (pure white)

Text:
  Primary: #0f172a (slate-900, navy)
  Muted:   #475569 (slate-600)
  On BG:   #ffffff (white)

Primary:
  Base:  #14b8a6 (teal-500, turquoise)
  Hover: #0d9488 (teal-600)

Accent:
  Base:  #84cc16 (lime-500)
  Hover: #65a30d (lime-600)
```

---

## 📦 New Components

### PassportCard
```tsx
import { PassportCard } from '@/components/ui/passport-card';

<PassportCard>
  {/* Regular passport paper (#fef8f0) */}
</PassportCard>

<PassportCard elevated>
  {/* White elevated surface */}
</PassportCard>
```

### StampBadge
```tsx
import { StampBadge } from '@/components/ui/passport-card';

<StampBadge variant="country">IL</StampBadge>
<StampBadge variant="currency">USD</StampBadge>
<StampBadge variant="category">Food</StampBadge>
```

---

## 🎨 CSS Classes

### Inputs
```tsx
<input className="premium-input" />
```
- White background
- 2px turquoise border
- Turquoise focus ring

### Buttons
```tsx
<button className="premium-button-primary" />
```
- Turquoise background
- White text
- Bold font (700)
- Turquoise shadow

### Badges (Category Chips)
```tsx
<button className="premium-badge" />        {/* Inactive */}
<button className="premium-badge-active" /> {/* Active */}
```
- Inactive: Warm yellow bg, brown text, uppercase
- Active: Turquoise bg, white text, shadow

---

## 📁 Key Files

### Theme
- `lib/ui/theme.ts` - All theme tokens
- `app/globals.css` - CSS variables + utility classes

### Background
- `components/TopographicBackground.tsx` - Gradient + topographic lines

### Components
- `components/ui/passport-card.tsx` - PassportCard + StampBadge
- `components/stat-card.tsx` - Uses PassportCard
- `components/trip-card.tsx` - Uses PassportCard
- `components/expense-row.tsx` - Uses StampBadge

### Pages
- `app/trips/page.tsx` - Trips list
- `app/trips/[tripId]/page.tsx` - Trip dashboard
- `app/trips/[tripId]/add-expense/page.tsx` - Add expense

---

## 🚀 Quick Start

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Visit
http://localhost:3000
```

---

## ✅ Checklist

Visual:
- [ ] Turquoise gradient background
- [ ] Topographic lines visible (subtle)
- [ ] Cards have warm paper surface
- [ ] Stamp badges for categories/currencies
- [ ] Teal branding in nav

Mobile:
- [ ] Bottom nav with teal active states
- [ ] Sticky headers with frosted glass
- [ ] Category chips scroll horizontally
- [ ] Touch targets 48px+

Desktop:
- [ ] Responsive grid layouts
- [ ] Hover effects on cards
- [ ] All pages adapt correctly

---

## 📊 Build Status

```
✓ Compiled successfully in 5.4s
✓ TypeScript: No errors
✓ Linter: No errors
✓ All routes: OK
```

---

**Ready!** 🚀✈️🌍

