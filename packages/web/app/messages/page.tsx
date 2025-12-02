'use client';

// Messages Page
// Erstellt oder findet eine Conversation mit einem bestimmten User
// und leitet zur Conversation-Detail-Seite weiter

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { createConversation } from '@/lib/api/conversations';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const targetUserId = searchParams.get('user');

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (participantIds: string[]) =>
      createConversation({
        participantIds,
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
      // Redirect to conversations page on error
      router.push('/conversations');
    },
  });

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(`/login?redirect=/messages${targetUserId ? `?user=${targetUserId}` : ''}`);
      return;
    }

    // Check if user ID is provided
    if (!targetUserId) {
      toast({
        title: 'Fehler',
        description: 'Keine Benutzer-ID angegeben.',
        variant: 'destructive',
      });
      router.push('/conversations');
      return;
    }

    // Check if user is trying to contact themselves
    if (user?.id === targetUserId) {
      toast({
        title: 'Hinweis',
        description: 'Du kannst dir selbst keine Nachricht senden.',
        variant: 'default',
      });
      router.push('/conversations');
      return;
    }

    // Create conversation with target user
    if (user?.id) {
      createConversationMutation.mutate([user.id, targetUserId]);
    }
  }, [authLoading, isAuthenticated, user, targetUserId, router, toast, createConversationMutation, queryClient]);

  // Show loading state
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Konversation wird erstellt...</p>
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

