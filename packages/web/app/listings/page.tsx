'use client';

// Listing Discovery Page
// Zeigt alle verfügbaren Listings mit Filter-Optionen

import { useState, useEffect } from 'react';
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
  const [hasError, setHasError] = useState(false);

  // React Query: Fetch Listings
  const {
    data: listingsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => getListings(filters),
  });

  // Track error state - set to true when error occurs, reset only on successful fetch
  useEffect(() => {
    if (isError) {
      setHasError(true);
    } else if (listingsData && !isFetching) {
      // Reset error state only when we have data and fetch is complete
      setHasError(false);
    }
  }, [isError, listingsData, isFetching]);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filter Sidebar - Sichtbar ab Tablet */}
        <aside className="md:col-span-1">
          <FiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={resultCount}
          />
        </aside>

          {/* Listing Grid */}
          <div className="md:col-span-3">
            {/* Error State - hat absolute Priorität, bleibt IMMER sichtbar auch während Refetch */}
            {hasError && (
              <Card>
                <CardHeader>
                  <CardTitle>Fehler beim Laden</CardTitle>
                  <CardDescription>
                    Die Angebote konnten nicht geladen werden. Bitte versuche es erneut.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => refetch()} 
                    isLoading={isFetching}
                    aria-busy={isFetching}
                    aria-label={isFetching ? 'Wird geladen...' : 'Erneut versuchen'}
                  >
                    Erneut versuchen
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading State - nur wenn KEIN Fehler und initiales Laden */}
            {!hasError && isLoading && !isFetching && (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                aria-busy="true"
                aria-live="polite"
                aria-label="Angebote werden geladen"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <ListingCardSkeleton />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State - nur wenn KEIN Fehler */}
            {!hasError && !isLoading && listings.length === 0 && (
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

            {/* Listings Grid - nur wenn KEIN Fehler */}
            {!hasError && !isLoading && listings.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="listings-grid">
                  {listings.map((listing, index) => (
                    <div 
                      key={listing.id}
                      className="animate-slide-up" 
                      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                    >
                      <ListingCard listing={listing} />
                    </div>
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

