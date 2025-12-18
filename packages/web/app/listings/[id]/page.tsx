'use client';

// Listing Detail Page
// Zeigt alle Details eines einzelnen Listings

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getListing } from '@/lib/api/listings';
import { createConversation } from '@/lib/api/conversations';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardSkeleton } from '@/components/listings/ListingCardSkeleton';
import { OwnerCard } from '@/components/listings/OwnerCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Euro, Calendar, Package, ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ListingCategory } from '@sharelocal/shared';

// Kategorie Labels
const categoryLabels: Record<ListingCategory, string> = {
  TOOL: 'Werkzeug',
  PLANT: 'Pflanze',
  SKILL: 'Fähigkeit',
  PRODUCT: 'Produkt',
  TIME: 'Zeit',
  OTHER: 'Sonstiges',
};

// Kategorie Farben
const categoryColors: Record<ListingCategory, string> = {
  TOOL: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  PLANT: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  SKILL: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  PRODUCT: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  TIME: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
  OTHER: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (participantIds: string[]) =>
      createConversation({
        listingId: id,
        participantIds,
      }),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/conversations/${conversation.id}`);
      toast({
        title: 'Konversation gestartet',
        description: 'Du kannst jetzt mit dem Anbieter chatten.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Konversation konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    },
  });

  const handleContactClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/listings/${id}`);
      return;
    }

    if (!user || !listing?.owner) {
      toast({
        title: 'Fehler',
        description: 'Benutzerinformationen fehlen.',
        variant: 'destructive',
      });
      return;
    }

    // Don't allow contacting yourself
    if (user.id === listing.owner.id) {
      toast({
        title: 'Hinweis',
        description: 'Du kannst dir selbst keine Nachricht senden.',
        variant: 'default',
      });
      return;
    }

    // Create conversation with listing owner
    createConversationMutation.mutate([user.id, listing.owner.id]);
  };

  // React Query: Fetch Listing
  const {
    data: listing,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id),
  });

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-3/4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Listing nicht gefunden</CardTitle>
            <CardDescription>
              Das angeforderte Listing existiert nicht oder wurde gelöscht.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button asChild>
              <Link href="/listings">Zurück zu Angeboten</Link>
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Zurück
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryColor = categoryColors[listing.category] || categoryColors.OTHER;
  const categoryLabel = categoryLabels[listing.category] || 'Sonstiges';

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zurück
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <div className="relative w-full aspect-video bg-muted rounded-t-lg overflow-hidden">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <div className="text-lg">Kein Bild verfügbar</div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Listing Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{listing.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={`border ${categoryColor}`}>{categoryLabel}</Badge>
                    <Badge variant={listing.type === 'OFFER' ? 'default' : 'secondary'}>
                      {listing.type === 'OFFER' ? 'Angebot' : 'Gesuch'}
                    </Badge>
                    {listing.available ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Verfügbar
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        Nicht verfügbar
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Beschreibung</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location */}
                {listing.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Standort</p>
                      <p className="text-sm text-muted-foreground">{listing.location}</p>
                    </div>
                  </div>
                )}

                {/* Price */}
                {listing.pricePerDay !== null && listing.pricePerDay !== undefined && (
                  <div className="flex items-start gap-3">
                    <Euro className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Preis</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.pricePerDay === 0
                          ? 'Kostenlos'
                          : `${listing.pricePerDay.toFixed(2)} ${listing.currency || 'EUR'}/Tag`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Erstellt</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(listing.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Kategorie</p>
                    <p className="text-sm text-muted-foreground">{categoryLabel}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {listing.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Contact Button (Mobile) */}
              <div className="md:hidden">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleContactClick}
                  disabled={createConversationMutation.isPending || user?.id === listing.owner?.id}
                >
                  {createConversationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird erstellt...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Kontakt aufnehmen
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          {/* Owner Card */}
          {listing.owner ? (
            <OwnerCard owner={listing.owner} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Owner-Informationen werden geladen...</p>
              </CardContent>
            </Card>
          )}

          {/* Contact Button (Tablet/Desktop) */}
          <Card className="hidden md:block">
            <CardContent className="pt-6">
              <Button
                className="w-full"
                size="lg"
                onClick={handleContactClick}
                disabled={createConversationMutation.isPending || user?.id === listing.owner?.id}
              >
                {createConversationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Kontakt aufnehmen
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wichtige Hinweise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Vereinbare Details direkt mit dem Anbieter</p>
              <p>• Prüfe die Verfügbarkeit vor der Buchung</p>
              <p>• Kommuniziere respektvoll und zuverlässig</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

