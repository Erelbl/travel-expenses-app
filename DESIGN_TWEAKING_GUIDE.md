# 🎨 Design Tweaking Guide

Quick reference for customizing the premium design system without breaking functionality.

---

## 🌈 Color Tweaking

### Background Gradient
**File**: `app/globals.css` (lines 5-6)

```css
:root {
  --bg-gradient-from: #0f172a; /* TOP color */
  --bg-gradient-to: #1e3a5f;   /* BOTTOM color */
}
```

**Popular alternatives**:
```css
/* Purple night */
--bg-gradient-from: #581c87;
--bg-gradient-to: #7e22ce;

/* Teal ocean */
--bg-gradient-from: #134e4a;
--bg-gradient-to: #115e59;

/* Deep blue */
--bg-gradient-from: #1e3a8a;
--bg-gradient-to: #1e40af;

/* Dark slate (more neutral) */
--bg-gradient-from: #0f172a;
--bg-gradient-to: #1e293b;
```

### Primary Action Color
**File**: `app/globals.css` (lines 17-18)

```css
:root {
  --primary: #3b82f6;      /* Main blue */
  --primary-hover: #2563eb; /* Darker on hover */
}
```

**Alternatives**:
```css
/* Green */
--primary: #10b981;
--primary-hover: #059669;

/* Purple */
--primary: #8b5cf6;
--primary-hover: #7c3aed;

/* Orange */
--primary: #f97316;
--primary-hover: #ea580c;
```

### Card Background Opacity
**File**: `app/globals.css` (line 8)

```css
:root {
  --card-bg: rgba(255, 255, 255, 0.95); /* 95% opaque */
}
```

**Adjust opacity** (0.85 to 1.0):
```css
/* More transparent (more background shows through) */
--card-bg: rgba(255, 255, 255, 0.85);

/* Less transparent (more solid) */
--card-bg: rgba(255, 255, 255, 1.0);

/* Sweet spot for most designs */
--card-bg: rgba(255, 255, 255, 0.92);
```

---

## 🌍 Globe Artwork Tweaking

### Globe Opacity
**File**: `components/GlobeBackground.tsx` (line 17)

```tsx
<svg
  className="... opacity-[0.08]" /* Change this value */
```

**Recommendations**:
- `0.06` - Very subtle (barely visible)
- `0.08` - Default (good balance)
- `0.10` - More visible
- `0.12` - Bold (may compete with content)

### Globe Position
**File**: `components/GlobeBackground.tsx` (line 17)

```tsx
<svg
  className="absolute -bottom-32 -right-32 ..." /* Change position */
```

**Alternatives**:
```tsx
/* Center */
className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ..."

/* Top right */
className="absolute -top-32 -right-32 ..."

/* Bottom left */
className="absolute -bottom-32 -left-32 ..."

/* Full center (larger) */
className="absolute inset-0 m-auto ..."
```

### Globe Size
**File**: `components/GlobeBackground.tsx` (line 17)

```tsx
<svg
  className="... w-[600px] h-[600px] md:w-[800px] md:h-[800px]"
```

**Alternatives**:
```tsx
/* Smaller */
className="... w-[400px] h-[400px] md:w-[600px] md:h-[600px]"

/* Larger */
className="... w-[800px] h-[800px] md:w-[1000px] md:h-[1000px]"

/* Huge (background only) */
className="... w-[1000px] h-[1000px] md:w-[1400px] md:h-[1400px]"
```

### Globe Color
**File**: `components/GlobeBackground.tsx` (lines 21, 24-28, 31-34)

```tsx
<circle className="text-blue-300" /> {/* Change text-blue-300 */}
<ellipse className="text-blue-300" /> {/* Change all instances */}
```

**Alternatives**:
```tsx
/* Lighter blue */
className="text-blue-200"

/* Purple tones */
className="text-purple-300"

/* Green */
className="text-green-300"

/* White (subtle) */
className="text-white"
```

---

## 💳 Card Styling

### Glassmorphism Blur
**File**: `app/globals.css` (line 81)

```css
.premium-card {
  backdrop-filter: blur(20px); /* Blur amount */
}
```

**Adjust blur** (10px to 40px):
```css
/* Less blur (more visible background) */
backdrop-filter: blur(10px);

/* More blur (frosted glass effect) */
backdrop-filter: blur(30px);

/* Heavy blur (very solid) */
backdrop-filter: blur(40px);
```

### Card Shadow Intensity
**File**: `app/globals.css` (line 83)

```css
.premium-card {
  box-shadow: var(--shadow-lg);
}
```

**Change shadow** (in :root):
```css
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                                            /* ^ Increase this */

/* Stronger shadow */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.2);

/* Lighter shadow */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
```

### Card Border Radius
**File**: `app/globals.css` (line 82)

```css
.premium-card {
  border-radius: var(--radius-lg); /* 1rem = 16px */
}
```

**Adjust** (in :root):
```css
--radius-lg: 1rem;    /* Default */
--radius-lg: 0.75rem; /* Smaller radius */
--radius-lg: 1.5rem;  /* Larger radius */
--radius-lg: 2rem;    /* Very round */
```

---

## 🔘 Button Styling

### Button Gradient
**File**: `app/globals.css` (line 98)

```css
.premium-button-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
}
```

**Change angle**:
```css
/* Vertical gradient */
background: linear-gradient(180deg, var(--primary) 0%, var(--primary-hover) 100%);

/* Horizontal gradient */
background: linear-gradient(90deg, var(--primary) 0%, var(--primary-hover) 100%);

/* Different angle */
background: linear-gradient(45deg, var(--primary) 0%, var(--primary-hover) 100%);
```

### Button Shadow
**File**: `app/globals.css` (line 101)

```css
.premium-button-primary {
  box-shadow: var(--shadow-md);
}
```

**Adjust intensity**:
```css
/* Lighter shadow */
box-shadow: var(--shadow-sm);

/* Heavier shadow */
box-shadow: var(--shadow-lg);

/* No shadow */
box-shadow: none;
```

### Hover Lift Amount
**File**: `app/globals.css` (line 107)

```css
.premium-button-primary:hover:not(:disabled) {
  transform: translateY(-1px); /* Lift amount */
}
```

**Adjust lift**:
```css
/* Subtle lift */
transform: translateY(-0.5px);

/* More dramatic */
transform: translateY(-2px);

/* No lift (just shadow change) */
transform: none;
```

---

## 📝 Input Styling

### Input Background Opacity
**File**: `app/globals.css` (line 89)

```css
.premium-input {
  background: rgba(255, 255, 255, 0.8); /* 80% opaque */
}
```

**Adjust**:
```css
/* More transparent */
background: rgba(255, 255, 255, 0.7);

/* More solid */
background: rgba(255, 255, 255, 0.95);

/* Fully opaque */
background: rgba(255, 255, 255, 1.0);
```

### Input Border on Focus
**File**: `app/globals.css` (line 96)

```css
.premium-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); /* Ring opacity */
}
```

**Adjust ring**:
```css
/* Stronger ring */
box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);

/* Subtle ring */
box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.05);

/* No ring */
box-shadow: none;
```

---

## 🎭 Category Chips

### Active Chip Colors
**File**: `app/globals.css` (lines 128-132)

```css
.premium-badge-active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
  color: var(--primary-foreground);
}
```

**Change to different color**:
```css
/* Green active */
background: linear-gradient(135deg, #10b981 0%, #059669 100%);

/* Purple active */
background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);

/* Solid color (no gradient) */
background: var(--primary);
```

### Inactive Chip Colors
**File**: `app/globals.css` (lines 120-126)

```css
.premium-badge {
  background: rgba(59, 130, 246, 0.1); /* Blue tint */
  color: var(--primary);
}
```

**Adjust tint**:
```css
/* Lighter tint */
background: rgba(59, 130, 246, 0.05);

/* Stronger tint */
background: rgba(59, 130, 246, 0.15);

/* Different color tint */
background: rgba(16, 185, 129, 0.1); /* Green */
```

---

## 🌟 Accent Orbs (Background)

### Orb Opacity
**File**: `components/GlobeBackground.tsx` (lines 48, 51)

```tsx
<div className="... bg-blue-500/5 ..." /> {/* /5 = 5% opacity */}
<div className="... bg-green-500/5 ..." />
```

**Adjust** (use /3 to /10):
```tsx
/* More subtle */
className="... bg-blue-500/3 ..."

/* More visible */
className="... bg-blue-500/8 ..."

/* Bold */
className="... bg-blue-500/10 ..."
```

### Orb Blur
**File**: `components/GlobeBackground.tsx` (lines 48, 51)

```tsx
<div className="... blur-3xl" /> {/* 3xl = 64px blur */}
```

**Alternatives**:
```tsx
/* Less blur */
className="... blur-2xl" /* 40px */

/* More blur */
className="... blur-[100px]" /* Custom size */
```

---

## 📱 Mobile-Specific

### Bottom Nav Height
**File**: `components/bottom-nav.tsx` (line 31)

```tsx
<nav className="... h-16"> {/* 64px height */}
```

**Adjust**:
```tsx
/* Taller */
className="... h-20" /* 80px */

/* Shorter */
className="... h-14" /* 56px */
```

### Amount Input Font Size
**File**: `app/trips/[tripId]/add-expense/page.tsx`

```tsx
<Input className="... text-5xl ..." /> {/* 3rem / 48px */}
```

**Adjust**:
```tsx
/* Smaller */
className="... text-4xl ..." /* 2.25rem / 36px */

/* Larger */
className="... text-6xl ..." /* 3.75rem / 60px */
```

---

## 🎬 Animation Speeds

### Global Transition Duration
**File**: `app/globals.css` (line 157)

```css
* {
  transition-duration: 150ms; /* Speed */
}
```

**Adjust**:
```css
/* Faster */
transition-duration: 100ms;

/* Slower (smoother) */
transition-duration: 200ms;

/* Very slow (Apple-like) */
transition-duration: 300ms;
```

### Slide-Up Animation Speed
**File**: `app/globals.css` (line 31)

```css
@keyframes slide-up {
  /* ... */
}

.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                      /* ^ Change this */
}
```

**Adjust**:
```css
/* Faster */
animation: slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);

/* Slower */
animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
```

---

## 🔍 Quick Changes Cheat Sheet

```bash
# Background color
app/globals.css → :root → --bg-gradient-from/to

# Globe opacity
components/GlobeBackground.tsx → opacity-[0.08]

# Card blur
app/globals.css → .premium-card → backdrop-filter: blur(20px)

# Primary color
app/globals.css → :root → --primary

# Button gradient
app/globals.css → .premium-button-primary → background

# Input opacity
app/globals.css → .premium-input → background

# Amount input size
app/trips/[tripId]/add-expense/page.tsx → text-5xl
```

---

**Happy tweaking!** 🎨 All changes are in CSS/Tailwind classes - no logic affected.

