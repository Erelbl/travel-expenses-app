# i18n Developer Guide

## Core Rule

**NEVER hardcode UI strings.** Always use `t('key')` and add keys to both JSON files.

## Usage

```tsx
import { useI18n } from '@/lib/i18n/I18nProvider';

function MyComponent() {
  const { t, locale } = useI18n();
  
  return (
    <div>
      <h1>{t('mySection.title')}</h1>
      <p>{t('mySection.description')}</p>
    </div>
  );
}
```

## Adding New Translations

1. Add the key to both `/messages/en.json` and `/messages/he.json`
2. Use dot notation for nested keys: `section.subsection.key`
3. Group related keys together (e.g., `nav.*`, `trips.*`, `common.*`)

## Key Organization

- `nav.*` - Navigation labels
- `trips.*` - Trips list page
- `createTrip.*` - Create trip form
- `dashboard.*` - Trip dashboard
- `addExpense.*` - Add expense form
- `categories.*` - Expense categories
- `common.*` - Shared UI elements (buttons, actions)

## RTL Support

Hebrew automatically triggers RTL mode. The `locale` value can be used for conditional styling:

```tsx
const { locale } = useI18n();
const isRTL = locale === 'he';

<div className={isRTL ? 'pl-4' : 'pr-4'}>
  {/* Content */}
</div>
```

## Fallback

If a key is missing in Hebrew, it automatically falls back to English. If missing in both, it returns the key itself.

## Testing

Toggle between EN/HE using the language toggle in the top navigation. All UI text should update immediately without page reload.

