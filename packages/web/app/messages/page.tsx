'use client';

// Messages Page
// Erstellt eine Conversation über ein Listing
// Erfordert listingId - keine direkten Chats erlaubt

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { createConversation } from '@/lib/api/conversations';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listingId = searchParams.get('listing');
  const userId = searchParams.get('user'); // Optional: for backward compatibility, but will redirect

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (data: { listingId: string; participantIds: string[] }) =>
      createConversation({
        listingId: data.listingId,
        participantIds: data.participantIds,
      }),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/conversations/${conversation.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.response?.data?.error || 'Konversation konnte nicht erstellt werden.',
        variant: 'destructive',
      });
      router.push('/conversations');
    },
  });

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(`/login?redirect=/messages${listingId ? `?listing=${listingId}` : ''}`);
      return;
    }

    // If only userId is provided (old format), redirect to listings
    if (userId && !listingId) {
      toast({
        title: 'Hinweis',
        description: 'Bitte wähle ein Angebot aus, um eine Nachricht zu senden.',
        variant: 'default',
      });
      router.push('/listings');
      return;
    }

    // Check if listing ID is provided
    if (!listingId) {
      toast({
        title: 'Fehler',
        description: 'Keine Angebots-ID angegeben. Bitte wähle ein Angebot aus.',
        variant: 'destructive',
      });
      router.push('/listings');
      return;
    }

    // Create conversation with listing owner
    // We need to fetch the listing first to get the owner ID
    // For now, we'll redirect to the listing detail page where they can click "Kontakt aufnehmen"
    if (user?.id) {
      router.push(`/listings/${listingId}`);
    }
  }, [authLoading, isAuthenticated, user, listingId, userId, router, toast]);

  // Show loading state
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Weiterleitung zum Angebot...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Lade...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}

