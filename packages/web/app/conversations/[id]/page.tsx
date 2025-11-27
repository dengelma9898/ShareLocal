'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { getMessages, sendMessage, getConversations, Conversation, Message } from '@/lib/api/conversations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ConversationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/conversations/${conversationId}`);
    }
  }, [authLoading, isAuthenticated, router, conversationId]);

  // Fetch conversation info (to get participants)
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(1000, 0),
    enabled: isAuthenticated,
  });

  const conversation = conversationsData?.data.find((c) => c.id === conversationId);

  // Fetch messages
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    isError: isErrorMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId, 100, 0),
    enabled: isAuthenticated && !!conversationId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const messages = messagesData?.data || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageContent('');
      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Senden',
        description: error.response?.data?.error || 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || sendMessageMutation.isPending) return;

    await sendMessageMutation.mutateAsync(messageContent.trim());
  };

  // Get other participant
  const otherParticipant = conversation?.participants.find((p) => p.id !== user?.id);
  const initials = otherParticipant?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  if (authLoading || isLoadingConversations) {
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

  if (!conversation) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Konversation nicht gefunden</h2>
              <p className="text-muted-foreground mb-4">Diese Konversation existiert nicht oder du hast keinen Zugriff darauf.</p>
              <Button asChild>
                <Link href="/conversations">Zurück zu Nachrichten</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/conversations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherParticipant?.avatar || undefined} alt={otherParticipant?.name || 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">{otherParticipant?.name || 'Unbekannt'}</h1>
            {conversation.listing && (
              <Badge variant="outline" className="text-xs mt-1">
                {conversation.listing.type === 'OFFER' ? 'Angebot' : 'Gesuch'}: {conversation.listing.title}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {isLoadingMessages && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {isErrorMessages && (
              <div className="text-center text-muted-foreground">
                <p>Fehler beim Laden der Nachrichten</p>
                <p className="text-sm">{messagesError instanceof Error ? messagesError.message : 'Unbekannter Fehler'}</p>
              </div>
            )}

            {!isLoadingMessages && messages.length === 0 && (
              <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                <p>Noch keine Nachrichten. Starte die Unterhaltung!</p>
              </div>
            )}

            {messages.map((message) => {
              const isOwnMessage = message.sender.id === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn('flex gap-3', isOwnMessage ? 'flex-row-reverse' : 'flex-row')}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.avatar || undefined} alt={message.sender.name} />
                      <AvatarFallback>
                        {message.sender.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn('flex flex-col max-w-[70%]', isOwnMessage ? 'items-end' : 'items-start')}>
                    {!isOwnMessage && (
                      <span className="text-xs text-muted-foreground mb-1">{message.sender.name}</span>
                    )}
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2',
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Message Input */}
      <form onSubmit={handleSendMessage}>
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Nachricht schreiben..."
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageContent.trim() || sendMessageMutation.isPending}
                className="self-end"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

