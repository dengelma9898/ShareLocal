'use client';

// Mobile Navigation Component
// Sheet-basierte Navigation für Mobile Devices

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menü öffnen</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>ShareLocal</SheetTitle>
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
                      .map((n) => n[0])
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

