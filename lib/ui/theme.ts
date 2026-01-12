/**
 * Travel Passport / Explorer Theme
 * Centralized design tokens for the travel expense tracking app
 */

export const theme = {
  // Colors
  colors: {
    // Background: bright turquoise gradient
    bgGradientStart: '#06b6d4', // cyan-500
    bgGradientEnd: '#14b8a6',   // teal-500
    
    // Surfaces: warm passport paper
    paperSurface: '#fef8f0',     // warm off-white
    paperSurfaceElevated: '#ffffff', // pure white for elevated cards
    
    // Text
    navyText: '#0f172a',         // slate-900 (deep navy for main text)
    navyTextMuted: '#475569',    // slate-600 (muted navy)
    textOnBg: '#ffffff',         // white text on gradient background
    
    // Primary: turquoise
    turquoisePrimary: '#14b8a6', // teal-500
    turquoisePrimaryHover: '#0d9488', // teal-600
    turquoisePrimaryLight: '#5eead4', // teal-300
    
    // Accent: lime for highlights
    limeAccent: '#84cc16',       // lime-500
    limeAccentHover: '#65a30d',  // lime-600
    limeAccentLight: '#bef264',  // lime-300
    
    // Borders & shadows
    border: 'rgba(203, 213, 225, 0.4)', // slate-300 with opacity
    borderDark: 'rgba(148, 163, 184, 0.5)', // slate-400 with opacity
    shadowColor: 'rgba(15, 23, 42, 0.08)', // navy shadow
    
    // Semantic
    success: '#10b981',  // green-500
    warning: '#f59e0b',  // amber-500
    error: '#ef4444',    // red-500
    info: '#3b82f6',     // blue-500
  },
  
  // Border Radius
  radius: {
    sm: '0.375rem',  // 6px - small elements
    md: '0.5rem',    // 8px - default
    lg: '0.75rem',   // 12px - cards
    xl: '1rem',      // 16px - large cards
    full: '9999px',  // circular
  },
  
  // Shadows (subtle, passport-paper feel)
  shadows: {
    sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
    xl: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 10px 10px -5px rgba(15, 23, 42, 0.03)',
  },
  
  // Typography
  fonts: {
    body: 'var(--font-manrope), system-ui, -apple-system, sans-serif',
    heading: 'var(--font-manrope), system-ui, -apple-system, sans-serif',
  },
  
  // Spacing (keep consistent with Tailwind)
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },
} as const;

// Utility: Get CSS custom properties
export function getThemeCSS() {
  return `
    --bg-gradient-start: ${theme.colors.bgGradientStart};
    --bg-gradient-end: ${theme.colors.bgGradientEnd};
    --paper-surface: ${theme.colors.paperSurface};
    --paper-surface-elevated: ${theme.colors.paperSurfaceElevated};
    --navy-text: ${theme.colors.navyText};
    --navy-text-muted: ${theme.colors.navyTextMuted};
    --text-on-bg: ${theme.colors.textOnBg};
    --turquoise-primary: ${theme.colors.turquoisePrimary};
    --turquoise-primary-hover: ${theme.colors.turquoisePrimaryHover};
    --lime-accent: ${theme.colors.limeAccent};
    --lime-accent-hover: ${theme.colors.limeAccentHover};
    --border: ${theme.colors.border};
    --border-dark: ${theme.colors.borderDark};
    --shadow-color: ${theme.colors.shadowColor};
    --radius-sm: ${theme.radius.sm};
    --radius-md: ${theme.radius.md};
    --radius-lg: ${theme.radius.lg};
    --radius-xl: ${theme.radius.xl};
  `;
}

export default theme;

