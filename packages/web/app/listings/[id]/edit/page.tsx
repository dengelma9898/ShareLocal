'use client';

// Edit Listing Page
// Bearbeitet ein bestehendes Listing

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { getListing, updateListing } from '@/lib/api/listings';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Listing, ListingCategory } from '@sharelocal/shared';
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
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein').max(200, 'Titel zu lang'),
  description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein').max(5000, 'Beschreibung zu lang'),
  category: z.enum(['TOOL', 'PLANT', 'SKILL', 'PRODUCT', 'TIME', 'OTHER']),
  type: z.enum(['OFFER', 'REQUEST']),
  location: z.string().max(200, 'Standort zu lang').optional().or(z.literal('')),
  pricePerDay: z.coerce.number().positive('Preis muss positiv sein').optional().or(z.literal(0)),
  currency: z.string().length(3, 'Währung muss 3 Zeichen lang sein (z.B. EUR)').optional(),
  tags: z.array(z.string().max(50, 'Tag zu lang')).max(20, 'Maximal 20 Tags erlaubt').optional().default([]),
});

type CreateListingFormData = z.infer<typeof createListingSchema>;

const categories: { value: ListingCategory; label: string }[] = [
  { value: 'TOOL', label: 'Werkzeug' },
  { value: 'PLANT', label: 'Pflanze' },
  { value: 'SKILL', label: 'Fähigkeit' },
  { value: 'PRODUCT', label: 'Produkt' },
  { value: 'TIME', label: 'Zeit' },
  { value: 'OTHER', label: 'Sonstiges' },
];

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/listings/${listingId}/edit`);
    }
  }, [authLoading, isAuthenticated, router, listingId]);

  // Fetch listing data
  const {
    data: listingData,
    isLoading: isLoadingListing,
    isError: isErrorListing,
    error: listingError,
  } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListing(listingId),
    enabled: !!listingId && isAuthenticated,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateListingFormData) => updateListing(listingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: 'Angebot aktualisiert!',
        description: 'Dein Angebot wurde erfolgreich bearbeitet.',
      });
      router.push(`/listings/${listingId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Aktualisieren',
        description: error.response?.data?.error || 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
    },
  });

  // Check if user is the owner
  useEffect(() => {
    if (listingData && user && listingData.userId !== user.id) {
      toast({
        title: 'Zugriff verweigert',
        description: 'Du kannst nur deine eigenen Angebote bearbeiten.',
        variant: 'destructive',
      });
      router.push(`/listings/${listingId}`);
    }
  }, [listingData, user, router, listingId, toast]);

  const handleSubmit = async (data: CreateListingFormData) => {
    try {
      const listingData = {
        ...data,
        currency: data.currency || (data.pricePerDay ? 'EUR' : undefined),
      };
      await updateMutation.mutateAsync(listingData);
    } catch (error) {
      // Error is handled by mutation
      throw error;
    }
  };

  if (authLoading || isLoadingListing) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isErrorListing) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Fehler beim Laden</h2>
              <p className="text-muted-foreground mb-4">
                {listingError instanceof Error
                  ? listingError.message
                  : 'Das Angebot konnte nicht geladen werden.'}
              </p>
              <Button onClick={() => router.push('/listings/my')}>Zurück zu Meine Angebote</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!listingData) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Angebot nicht gefunden</h2>
              <p className="text-muted-foreground mb-4">Das angeforderte Angebot existiert nicht.</p>
              <Button onClick={() => router.push('/listings/my')}>Zurück zu Meine Angebote</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check ownership (client-side check)
  if (user && listingData.userId !== user.id) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href={`/listings/${listingId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zum Angebot
        </Link>
      </Button>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Angebot bearbeiten</h1>
        <p className="text-muted-foreground">
          Aktualisiere die Details deines Angebots
        </p>
      </div>

      {/* Form */}
      <EditListingForm listing={listingData} onSubmit={handleSubmit} isSubmitting={updateMutation.isPending} />
    </div>
  );
}

// Edit Listing Form Component
interface EditListingFormProps {
  listing: Listing;
  onSubmit: (data: CreateListingFormData) => Promise<void>;
  isSubmitting: boolean;
}

function EditListingForm({ listing, onSubmit, isSubmitting }: EditListingFormProps) {
  const [step, setStep] = useState(1);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<CreateListingFormData>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: listing.title,
      description: listing.description || '',
      category: listing.category,
      type: listing.type,
      location: listing.location || '',
      pricePerDay: listing.pricePerDay || 0,
      currency: listing.currency || 'EUR',
      tags: listing.tags || [],
    },
  });

  const tags = form.watch('tags');
  const watchedValues = form.watch();

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (tags && !tags.includes(newTag) && tags.length < 20) {
        form.setValue('tags', [...tags, newTag]);
        setTagInput('');
      }
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
    if (step !== 3) {
      return;
    }
    try {
      const submitData: CreateListingFormData = {
        ...data,
        location: data.location || undefined,
        pricePerDay: data.pricePerDay && data.pricePerDay > 0 ? data.pricePerDay : undefined,
        currency: data.currency || undefined,
        tags: data.tags && data.tags.length > 0 ? data.tags : ([] as string[]),
      };
      await onSubmit(submitData);
    } catch (error) {
      // Error is handled by parent
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(handleFormSubmit)(e);
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Angebot bearbeiten</CardTitle>
            <CardDescription>
              Schritt {step} von 3: {step === 1 ? 'Grundinformationen' : step === 2 ? 'Details' : 'Vorschau'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wähle einen Typ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="OFFER">Angebot</SelectItem>
                          <SelectItem value="REQUEST">Gesuch</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wähle eine Kategorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="z.B. Akku-Bohrschrauber zu verleihen" {...field} />
                      </FormControl>
                      <FormDescription>Ein aussagekräftiger Titel hilft anderen Nutzern</FormDescription>
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
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Je detaillierter, desto besser</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standort (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Nürnberg, Maxfeld" {...field} />
                      </FormControl>
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
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value || 'EUR'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tags (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tag eingeben und Enter drücken"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                        />
                      </FormControl>
                      <FormDescription>Maximal 20 Tags, drücke Enter zum Hinzufügen</FormDescription>
                      {tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">Vorschau</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Typ:</span> {watchedValues.type === 'OFFER' ? 'Angebot' : 'Gesuch'}
                    </p>
                    <p>
                      <span className="font-medium">Kategorie:</span>{' '}
                      {categories.find((c) => c.value === watchedValues.category)?.label}
                    </p>
                    <p>
                      <span className="font-medium">Titel:</span> {watchedValues.title}
                    </p>
                    <p>
                      <span className="font-medium">Beschreibung:</span> {watchedValues.description}
                    </p>
                    {watchedValues.location && (
                      <p>
                        <span className="font-medium">Standort:</span> {watchedValues.location}
                      </p>
                    )}
                    {watchedValues.pricePerDay && watchedValues.pricePerDay > 0 && (
                      <p>
                        <span className="font-medium">Preis:</span> {watchedValues.pricePerDay.toFixed(2)}{' '}
                        {watchedValues.currency || 'EUR'} / Tag
                      </p>
                    )}
                    {tags && tags.length > 0 && (
                      <p>
                        <span className="font-medium">Tags:</span> {tags.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1}>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
