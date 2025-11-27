'use client';

// My Listings Page
// Zeigt alle eigenen Listings mit Edit/Delete Optionen

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { getMyListings, deleteListing } from '@/lib/api/listings';
import { MyListingCard } from '@/components/listings/MyListingCard';
import { ListingCardSkeleton } from '@/components/listings/ListingCardSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { PackageSearch, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function MyListingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login?redirect=/listings/my');
    return null;
  }

  // React Query: Fetch My Listings
  const {
    data: listingsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-listings', searchValue],
    queryFn: () => getMyListings({ search: searchValue || undefined }),
    enabled: isAuthenticated,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: 'Angebot gelöscht',
        description: 'Dein Angebot wurde erfolgreich gelöscht.',
      });
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Löschen',
        description: error.response?.data?.error || 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
    },
  });

  const listings = listingsData?.data || [];
  const resultCount = listingsData?.pagination?.total || 0;

  const handleDeleteClick = (listingId: string) => {
    setListingToDelete(listingId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (listingToDelete) {
      deleteMutation.mutate(listingToDelete);
    }
  };

  if (authLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Lädt...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meine Angebote</h1>
          <p className="text-muted-foreground">
            Verwalte deine eigenen Angebote und Gesuche
          </p>
        </div>
        <Button asChild>
          <Link href="/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Neues Angebot
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Meine Angebote durchsuchen..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

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
              Deine Angebote konnten nicht geladen werden. Bitte versuche es erneut.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Erneut versuchen</Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && listings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Noch keine Angebote</CardTitle>
            <CardDescription className="mb-6 text-center">
              {searchValue
                ? 'Keine Angebote gefunden, die deiner Suche entsprechen.'
                : 'Erstelle dein erstes Angebot und teile es mit deiner Gemeinschaft!'}
            </CardDescription>
            <Button asChild>
              <Link href="/listings/new">
                <Plus className="h-4 w-4 mr-2" />
                Erstes Angebot erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Listings Grid */}
      {!isLoading && !isError && listings.length > 0 && (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            {listings.length} {listings.length === 1 ? 'Angebot' : 'Angebote'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <MyListingCard
                key={listing.id}
                listing={listing}
                onEdit={(id) => {
                  router.push(`/listings/${id}/edit`);
                }}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Angebot löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du dieses Angebot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

