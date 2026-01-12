# Localization System - Hebrew + RTL by Default

## 📋 Overview

This document describes the localization system and conventions used in the travel expense app. The app is designed to be **Hebrew-first with full RTL support**.

---

## 🌍 System Architecture

### Translation Files

All translations are stored in JSON files:

```
messages/
├── en.json   # English translations
└── he.json   # Hebrew translations (primary)
```

### Translation Provider

Located at `lib/i18n/I18nProvider.tsx`:

```typescript
import { useI18n } from "@/lib/i18n/I18nProvider"

export function MyComponent() {
  const { t, locale } = useI18n()
  const isRTL = locale === 'he'
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('myComponent.title')}</h1>
    </div>
  )
}
```

---

## ✅ Conventions - MUST Follow

### 1. Root Layout (Hebrew Default)

The root `app/layout.tsx` sets Hebrew as default:

```tsx
<html lang="he" dir="rtl" className={...} suppressHydrationWarning>
```

The `I18nProvider` dynamically updates `lang` and `dir` based on user preference.

### 2. Page Components - Always Use `dir` Attribute

Every page component should set direction explicitly:

```tsx
export default function MyPage() {
  const { t, locale } = useI18n()
  const isRTL = locale === 'he'
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page content */}
    </div>
  )
}
```

### 3. NO Hardcoded English Strings

❌ **WRONG:**
```tsx
<h1>Add Expense</h1>
<p>Loading...</p>
<button>Save</button>
```

✅ **CORRECT:**
```tsx
<h1>{t('addExpense.title')}</h1>
<p>{t('common.loading')}</p>
<button>{t('common.save')}</button>
```

### 4. Icon Positioning - RTL Aware

For icons next to text, use logical margins:

```tsx
// Padding/margin - use RTL-aware approach
<Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />

// Or use logical properties (preferred)
<Plus className="h-4 w-4 me-2" />  // margin-end works in RTL
```

### 5. Spacing - Use Logical Properties

```tsx
// Physical (breaks in RTL):
className="ml-4 mr-2"

// Logical (works in RTL):
className="ms-4 me-2"  // margin-start, margin-end
className="ps-4 pe-2"  // padding-start, padding-end
```

---

## 📝 Translation Key Structure

### Naming Convention

```
{section}.{component}.{element}
```

Examples:
- `trips.title` - Trips page title
- `addExpense.amount` - Add expense form amount field
- `categories.Food` - Food category label
- `common.save` - Common save button
- `nav.dashboard` - Navigation dashboard label

### Key Categories

| Prefix | Purpose |
|--------|---------|
| `app.*` | App-wide strings (name, tagline) |
| `trips.*` | Trips list page |
| `createTrip.*` | Create trip form |
| `dashboard.*` | Trip dashboard |
| `addExpense.*` | Add expense form |
| `categories.*` | Expense categories |
| `filters.*` | Filter UI |
| `map.*` | Map page |
| `settings.*` | Settings page |
| `nav.*` | Navigation labels |
| `common.*` | Shared UI strings |
| `tripCard.*` | Trip card component |

---

## 🔧 Adding New Translations

### Step 1: Add to English File

```json
// messages/en.json
{
  "myNewFeature": {
    "title": "My New Feature",
    "description": "Description here",
    "buttonLabel": "Click Me"
  }
}
```

### Step 2: Add to Hebrew File

```json
// messages/he.json
{
  "myNewFeature": {
    "title": "התכונה החדשה שלי",
    "description": "תיאור כאן",
    "buttonLabel": "לחץ עליי"
  }
}
```

### Step 3: Use in Component

```tsx
const { t } = useI18n()

return (
  <div>
    <h1>{t('myNewFeature.title')}</h1>
    <p>{t('myNewFeature.description')}</p>
    <button>{t('myNewFeature.buttonLabel')}</button>
  </div>
)
```

---

## 🎨 RTL-Specific Styling

### Text Alignment

```tsx
// Automatic (follows dir):
className="text-start"   // Right in RTL, Left in LTR
className="text-end"     // Left in RTL, Right in LTR

// Avoid:
className="text-left"    // Always left
className="text-right"   // Always right
```

### Flex Direction

```tsx
// Automatic row reversal:
<div className="flex" dir={isRTL ? 'rtl' : 'ltr'}>
  {/* Children auto-reverse in RTL */}
</div>
```

### Border and Accent

```tsx
// Use logical properties:
className="border-s-2"   // border-start
className="border-e-2"   // border-end
```

---

## 🔍 Debugging Translations

### Missing Translation

If a key is missing, the system returns the key itself:

```
// If 'myKey.missing' doesn't exist:
t('myKey.missing') → "myKey.missing"
```

This makes it easy to spot missing translations in the UI.

### Check Current Locale

```tsx
const { locale } = useI18n()
console.log('Current locale:', locale) // 'he' or 'en'
```

---

## 🧪 Testing Checklist

When adding or modifying UI:

1. [ ] All strings use `t('key')` - no hardcoded text
2. [ ] Hebrew translations added to `messages/he.json`
3. [ ] Page sets `dir={isRTL ? 'rtl' : 'ltr'}`
4. [ ] Icon margins are RTL-aware
5. [ ] Spacing uses logical properties (`ms-`, `me-`, `ps-`, `pe-`)
6. [ ] No visible English in Hebrew mode

---

## 📊 Current Translation Coverage

### Pages - Fully Translated ✅

| Page | Status |
|------|--------|
| Home (redirect) | ✅ |
| Trips List | ✅ |
| Create Trip | ✅ |
| Trip Dashboard | ✅ |
| Add Expense | ✅ |
| Map | ✅ |
| Settings | ✅ |

### Components - Fully Translated ✅

| Component | Status |
|-----------|--------|
| TopNav | ✅ |
| BottomNav | ✅ |
| TripCard | ✅ |
| ExpenseRow | ✅ (uses category translations) |

---

## 🚀 Quick Reference

### Import

```tsx
import { useI18n } from "@/lib/i18n/I18nProvider"
```

### Usage

```tsx
const { t, locale } = useI18n()
const isRTL = locale === 'he'
```

### Page Container

```tsx
<div dir={isRTL ? 'rtl' : 'ltr'}>
  {/* Content */}
</div>
```

### Text Translation

```tsx
{t('section.key')}
```

### RTL-Aware Icon

```tsx
<Icon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
```

---

## ⚠️ Common Mistakes

### 1. Forgetting `dir` Attribute

❌ Missing direction:
```tsx
<div className="container">
```

✅ With direction:
```tsx
<div className="container" dir={isRTL ? 'rtl' : 'ltr'}>
```

### 2. Hardcoded Text

❌ Hardcoded:
```tsx
<p>Loading...</p>
```

✅ Translated:
```tsx
<p>{t('common.loading')}</p>
```

### 3. Physical Margin

❌ Physical:
```tsx
className="mr-2"
```

✅ Logical:
```tsx
className="me-2"
// or
className={isRTL ? 'ml-2' : 'mr-2'}
```

---

## 📝 Files Modified for Localization

### Core Files

1. **`app/layout.tsx`** - Root layout with Hebrew default
2. **`lib/i18n/I18nProvider.tsx`** - Translation provider
3. **`lib/i18n/index.ts`** - Translation utilities

### Translation Files

4. **`messages/en.json`** - English translations
5. **`messages/he.json`** - Hebrew translations

### Pages (All translated)

6. **`app/trips/page.tsx`**
7. **`app/trips/new/page.tsx`**
8. **`app/trips/[tripId]/page.tsx`**
9. **`app/trips/[tripId]/add-expense/page.tsx`**
10. **`app/trips/[tripId]/map/page.tsx`**
11. **`app/trips/[tripId]/settings/page.tsx`**

### Components (All translated)

12. **`components/top-nav.tsx`**
13. **`components/bottom-nav.tsx`**
14. **`components/trip-card.tsx`**

---

**Result:** The app is now fully localized with Hebrew as the primary language and RTL layout by default. All pages and components follow a consistent translation pattern.

