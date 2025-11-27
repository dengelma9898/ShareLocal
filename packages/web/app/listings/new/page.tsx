'use client';

// Create Listing Page
// Multi-Step Form zum Erstellen eines neuen Listings

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createListing } from '@/lib/api/listings';
import { useToast } from '@/hooks/use-toast';
import { ListingCategory, ListingType } from '@sharelocal/shared';
import { CreateListingForm } from '@/components/listings/CreateListingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateListingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login?redirect=/listings/new');
    return null;
  }

  const handleSubmit = async (data: {
    title: string;
    description: string;
    category: ListingCategory;
    type: ListingType;
    location?: string;
    pricePerDay?: number;
    currency?: string;
    tags?: string[];
  }) => {
    try {
      // Ensure currency is set if pricePerDay is provided
      const listingData = {
        ...data,
        currency: data.currency || (data.pricePerDay ? 'EUR' : undefined),
      };
      const listing = await createListing(listingData);
      toast({
        title: 'Angebot erstellt!',
        description: 'Dein Angebot wurde erfolgreich veröffentlicht.',
      });
      router.push(`/listings/${listing.id}`);
    } catch (error: any) {
      toast({
        title: 'Fehler beim Erstellen',
        description: error.response?.data?.error || 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (authLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Lädt...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/listings">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Angeboten
        </Link>
      </Button>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Neues Angebot erstellen</h1>
        <p className="text-muted-foreground">
          Teile deine Ressourcen mit deiner Gemeinschaft
        </p>
      </div>

      {/* Form */}
      <CreateListingForm onSubmit={handleSubmit} />
    </div>
  );
}

