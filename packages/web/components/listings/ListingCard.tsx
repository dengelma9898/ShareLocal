'use client';

// Listing Card Component
// Zeigt ein einzelnes Listing in Card-Format

import Link from 'next/link';
import { Listing, ListingCategory } from '@sharelocal/shared';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
  showOwner?: boolean;
}

// Kategorie Labels
const categoryLabels: Record<ListingCategory, string> = {
  TOOL: 'Werkzeug',
  PLANT: 'Pflanze',
  SKILL: 'Fähigkeit',
  PRODUCT: 'Produkt',
  TIME: 'Zeit',
  OTHER: 'Sonstiges',
};

// Kategorie Farben für Badges
const categoryColors: Record<ListingCategory, string> = {
  TOOL: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  PLANT: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  SKILL: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  PRODUCT: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  TIME: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
  OTHER: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

export function ListingCard({ listing, showOwner = true }: ListingCardProps) {
  const categoryColor = categoryColors[listing.category] || categoryColors.OTHER;
  const categoryLabel = categoryLabels[listing.category] || 'Sonstiges';

  return (
    <Link 
      href={`/listings/${listing.id}`} 
      data-testid={`listing-card-${listing.id}`}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="h-full transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
        {/* Image Placeholder */}
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
                <div className="text-4xl mb-2">📦</div>
                <div className="text-sm">Kein Bild</div>
              </div>
            </div>
          )}
          {/* Category Badge Overlay */}
          <div className="absolute top-2 right-2">
            <Badge className={cn('border', categoryColor)}>{categoryLabel}</Badge>
          </div>
          {/* Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant={listing.type === 'OFFER' ? 'default' : 'secondary'}>
              {listing.type === 'OFFER' ? 'Angebot' : 'Gesuch'}
            </Badge>
          </div>
        </div>

        <CardHeader>
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">{listing.title}</h3>
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Owner Info */}
          {showOwner && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {listing.userId.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">Von Nutzer</span>
            </div>
          )}

          {/* Location */}
          {listing.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{listing.location}</span>
            </div>
          )}

          {/* Price */}
          {listing.pricePerDay !== null && listing.pricePerDay !== undefined && (
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Euro className="h-4 w-4" />
              <span>
                {listing.pricePerDay === 0
                  ? 'Kostenlos'
                  : `${listing.pricePerDay.toFixed(2)} ${listing.currency || 'EUR'}/Tag`}
              </span>
            </div>
          )}

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {listing.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {listing.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button className="w-full" variant={listing.type === 'OFFER' ? 'default' : 'secondary'}>
            {listing.type === 'OFFER' ? 'Details ansehen' : 'Kontakt aufnehmen'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

