'use client';

import { useAuth } from '../lib/auth/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Lädt...</p>
      </main>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl mb-4">
          ShareLocal
        </h1>
        <p className="text-xl text-muted-foreground">
          Digitale Vermittlungsplattform für Ressourcen-Sharing
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
          {isAuthenticated ? (
            <Card>
              <CardHeader>
                <CardTitle>Willkommen, {user?.name}!</CardTitle>
                <CardDescription>
                  Du bist erfolgreich eingeloggt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={logout}
                  variant="destructive"
                >
                  Abmelden
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Willkommen bei ShareLocal!</CardTitle>
                <CardDescription>
                  Melde dich an oder erstelle einen neuen Account, um zu beginnen.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/login">Anmelden</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/register">Registrieren</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}
