'use client';

// Profile Page
// Zeigt und bearbeitet das eigene User-Profil

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { getCurrentUser, updateUser, UpdateUserData } from '@/lib/api/users';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, MapPin, Phone, Edit, Save, X, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation Schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(100, 'Name zu lang'),
  bio: z.string().max(500, 'Bio zu lang').optional().or(z.literal('')),
  location: z.string().max(200, 'Standort zu lang').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefonnummer zu lang').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login?redirect=/profile');
    return null;
  }

  // Fetch user data (always fetch fresh data)
  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: userError,
  } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => getCurrentUser(),
    enabled: isAuthenticated,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserData) => {
      // Use the loaded user's ID (from API) instead of AuthContext to ensure consistency
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      return updateUser(user.id, data);
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      // Update AuthContext user
      // Note: AuthContext sollte sich selbst aktualisieren, aber wir können hier auch manuell updaten
      toast({
        title: 'Profil aktualisiert!',
        description: 'Deine Profildaten wurden erfolgreich gespeichert.',
      });
      setIsEditing(false);
      // Reload page to update auth context
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler beim Speichern',
        description: error.response?.data?.error || 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || '',
      phone: user?.phone || '',
    },
  });

  // Update form when user data loads (only when not editing to avoid loops)
  useEffect(() => {
    if (user && !isEditing) {
      const currentValues = form.getValues();
      const newValues = {
        name: user.name,
        bio: user.bio || '',
        location: user.location || '',
        phone: user.phone || '',
      };
      
      // Only reset if values actually changed to prevent infinite loops
      if (
        currentValues.name !== newValues.name ||
        currentValues.bio !== newValues.bio ||
        currentValues.location !== newValues.location ||
        currentValues.phone !== newValues.phone
      ) {
        form.reset(newValues);
      }
    }
  }, [user?.id, user?.name, user?.bio, user?.location, user?.phone, isEditing, form]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    form.reset({
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      await updateMutation.mutateAsync({
        name: data.name,
        bio: data.bio || undefined,
        location: data.location || undefined,
        phone: data.phone || undefined,
      });
    } catch (error) {
      // Error is handled by mutation
    }
  };

  if (authLoading || isLoadingUser) {
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

  if (isErrorUser || !user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Fehler beim Laden</h2>
              <p className="text-muted-foreground mb-4">
                {userError instanceof Error
                  ? userError.message
                  : 'Dein Profil konnte nicht geladen werden.'}
              </p>
              <Button onClick={() => router.push('/')}>Zurück zur Startseite</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mein Profil</h1>
        <p className="text-muted-foreground">
          Verwalte deine Profilinformationen
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profilinformationen</CardTitle>
            {!isEditing && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 pb-6 border-b">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.emailVerified && (
                    <Badge variant="outline" className="mt-2">
                      E-Mail verifiziert
                    </Badge>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormDescription>Dein vollständiger Name</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={!isEditing}
                          placeholder="Erzähle etwas über dich..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormDescription>Eine kurze Beschreibung über dich</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standort (optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} disabled={!isEditing} className="pl-9" placeholder="z.B. Nürnberg" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefonnummer (optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} disabled={!isEditing} className="pl-9" placeholder="+49 123 456789" />
                        </div>
                      </FormControl>
                      <FormDescription>Wird nur für Kontaktzwecke verwendet</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Read-only Email */}
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={user.email} disabled className="pl-9 bg-muted" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    E-Mail-Adresse kann nicht geändert werden
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <CardFooter className="flex justify-end gap-2 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
                    <X className="h-4 w-4 mr-2" />
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Wird gespeichert...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Speichern
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account-Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mitglied seit</p>
              <p className="text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Rolle</p>
              <p className="text-sm text-muted-foreground">
                {user.role === 'ADMIN' ? 'Administrator' : 'Nutzer'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

