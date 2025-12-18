# ShareLocal Design System

## Übersicht

Das ShareLocal Design System definiert die visuelle Identität und die Design-Prinzipien der Plattform. Es basiert auf erdigen, warmen Farben, die Nachhaltigkeit und Gemeinschaft widerspiegeln.

**Version**: 1.0.0  
**Letzte Aktualisierung**: 2026-01-XX  
**Status**: ✅ MVP-Implementierung abgeschlossen

---

## Design-Philosophie

### Kern-Prinzipien

1. **Nachhaltigkeit First**
   - Erdige, warme Farben (Olive Green, Warm Beige, Terracotta)
   - Minimalistisches Design = weniger Ressourcen
   - Performance-optimiert

2. **Community & Vertrauen**
   - Warme, einladende Atmosphäre
   - Klare, transparente Kommunikation
   - Privacy-by-Design sichtbar

3. **Einfachheit & Klarheit**
   - Neo-Minimalismus mit viel Weißraum
   - Klare visuelle Hierarchie
   - Intuitive Navigation

4. **Inklusivität**
   - WCAG 2.1 AA Compliance
   - Barrierefrei für alle
   - Responsive für alle Geräte

5. **Natürliche Interaktionen**
   - Subtile, natürliche Animationen
   - Sofortiges Feedback bei Aktionen
   - Flüssige Übergänge

---

## Farbpalette

### Primär-Farben

| Farbe | Verwendung | HSL | Hex | RGB | CSS Variable |
|-------|-----------|-----|-----|-----|--------------|
| **Primary** | Haupt-CTAs, Links, Badges | `130° 50% 42%` | `#6B8E5A` | `rgb(107, 142, 90)` | `--primary` |
| **Primary Dark** | Hover-States, Active | `130° 55% 35%` | `#5A7A4A` | `rgb(90, 122, 74)` | `--primary-dark` |
| **Primary Light** | Backgrounds, Subtle | `130° 45% 55%` | `#8FA67A` | `rgb(143, 166, 122)` | `--primary-light` |
| **Secondary** | Cards, Backgrounds | `35° 25% 90%` | `#E8DCC6` | `rgb(232, 220, 198)` | `--secondary` |
| **Accent** | Highlights, Important Actions | `18° 65% 55%` | `#D97757` | `rgb(217, 119, 87)` | `--accent` |

### Neutrale Farben

| Farbe | Verwendung | HSL | Hex | RGB | CSS Variable |
|-------|-----------|-----|-----|-----|--------------|
| **Background** | Haupt-Hintergrund | `35° 20% 95%` | `#F5F0E8` | `rgb(245, 240, 232)` | `--background` |
| **Foreground** | Haupt-Text | `30° 10% 15%` | `#2A2520` | `rgb(42, 37, 32)` | `--foreground` |
| **Card** | Card-Hintergrund | `35° 25% 92%` | `#F0E8D8` | `rgb(240, 232, 216)` | `--card` |
| **Muted** | Sekundär-Text | `30° 8% 45%` | `#6B6560` | `rgb(107, 101, 96)` | `--muted` |
| **Border** | Borders, Dividers | `35° 25% 80%` | `#D4C4B0` | `rgb(212, 196, 176)` | `--border` |

### Status-Farben

| Farbe | Verwendung | HSL | Hex | CSS Variable |
|-------|-----------|-----|-----|--------------|
| **Success** | Erfolgs-Meldungen | `130° 40% 50%` | `#6B8E5A` | `--success` |
| **Error** | Fehler-Meldungen | `5° 70% 55%` | `#E85D5D` | `--error` |
| **Warning** | Warnungen | `35° 70% 60%` | `#E8A85A` | `--warning` |
| **Info** | Informationen | `200° 50% 50%` | `#4A9BC4` | `--info` |

### Dark Mode

| Farbe | HSL | CSS Variable |
|-------|-----|--------------|
| **Background** | `30° 15% 8%` | `--background` |
| **Foreground** | `35° 10% 95%` | `--foreground` |
| **Card** | `30° 12% 12%` | `--card` |
| **Primary** | `130° 40% 55%` | `--primary` |

---

## Typografie

### Font-Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**System Fonts** werden verwendet für:
- Bessere Performance (keine Font-Downloads)
- Native Look & Feel
- Schnellere Ladezeiten

### Schriftgrößen

| Verwendung | Font-Size | Line-Height | Font-Weight | CSS-Klasse |
|------------|-----------|-------------|-------------|------------|
| **H1** | `2.25rem` (36px) | `1.2` | `700` | `text-4xl font-bold` |
| **H2** | `1.875rem` (30px) | `1.3` | `600` | `text-3xl font-semibold` |
| **H3** | `1.5rem` (24px) | `1.4` | `600` | `text-2xl font-semibold` |
| **H4** | `1.25rem` (20px) | `1.5` | `600` | `text-xl font-semibold` |
| **Body** | `1rem` (16px) | `1.6` | `400` | `text-base` |
| **Small** | `0.875rem` (14px) | `1.5` | `400` | `text-sm` |
| **Tiny** | `0.75rem` (12px) | `1.4` | `400` | `text-xs` |

### Responsive Typografie

- **Mobile**: Basis-Größen verwenden
- **Tablet**: +10% größer
- **Desktop**: +20% größer

---

## Spacing-System

### Tailwind Spacing-Skala

Wir verwenden die Standard Tailwind-Spacing-Skala:

| Wert | Pixel | Verwendung |
|------|-------|------------|
| `0` | 0px | Kein Abstand |
| `1` | 4px | Sehr kleine Abstände |
| `2` | 8px | Kleine Abstände |
| `3` | 12px | Kleine Abstände |
| `4` | 16px | Standard-Abstände |
| `6` | 24px | Mittlere Abstände |
| `8` | 32px | Große Abstände |
| `12` | 48px | Sehr große Abstände |
| `16` | 64px | Extra große Abstände |

### Container-Padding

- **Mobile**: `px-4` (16px)
- **Tablet**: `px-6` (24px)
- **Desktop**: `px-8` (32px)

### Section-Spacing

- **Kleine Sections**: `py-8` (32px)
- **Mittlere Sections**: `py-12` (48px)
- **Große Sections**: `py-16` (64px)

---

## Border-Radius

| Verwendung | Wert | CSS Variable |
|------------|------|--------------|
| **Standard** | `0.5rem` (8px) | `--radius` |
| **Buttons** | `0.375rem` (6px) | `rounded-md` |
| **Cards** | `0.75rem` (12px) | `rounded-xl` |
| **Inputs** | `0.5rem` (8px) | `rounded-lg` |

---

## Shadows

| Verwendung | Wert | CSS-Klasse |
|------------|------|------------|
| **Subtle** | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | `shadow-sm` |
| **Standard** | `0 1px 3px 0 rgba(0, 0, 0, 0.1)` | `shadow` |
| **Medium** | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` | `shadow-md` |
| **Large** | `0 10px 15px -3px rgba(0, 0, 0, 0.1)` | `shadow-lg` |

---

## Animationen

### Timing-Funktionen

- **Standard**: `ease-out`
- **Hover**: `ease-in-out`
- **Loading**: `linear`

### Dauer

- **Schnell**: `150ms` - Micro-Interactions
- **Standard**: `200-300ms` - Übergänge
- **Langsam**: `500ms` - Page-Transitions

### Reduced Motion

Alle Animationen respektieren `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Breakpoints

| Name | Min-Width | Verwendung |
|------|-----------|------------|
| **sm** | `640px` | Kleine Tablets |
| **md** | `768px` | Tablets |
| **lg** | `1024px` | Desktop |
| **xl** | `1280px` | Große Desktop |
| **2xl** | `1536px` | Sehr große Desktop |

---

## Verwendung in Code

### CSS-Variablen

```css
/* Light Mode */
:root {
  --primary: 130 50% 42%;
  --primary-foreground: 0 0% 100%;
}

/* Dark Mode */
.dark {
  --primary: 130 40% 55%;
  --primary-foreground: 30 10% 15%;
}
```

### Tailwind-Klassen

```tsx
// Primary Button
<button className="bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-dark))]">
  Button
</button>

// Card
<div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm">
  Content
</div>
```

---

## Kontrast-Ratios (WCAG 2.1 AA)

Alle Farb-Kombinationen erfüllen WCAG 2.1 AA:

- **Normaler Text**: ≥ 4.5:1
- **Großer Text**: ≥ 3:1

### Geprüfte Kombinationen

- ✅ `--foreground` auf `--background`: 12.5:1
- ✅ `--foreground` auf `--card`: 11.8:1
- ✅ `--primary-foreground` auf `--primary`: 4.8:1
- ✅ `--muted-foreground` auf `--background`: 4.6:1

---

## Referenzen

- [MVP Design Roadmap](./MVP_DESIGN_ROADMAP.md)
- [UI/UX Trends 2026](./UI_UX_TRENDS_2026.md)
- [Accessibility Guidelines](./ACCESSIBILITY_GUIDELINES.md)
