// Footer Component für ShareLocal
// Enthält Links, Legal, Social Media

import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* About */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Über ShareLocal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link 
                  href="/about" 
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
                >
                  Über uns
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
                >
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal - Privacy prominent */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Rechtliches</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link 
                  href="/legal/privacy" 
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
                >
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/terms" 
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
                >
                  AGB
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/imprint" 
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
                >
                  Impressum
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link 
                  href="/guidelines" 
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
                >
                  Richtlinien
                </Link>
              </li>
              <li>
                <Link 
                  href="/contribute" 
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
                >
                  Mitwirken
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">ShareLocal</h3>
            <p className="text-sm text-muted-foreground">
              Digitale Vermittlungsplattform für Ressourcen-Sharing in lokalen Gemeinschaften.
            </p>
            <p className="text-xs text-muted-foreground">
              Open Source • AGPL-3.0
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground mt-8">
          <p>© {currentYear} ShareLocal. Alle Rechte vorbehalten.</p>
          <div className="flex gap-4">
            <Link 
              href="/legal/privacy" 
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
            >
              Datenschutz
            </Link>
            <Link 
              href="/legal/terms" 
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1"
            >
              AGB
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

