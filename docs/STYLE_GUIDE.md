# ShareLocal Style Guide

## Übersicht

Dieser Style Guide definiert die visuellen Richtlinien und Best Practices für die ShareLocal-Plattform. Er dient als Referenz für Designer und Entwickler.

**Version**: 1.0.0  
**Letzte Aktualisierung**: 2026-01-XX  
**Status**: ✅ MVP-Implementierung abgeschlossen

---

## Design-Prinzipien

### 1. Minimalismus

- **Viel Weißraum**: Generous spacing zwischen Elementen
- **Fokus auf Inhalt**: Keine unnötigen dekorativen Elemente
- **Klare Hierarchie**: Wichtige Elemente stechen hervor

### 2. Konsistenz

- **Einheitliche Farben**: Immer die definierten CSS-Variablen verwenden
- **Konsistente Abstände**: Tailwind-Spacing-Skala verwenden
- **Einheitliche Typografie**: System Fonts durchgehend

### 3. Accessibility First

- **Touch-Targets**: Mindestens 44x44px auf Mobile
- **Kontrast**: WCAG 2.1 AA Compliance (4.5:1 für normalen Text)
- **Keyboard-Navigation**: Alle interaktiven Elemente per Tastatur erreichbar

### 4. Performance

- **System Fonts**: Keine Font-Downloads
- **Optimierte Animationen**: GPU-accelerated, reduced motion support
- **Lazy Loading**: Bilder und Komponenten lazy laden

---

## Farb-Verwendung

### Primary (Olive Green)

**Verwendung**:
- Haupt-CTAs (Buttons, Links)
- Aktive Navigation-Links
- Badges (Standard)
- Focus-States

**NICHT verwenden für**:
- Hintergründe (zu dominant)
- Große Text-Blöcke
- Subtile Elemente

### Secondary (Warm Beige)

**Verwendung**:
- Card-Hintergründe
- Subtile Hintergründe
- Secondary-Buttons
- Dividers

### Accent (Terracotta)

**Verwendung**:
- Highlights
- Wichtige Aktionen
- Warnungen (optional)

### Status-Farben

- **Success**: Erfolgs-Meldungen, Bestätigungen
- **Error**: Fehler-Meldungen, Destructive Actions
- **Warning**: Warnungen, Vorsicht
- **Info**: Informationen, Hinweise

---

## Typografie-Richtlinien

### Überschriften

- **H1**: Nur einmal pro Seite, für Haupt-Titel
- **H2**: Haupt-Sections
- **H3**: Sub-Sections
- **H4**: Kleine Sections

### Text-Hierarchie

1. **Primary Text** (`--foreground`): Haupt-Inhalt
2. **Secondary Text** (`--muted-foreground`): Unterstützender Text
3. **Tertiary Text** (`--muted`): Meta-Informationen

### Text-Längen

- **Headlines**: Max. 60 Zeichen
- **Body-Text**: Max. 75 Zeichen pro Zeile
- **Mobile**: Max. 50 Zeichen pro Zeile

---

## Spacing-Richtlinien

### Container-Padding

```tsx
// Mobile
<div className="px-4">

// Tablet
<div className="px-4 md:px-6">

// Desktop
<div className="px-4 md:px-6 lg:px-8">
```

### Section-Spacing

```tsx
// Kleine Sections
<section className="py-8">

// Mittlere Sections
<section className="py-12">

// Große Sections
<section className="py-16 md:py-24">
```

### Element-Abstände

- **Kleine Abstände**: `gap-2` (8px) - Icons, Badges
- **Standard-Abstände**: `gap-4` (16px) - Form-Elemente
- **Große Abstände**: `gap-6` (24px) - Cards, Sections

---

## Button-Styling

### Primary Button

```tsx
<Button variant="default" size="default">
  Primary Action
</Button>
```

**Verwendung**:
- Haupt-CTAs
- Form-Submit-Buttons
- Wichtige Aktionen

### Secondary Button

```tsx
<Button variant="secondary">
  Secondary Action
</Button>
```

**Verwendung**:
- Alternative Aktionen
- Cancel-Buttons
- Weniger wichtige Aktionen

### Outline Button

```tsx
<Button variant="outline">
  Outline Action
</Button>
```

**Verwendung**:
- Tertiäre Aktionen
- Alternative zu Secondary

### Destructive Button

```tsx
<Button variant="destructive">
  Löschen
</Button>
```

**Verwendung**:
- Destructive Actions
- Delete-Buttons
- Gefährliche Aktionen

---

## Card-Styling

### Standard Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
  </CardHeader>
  <CardContent>
    Inhalt
  </CardContent>
</Card>
```

**Features**:
- Rounded Corners (`rounded-xl`)
- Subtle Shadow (`shadow-sm`)
- Hover-Effekte (`hover:shadow-lg`)

### Interactive Card

```tsx
<Card className="hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
  ...
</Card>
```

**Verwendung**:
- Klickbare Cards (z.B. ListingCards)
- Navigation-Cards

---

## Form-Styling

### Input-Felder

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>E-Mail</FormLabel>
      <FormControl>
        <Input {...field} type="email" />
      </FormControl>
      <FormDescription>Deine E-Mail-Adresse</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Richtlinien**:
- Immer mit Label
- Hilfetext bei Bedarf
- Error-Messages unter dem Input
- Touch-Targets ≥ 44px auf Mobile

---

## Animation-Richtlinien

### Hover-States

```tsx
// Buttons
hover:bg-[hsl(var(--primary-dark))] active:scale-[0.98]

// Cards
hover:shadow-lg hover:-translate-y-1 transition-all duration-200
```

### Loading-States

```tsx
// Button Loading
<Button isLoading={isLoading}>
  Speichern
</Button>

// Skeleton Loading
<Skeleton className="h-4 w-3/4" />
```

### Page-Transitions

- **Fade-In**: `animate-fade-in` (200ms)
- **Slide-Up**: `animate-slide-up` (300ms)
- **Staggered**: Delay zwischen Elementen (50ms)

---

## Responsive Design

### Mobile-First Approach

```tsx
// Mobile zuerst, dann Desktop
<div className="text-sm md:text-base">
  Text
</div>
```

### Breakpoints

- **sm**: `640px` - Kleine Tablets
- **md**: `768px` - Tablets
- **lg**: `1024px` - Desktop
- **xl**: `1280px` - Große Desktop

### Touch-Targets

```tsx
// Mobile: 44px, Desktop: Standard
<Button className="min-h-[44px] md:h-10 md:min-h-0">
  Button
</Button>
```

---

## Accessibility-Richtlinien

### Focus-States

```tsx
// Sichtbarer Focus-Ring
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### ARIA-Labels

```tsx
// Icon-Buttons
<Button aria-label="Menü öffnen">
  <MenuIcon />
</Button>
```

### Skip-Links

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Zum Hauptinhalt springen
</a>
```

---

## Best Practices

### DO ✅

- ✅ CSS-Variablen für Farben verwenden
- ✅ Tailwind-Spacing-Skala verwenden
- ✅ Semantic HTML verwenden
- ✅ Accessibility-Features implementieren
- ✅ Responsive Design (Mobile-First)
- ✅ System Fonts verwenden
- ✅ Reduced Motion respektieren

### DON'T ❌

- ❌ Hardcoded Farben verwenden
- ❌ Willkürliche Abstände verwenden
- ❌ `<div>` statt semantic HTML
- ❌ Accessibility ignorieren
- ❌ Desktop-First entwickeln
- ❌ Custom Fonts ohne Grund
- ❌ Animationen ohne reduced motion support

---

## Code-Beispiele

### Konsistente Card

```tsx
<Card className="transition-all duration-200 ease-out hover:shadow-lg">
  <CardHeader>
    <CardTitle className="text-lg font-semibold">Titel</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">
      Beschreibung
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button className="w-full">Action</Button>
  </CardFooter>
</Card>
```

### Konsistente Form

```tsx
<Form {...form}>
  <div className="space-y-4">
    <FormField
      control={form.control}
      name="field"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
</Form>
```

---

## Referenzen

- [Design System](./DESIGN_SYSTEM.md)
- [Komponenten-Dokumentation](./COMPONENTS.md)
- [Accessibility Guidelines](./ACCESSIBILITY_GUIDELINES.md)
- [MVP Design Roadmap](./MVP_DESIGN_ROADMAP.md)
