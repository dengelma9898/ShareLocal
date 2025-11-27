# shadcn/ui Setup Guide

## Was ist shadcn/ui?

shadcn/ui ist **keine Dependency**, sondern eine Sammlung von Copy-Paste Komponenten:
- ✅ Du besitzt den Code (100% Kontrolle)
- ✅ Vollständig anpassbar
- ✅ Accessibility-first (Radix UI)
- ✅ Tailwind CSS basiert
- ✅ TypeScript Support

## Setup

### 1. Dependencies installiert ✅

Die notwendigen Dependencies sind bereits installiert:
- `@radix-ui/*` - Accessibility Components
- `class-variance-authority` - Variant Management
- `clsx` + `tailwind-merge` - Class Utilities
- `lucide-react` - Icons
- `tailwindcss-animate` - Animations

### 2. Konfiguration ✅

- `components.json` - shadcn/ui Konfiguration
- `tailwind.config.ts` - Tailwind mit shadcn/ui Theme
- `app/globals.css` - CSS Variables für Theme
- `lib/utils.ts` - `cn()` Utility Function

### 3. Komponenten hinzufügen

```bash
# Mit shadcn CLI (empfohlen)
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add toast

# Oder manuell von https://ui.shadcn.com kopieren
```

### 4. Komponenten verwenden

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function MyComponent() {
  return (
    <Card>
      <Input placeholder="Email" />
      <Button>Submit</Button>
    </Card>
  );
}
```

## Empfohlene Komponenten für Phase 1

### Core Components:
- `button` - Primary, Secondary, Ghost Variants
- `input` - Form Inputs mit Error States
- `label` - Form Labels
- `card` - Container für Content
- `form` - Form Wrapper mit Validation

### Feedback Components:
- `toast` - Notifications
- `alert` - Error/Success Messages
- `dialog` - Modals
- `skeleton` - Loading States

### Navigation:
- `dropdown-menu` - User Menu
- `tabs` - Tab Navigation
- `navigation-menu` - Main Navigation

## Anpassung

Alle Komponenten sind in `components/ui/` und können direkt editiert werden:

```tsx
// components/ui/button.tsx
// Vollständig anpassbar für dein Design System
```

## Theme Customization

Farben können in `app/globals.css` angepasst werden:

```css
:root {
  --primary: 221.2 83.2% 53.3%; /* Blau für ShareLocal */
  --secondary: 210 40% 96.1%;
  /* ... */
}
```

## Best Practices

1. **Komponenten anpassen**: Kopiere Komponenten und passe sie an dein Design an
2. **Variants erweitern**: Füge eigene Variants hinzu (z.B. `size="lg"`)
3. **Composition**: Kombiniere Komponenten für komplexe UI
4. **Accessibility**: shadcn/ui ist bereits accessible, aber prüfe bei Anpassungen

## Dokumentation

- [shadcn/ui Website](https://ui.shadcn.com)
- [Radix UI Docs](https://www.radix-ui.com)
- [Tailwind CSS Docs](https://tailwindcss.com)

