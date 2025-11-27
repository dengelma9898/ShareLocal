'use client';

// Owner Card Component
// Zeigt Informationen über den Listing-Besitzer

import { User } from '@sharelocal/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

interface OwnerCardProps {
  owner: User;
  showContactButton?: boolean;
}

export function OwnerCard({ owner, showContactButton = true }: OwnerCardProps) {
  const initials = owner.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Anbieter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Owner Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={owner.avatar || undefined} alt={owner.name || 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{owner.name}</p>
            {owner.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{owner.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {owner.bio && (
          <p className="text-sm text-muted-foreground">{owner.bio}</p>
        )}

        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          {owner.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{owner.email}</span>
            </div>
          )}
          {owner.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{owner.phone}</span>
            </div>
          )}
        </div>

        {/* Verified Badge */}
        {owner.emailVerified && (
          <Badge variant="outline" className="w-fit">
            ✓ Verifiziert
          </Badge>
        )}

        {/* Contact Button */}
        {showContactButton && (
          <Button asChild className="w-full">
            <Link href={`/messages?user=${owner.id}`}>Nachricht senden</Link>
          </Button>
        )}

        {/* View Profile Link */}
        <Button asChild variant="ghost" className="w-full">
          <Link href={`/profile/${owner.id}`}>Profil ansehen</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

