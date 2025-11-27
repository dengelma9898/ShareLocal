'use client';

// My Listing Card Component
// Spezielle Card für "Meine Angebote" mit Management-Buttons

import Link from 'next/link';
import { Listing, ListingCategory } from '@sharelocal/shared';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MyListingCardProps {
  listing: Listing;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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

export function MyListingCard({ listing, onEdit, onDelete }: MyListingCardProps) {
  const categoryColor = categoryColors[listing.category] || categoryColors.OTHER;
  const categoryLabel = categoryLabels[listing.category] || 'Sonstiges';

  return (
    <Card className="h-full flex flex-col">
      {/* Image Placeholder */}
      <Link href={`/listings/${listing.id}`}>
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
      </Link>

      <CardHeader>
        <Link href={`/listings/${listing.id}`}>
          <h3 className="text-lg font-semibold line-clamp-2 hover:text-primary transition-colors">
            {listing.title}
          </h3>
        </Link>
        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
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

        {/* Availability Status */}
        <div className="pt-2">
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
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-4">
        {/* View Details Button */}
        <Button asChild className="w-full" variant="outline">
          <Link href={`/listings/${listing.id}`}>Details ansehen</Link>
        </Button>

        {/* Management Buttons */}
        <div className="flex gap-2 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onEdit(listing.id)}
          >
            Bearbeiten
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => onDelete(listing.id)}
          >
            Löschen
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

