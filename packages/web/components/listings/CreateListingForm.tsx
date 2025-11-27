'use client';

// Create Listing Form Component
// Multi-Step Form mit Validation

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ListingCategory, ListingType } from '@sharelocal/shared';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Validation Schema
const createListingSchema = z.object({
  // Step 1: Basic Info
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein').max(200, 'Titel zu lang'),
  description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein').max(5000, 'Beschreibung zu lang'),
  category: z.enum(['TOOL', 'PLANT', 'SKILL', 'PRODUCT', 'TIME', 'OTHER']),
  type: z.enum(['OFFER', 'REQUEST']),
  
  // Step 2: Details
  location: z.string().max(200, 'Standort zu lang').optional().or(z.literal('')),
  pricePerDay: z.coerce.number().positive('Preis muss positiv sein').optional().or(z.literal(0)),
  currency: z.string().length(3, 'Währung muss 3 Zeichen lang sein (z.B. EUR)').optional().default('EUR'),
  tags: z.array(z.string().max(50, 'Tag zu lang')).max(20, 'Maximal 20 Tags erlaubt').optional().default([]),
});

type CreateListingFormData = z.infer<typeof createListingSchema>;

interface CreateListingFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    category: ListingCategory;
    type: ListingType;
    location?: string;
    pricePerDay?: number;
    currency?: string;
    tags?: string[];
  }) => Promise<void>;
}

const categories: { value: ListingCategory; label: string }[] = [
  { value: 'TOOL', label: 'Werkzeug' },
  { value: 'PLANT', label: 'Pflanze' },
  { value: 'SKILL', label: 'Fähigkeit' },
  { value: 'PRODUCT', label: 'Produkt' },
  { value: 'TIME', label: 'Zeit' },
  { value: 'OTHER', label: 'Sonstiges' },
];

export function CreateListingForm({ onSubmit }: CreateListingFormProps) {
  const [step, setStep] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateListingFormData>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'TOOL',
      type: 'OFFER',
      location: '',
      pricePerDay: undefined,
      currency: 'EUR',
      tags: [],
    },
    mode: 'onChange',
  });

  const watchedValues = form.watch();
  const tags = watchedValues.tags || [];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 20) {
      form.setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue('tags', tags.filter((tag) => tag !== tagToRemove));
  };

  const handleNext = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    let fieldsToValidate: (keyof CreateListingFormData)[] = [];

    if (step === 1) {
      fieldsToValidate = ['title', 'description', 'category', 'type'];
    } else if (step === 2) {
      // In Step 2 sind alle Felder optional, daher keine Validation nötig
      // Wir können direkt zu Step 3 gehen
      setStep(3);
      return;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleFormSubmit = async (data: CreateListingFormData) => {
    // Only submit if we're on step 3
    if (step !== 3) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean up data
      const submitData: {
        title: string;
        description: string;
        category: ListingCategory;
        type: ListingType;
        location?: string;
        pricePerDay?: number;
        currency?: string;
        tags?: string[];
      } = {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
      };

      if (data.currency) {
        submitData.currency = data.currency;
      }

      if (data.location && data.location.trim()) {
        submitData.location = data.location.trim();
      }

      if (data.pricePerDay && data.pricePerDay > 0) {
        submitData.pricePerDay = data.pricePerDay;
      }

      if (data.tags && data.tags.length > 0) {
        submitData.tags = data.tags;
      }

      await onSubmit(submitData);
    } catch (error) {
      // Error wird bereits in der Page-Komponente behandelt
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          // Only submit if we're on step 3
          if (step === 3) {
            form.handleSubmit(handleFormSubmit)(e);
          }
        }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Angebot erstellen</CardTitle>
                <CardDescription>
                  Schritt {step} von 3
                </CardDescription>
              </div>
              {/* Progress Indicator */}
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-2 w-2 rounded-full ${
                      s <= step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger data-testid="listing-type-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OFFER">Angebot (ich biete an)</SelectItem>
                            <SelectItem value="REQUEST">Gesuch (ich suche)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger data-testid="listing-category-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titel</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Akku-Bohrschrauber Bosch Professional"
                          data-testid="listing-title-input"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Kurzer, prägnanter Titel für dein Angebot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Beschreibe dein Angebot detailliert..."
                          className="min-h-[120px]"
                          data-testid="listing-description-input"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Detaillierte Beschreibung hilft anderen, dein Angebot besser zu verstehen
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standort (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Nürnberg, 90402"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Stadt oder Postleitzahl, damit andere wissen, wo das Angebot verfügbar ist
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pricePerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preis pro Tag (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Leer lassen für kostenlos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Währung</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="tags"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tags (optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Tag hinzufügen..."
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTag();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleAddTag}
                              disabled={!tagInput.trim() || tags.length >= 20}
                            >
                              Hinzufügen
                            </Button>
                          </div>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                          <FormDescription>
                            Tags helfen anderen, dein Angebot leichter zu finden (max. 20)
                          </FormDescription>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Vorschau</h3>
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{watchedValues.title || 'Titel'}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge>
                              {categories.find((c) => c.value === watchedValues.category)?.label || 'Kategorie'}
                            </Badge>
                            <Badge variant={watchedValues.type === 'OFFER' ? 'default' : 'secondary'}>
                              {watchedValues.type === 'OFFER' ? 'Angebot' : 'Gesuch'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {watchedValues.description || 'Beschreibung'}
                      </p>
                      {watchedValues.location && (
                        <p className="text-sm text-muted-foreground mt-4">
                          📍 {watchedValues.location}
                        </p>
                      )}
                      {watchedValues.pricePerDay && watchedValues.pricePerDay > 0 ? (
                        <p className="text-sm font-semibold mt-2">
                          💶 {watchedValues.pricePerDay.toFixed(2)} {watchedValues.currency}/Tag
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">Kostenlos</p>
                      )}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>

            {step < 3 ? (
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNext(e);
                }}
              >
                Weiter
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="listing-submit-button"
                onClick={(e) => {
                  // Ensure form submission
                  e.preventDefault();
                  form.handleSubmit(handleFormSubmit)(e);
                }}
              >
                {isSubmitting ? 'Wird erstellt...' : 'Angebot veröffentlichen'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

