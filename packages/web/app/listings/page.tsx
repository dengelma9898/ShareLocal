'use client';

// Listing Discovery Page
// Zeigt alle verfügbaren Listings mit Filter-Optionen

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getListings, ListingFilters } from '@/lib/api/listings';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardSkeleton } from '@/components/listings/ListingCardSkeleton';
import { ListingFilters as FiltersComponent } from '@/components/listings/ListingFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackageSearch } from 'lucide-react';
import Link from 'next/link';

export default function ListingsPage() {
  const [filters, setFilters] = useState<ListingFilters>({});

  // React Query: Fetch Listings
  const {
    data: listingsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => getListings(filters),
  });

  const listings = listingsData?.data || [];
  const resultCount = listingsData?.pagination?.total || 0;

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8" data-testid="listings-page-header">
        <h1 className="text-3xl font-bold mb-2">Angebote entdecken</h1>
        <p className="text-muted-foreground">
          Finde Ressourcen in deiner lokalen Gemeinschaft oder biete selbst etwas an.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-1">
          <FiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={resultCount}
          />
        </aside>

        {/* Listing Grid */}
        <div className="lg:col-span-3">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Card>
              <CardHeader>
                <CardTitle>Fehler beim Laden</CardTitle>
                <CardDescription>
                  Die Angebote konnten nicht geladen werden. Bitte versuche es erneut.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => refetch()}>Erneut versuchen</Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !isError && listings.length === 0 && (
            <Card data-testid="listings-empty-state">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">Keine Angebote gefunden</CardTitle>
                <CardDescription className="mb-6 text-center">
                  {Object.keys(filters).length > 0
                    ? 'Versuche es mit anderen Filtern oder erstelle selbst ein Angebot.'
                    : 'Sei der Erste und erstelle ein Angebot für deine Gemeinschaft!'}
                </CardDescription>
                <div className="flex gap-4">
                  {Object.keys(filters).length > 0 && (
                    <Button variant="outline" onClick={() => setFilters({})}>
                      Filter zurücksetzen
                    </Button>
                  )}
                  <Button asChild>
                    <Link href="/listings/new">Angebot erstellen</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Listings Grid */}
          {!isLoading && !isError && listings.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="listings-grid">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination (später) */}
              {listingsData?.pagination && listingsData.pagination.totalPages > 1 && (
                <div className="mt-8 text-center text-sm text-muted-foreground">
                  Seite {listingsData.pagination.page || 1} von{' '}
                  {listingsData.pagination.totalPages}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

