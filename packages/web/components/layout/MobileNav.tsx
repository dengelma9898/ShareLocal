'use client';

// Mobile Navigation Component
// Sheet-basierte Navigation für Mobile Devices

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getConversations } from '@/lib/api/conversations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Fetch conversations to get unread count
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(50, 0),
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
  });

  // Calculate total unread messages
  const totalUnreadCount =
    conversationsData?.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) || 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden min-h-[44px] min-w-[44px]"
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menü öffnen</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-card">
        <SheetHeader>
          <SheetTitle className="text-primary">ShareLocal</SheetTitle>
          <SheetDescription>Navigation</SheetDescription>
        </SheetHeader>

        <div className="mt-8 flex flex-col gap-4">
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'User'} />
                  <AvatarFallback>
                    {user?.name
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Separator />

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/listings">Angebote</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/listings/new">Anbieten</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/listings/my">Meine Angebote</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/conversations" className="flex items-center justify-between w-full">
                    <span>Nachrichten</span>
                    {totalUnreadCount > 0 && (
                      <Badge className="ml-2 h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/profile">Profil</Link>
                </Button>
              </nav>

              <Separator />

              {/* Logout */}
              <Button
                variant="destructive"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
                Abmelden
              </Button>
            </>
          ) : (
            <>
              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/listings">Angebote</Link>
                </Button>
              </nav>

              <Separator />

              {/* Auth Buttons */}
              <div className="flex flex-col gap-2">
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href="/register">Registrieren</Link>
                </Button>
                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                  <Link href="/login">Anmelden</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

