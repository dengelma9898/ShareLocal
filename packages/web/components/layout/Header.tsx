'use client';

// Header Component für ShareLocal
// Enthält Logo, Navigation, Search, User Menu

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getConversations } from '@/lib/api/conversations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, MessageSquare } from 'lucide-react';
import { MobileNav } from './MobileNav';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  // Fetch conversations to get unread count
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(50, 0),
    enabled: isAuthenticated,
    // Refetch on window focus to get latest unread count
    refetchOnWindowFocus: true,
  });

  // Calculate total unread messages
  const totalUnreadCount =
    conversationsData?.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container max-w-7xl mx-auto flex h-16 md:h-20 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          >
            <span className="text-xl md:text-2xl font-bold text-primary">ShareLocal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Hauptnavigation">
            <Link
              href="/listings"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
            >
              Angebote
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/listings/new"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
                >
                  Anbieten
                </Link>
                <Link
                  href="/conversations"
                  className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
                >
                  <span className="flex items-center gap-2">
                    Nachrichten
                    {totalUnreadCount > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      </Badge>
                    )}
                  </span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Side: Search, Auth */}
        <div className="flex items-center gap-4">
          {/* Search (später) */}
          {/* <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button> */}

          {isAuthenticated ? (
            <>
              {/* Messages Link (Mobile) */}
              <Link href="/conversations" className="md:hidden relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
                  aria-label={`Nachrichten${totalUnreadCount > 0 ? ` (${totalUnreadCount} ungelesen)` : ''}`}
                >
                  <MessageSquare className="h-5 w-5" />
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center" aria-hidden="true">
                      {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full md:h-10 md:w-10 md:min-h-0 md:min-w-0"
                    aria-label={`Benutzermenü für ${user?.name || 'Benutzer'}`}
                  >
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
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/listings/my">Meine Angebote</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/conversations" className="flex items-center justify-between">
                      <span>Nachrichten</span>
                      {totalUnreadCount > 0 && (
                        <Badge className="ml-2 h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground">
                          {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Abmelden</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <MobileNav />
            </>
          ) : (
            <>
              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Anmelden</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Registrieren</Link>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <MobileNav />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

