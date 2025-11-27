'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { getConversations, Conversation } from '@/lib/api/conversations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2, Inbox } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ConversationsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(50, 0),
    enabled: isAuthenticated,
  });

  const conversations = conversationsData?.data || [];

  // Get other participant (not current user)
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.id !== user?.id);
  };

  if (authLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Anmeldung erforderlich</h2>
              <p className="text-muted-foreground mb-4">
                Bitte melde dich an, um deine Nachrichten zu sehen.
              </p>
              <Button asChild>
                <Link href="/login">Anmelden</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nachrichten</h1>
        <p className="text-muted-foreground">Verwalte deine Konversationen</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card>
          <CardHeader>
            <CardTitle>Fehler beim Laden</CardTitle>
            <CardDescription>
              Deine Nachrichten konnten nicht geladen werden. Bitte versuche es erneut.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Erneut versuchen</Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && conversations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Noch keine Nachrichten</CardTitle>
            <CardDescription className="mb-6 text-center">
              Du hast noch keine Konversationen. Starte eine Unterhaltung über ein Angebot!
            </CardDescription>
            <Button asChild>
              <Link href="/listings">
                <MessageSquare className="h-4 w-4 mr-2" />
                Zu den Angeboten
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Conversations List */}
      {!isLoading && !isError && conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            const initials = otherParticipant?.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '?';

            return (
              <Link key={conversation.id} href={`/conversations/${conversation.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherParticipant?.avatar || undefined} alt={otherParticipant?.name || 'User'} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">{otherParticipant?.name || 'Unbekannt'}</h3>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                addSuffix: true,
                                locale: de,
                              })}
                            </span>
                          )}
                        </div>

                        {/* Listing Info */}
                        {conversation.listing && (
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              {conversation.listing.type === 'OFFER' ? 'Angebot' : 'Gesuch'}: {conversation.listing.title}
                            </Badge>
                          </div>
                        )}

                        {/* Last Message Preview */}
                        {conversation.lastMessage ? (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.senderId === user?.id ? 'Du: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Keine Nachrichten bisher</p>
                        )}
                      </div>

                      {/* Unread Badge */}
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

