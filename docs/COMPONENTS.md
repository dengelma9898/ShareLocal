# ShareLocal Komponenten-Dokumentation

## Übersicht

Diese Dokumentation beschreibt alle UI-Komponenten im ShareLocal Design System. Alle Komponenten basieren auf **shadcn/ui** und **Radix UI** für Accessibility.

**Basis**: shadcn/ui + Radix UI  
**Styling**: Tailwind CSS  
**Status**: ✅ MVP-Implementierung abgeschlossen

---

## Basis-Komponenten

### Button

**Datei**: `packages/web/components/ui/button.tsx`

**Variants**:
- `default` - Primary Button (Olive Green)
- `destructive` - Destructive Actions (Rot)
- `outline` - Outline Button
- `secondary` - Secondary Button (Beige)
- `ghost` - Ghost Button
- `link` - Link-Button

**Sizes**:
- `default` - Standard-Größe (44px auf Mobile)
- `sm` - Klein
- `lg` - Groß
- `icon` - Icon-Button (44x44px auf Mobile)

**Features**:
- ✅ Loading-State mit Spinner
- ✅ Hover/Active-Animationen
- ✅ Focus-States für Accessibility
- ✅ Touch-Targets ≥ 44x44px auf Mobile

**Beispiel**:
```tsx
<Button variant="default" size="default" isLoading={isLoading}>
  Klicken
</Button>
```

---

### Card

**Datei**: `packages/web/components/ui/card.tsx`

**Komponenten**:
- `Card` - Container
- `CardHeader` - Header-Bereich
- `CardTitle` - Titel
- `CardDescription` - Beschreibung
- `CardContent` - Haupt-Inhalt
- `CardFooter` - Footer-Bereich

**Features**:
- ✅ Hover-Effekte (shadow-lg, translate-y)
- ✅ Rounded Corners (rounded-xl)
- ✅ Responsive Padding

**Beispiel**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
    <CardDescription>Beschreibung</CardDescription>
  </CardHeader>
  <CardContent>
    Inhalt
  </CardContent>
  <CardFooter>
    Footer
  </CardFooter>
</Card>
```

---

### Input

**Datei**: `packages/web/components/ui/input.tsx`

**Features**:
- ✅ Touch-Targets ≥ 44px auf Mobile
- ✅ Focus-States für Accessibility
- ✅ Transition-Animationen
- ✅ Rounded Corners (rounded-lg)

**Beispiel**:
```tsx
<Input
  type="text"
  placeholder="Eingabe..."
  className="h-11 min-h-[44px] md:h-10 md:min-h-0"
/>
```

---

### Textarea

**Datei**: `packages/web/components/ui/textarea.tsx`

**Features**:
- ✅ Touch-Targets ≥ 44px auf Mobile
- ✅ Focus-States für Accessibility
- ✅ Transition-Animationen
- ✅ Min-Height für bessere UX

**Beispiel**:
```tsx
<Textarea
  placeholder="Mehrzeilige Eingabe..."
  className="min-h-[80px]"
/>
```

---

### Select

**Datei**: `packages/web/components/ui/select.tsx`

**Komponenten**:
- `SelectTrigger` - Trigger-Button
- `SelectContent` - Dropdown-Content
- `SelectItem` - Einzelnes Item
- `SelectValue` - Angezeigter Wert

**Features**:
- ✅ Touch-Targets ≥ 44px auf Mobile
- ✅ Keyboard-Navigation (Arrow-Keys)
- ✅ Focus-States für Accessibility
- ✅ Rounded Corners

**Beispiel**:
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Auswählen..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

### Label

**Datei**: `packages/web/components/ui/label.tsx`

**Features**:
- ✅ Konsistente Spacing (mb-2)
- ✅ Block-Display
- ✅ Focus-States für Accessibility

**Beispiel**:
```tsx
<Label htmlFor="input-id">
  Label-Text
</Label>
```

---

### Badge

**Datei**: `packages/web/components/ui/badge.tsx`

**Variants**:
- `default` - Standard Badge
- `secondary` - Secondary Badge
- `destructive` - Destructive Badge
- `outline` - Outline Badge

**Features**:
- ✅ Rounded Corners
- ✅ Hover-States
- ✅ Border-Styling

**Beispiel**:
```tsx
<Badge variant="default">Badge</Badge>
```

---

## Dialog & Modal Komponenten

### Dialog

**Datei**: `packages/web/components/ui/dialog.tsx`

**Komponenten**:
- `Dialog` - Root-Component
- `DialogTrigger` - Trigger-Button
- `DialogContent` - Modal-Content
- `DialogHeader` - Header-Bereich
- `DialogTitle` - Titel
- `DialogDescription` - Beschreibung
- `DialogFooter` - Footer-Bereich
- `DialogClose` - Close-Button

**Features**:
- ✅ Focus-Trap in Modal
- ✅ Escape-Key zum Schließen
- ✅ Backdrop-Blur
- ✅ Animationen (fade-in, zoom-in)
- ✅ Accessibility (ARIA-Labels)

**Beispiel**:
```tsx
<Dialog>
  <DialogTrigger>Öffnen</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Titel</DialogTitle>
      <DialogDescription>Beschreibung</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>OK</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Sheet (Mobile Navigation)

**Datei**: `packages/web/components/ui/sheet.tsx`

**Komponenten**:
- `Sheet` - Root-Component
- `SheetTrigger` - Trigger-Button
- `SheetContent` - Slide-In Content
- `SheetHeader` - Header-Bereich
- `SheetTitle` - Titel
- `SheetDescription` - Beschreibung
- `SheetFooter` - Footer-Bereich

**Features**:
- ✅ Slide-In Animationen
- ✅ Focus-Trap
- ✅ Escape-Key zum Schließen
- ✅ Responsive (Mobile/Desktop)

**Beispiel**:
```tsx
<Sheet>
  <SheetTrigger>Menü</SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Titel</SheetTitle>
    </SheetHeader>
    Content
  </SheetContent>
</Sheet>
```

---

## Form-Komponenten

### Form (React Hook Form Integration)

**Datei**: `packages/web/components/ui/form.tsx`

**Komponenten**:
- `Form` - Root-Component (React Hook Form)
- `FormField` - Field-Wrapper
- `FormItem` - Item-Container
- `FormLabel` - Label
- `FormControl` - Control-Wrapper
- `FormDescription` - Hilfetext
- `FormMessage` - Error-Message

**Features**:
- ✅ React Hook Form Integration
- ✅ Zod-Validation
- ✅ Accessibility (aria-describedby, aria-invalid)
- ✅ Error-Handling

**Beispiel**:
```tsx
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>E-Mail</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormDescription>Deine E-Mail-Adresse</FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

---

## Feedback-Komponenten

### Alert

**Datei**: `packages/web/components/ui/alert.tsx`

**Variants**:
- `default` - Standard Alert
- `destructive` - Error Alert

**Komponenten**:
- `Alert` - Container
- `AlertTitle` - Titel
- `AlertDescription` - Beschreibung

**Features**:
- ✅ Role="alert" für Screen-Reader
- ✅ Icon-Support
- ✅ Destructive-Variant mit besserem Kontrast

**Beispiel**:
```tsx
<Alert variant="destructive">
  <AlertTitle>Fehler</AlertTitle>
  <AlertDescription>Etwas ist schiefgelaufen.</AlertDescription>
</Alert>
```

---

### Toast

**Datei**: `packages/web/components/ui/toast.tsx`

**Features**:
- ✅ Auto-Dismiss
- ✅ Animationen
- ✅ Multiple Toasts
- ✅ Accessibility

**Beispiel**:
```tsx
import { toast } from '@/hooks/use-toast';

toast({
  title: "Erfolg",
  description: "Aktion erfolgreich ausgeführt.",
});
```

---

### Skeleton

**Datei**: `packages/web/components/ui/skeleton.tsx`

**Features**:
- ✅ Loading-State Placeholder
- ✅ Subtle Animation
- ✅ Responsive

**Beispiel**:
```tsx
<Skeleton className="h-4 w-3/4" />
```

---

## Layout-Komponenten

### Header

**Datei**: `packages/web/components/layout/Header.tsx`

**Features**:
- ✅ Sticky Header
- ✅ Responsive Navigation
- ✅ User-Menu
- ✅ Messages-Badge
- ✅ Mobile Navigation (Sheet)

---

### Footer

**Datei**: `packages/web/components/layout/Footer.tsx`

**Features**:
- ✅ Responsive Grid-Layout
- ✅ Links mit Hover-States
- ✅ Privacy-Link prominent

---

### MobileNav

**Datei**: `packages/web/components/layout/MobileNav.tsx`

**Features**:
- ✅ Sheet-basierte Navigation
- ✅ User-Info
- ✅ Navigation-Links
- ✅ Logout-Button

---

## Listing-Komponenten

### ListingCard

**Datei**: `packages/web/components/listings/ListingCard.tsx`

**Features**:
- ✅ Hover-Effekte (shadow-lg, translate-y)
- ✅ Category-Badges
- ✅ Type-Badges (Angebot/Gesuch)
- ✅ Owner-Info
- ✅ Price-Display
- ✅ Tags
- ✅ Focus-States für Accessibility

---

### MyListingCard

**Datei**: `packages/web/components/listings/MyListingCard.tsx`

**Features**:
- ✅ Management-Buttons (Bearbeiten, Löschen)
- ✅ Availability-Status
- ✅ View-Details-Button

---

### CreateListingForm

**Datei**: `packages/web/components/listings/CreateListingForm.tsx`

**Features**:
- ✅ Multi-Step Form
- ✅ Image-Upload
- ✅ Zod-Validation
- ✅ Error-Handling
- ✅ Responsive Layout (2 Spalten auf Tablet/Desktop)

---

## Accessibility-Features

Alle Komponenten haben:

- ✅ **Keyboard-Navigation**: Tab, Enter, Space, Escape
- ✅ **Focus-States**: Sichtbare Focus-Indikatoren
- ✅ **ARIA-Labels**: Für Screen-Reader
- ✅ **Semantic HTML**: Korrekte HTML-Tags
- ✅ **Touch-Targets**: ≥ 44x44px auf Mobile

---

## Verwendung

### Import

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
```

### Styling

Alle Komponenten verwenden Tailwind CSS und CSS-Variablen:

```tsx
<Button className="bg-primary text-primary-foreground">
  Button
</Button>
```

---

## Referenzen

- [Design System](./DESIGN_SYSTEM.md)
- [Style Guide](./STYLE_GUIDE.md)
- [Accessibility Guidelines](./ACCESSIBILITY_GUIDELINES.md)
- [shadcn/ui Dokumentation](https://ui.shadcn.com/)
