// Footer Component für ShareLocal
// Enthält Links, Legal, Social Media

import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Über ShareLocal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Rechtliches</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                  AGB
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/legal/imprint" className="hover:text-foreground transition-colors">
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
                <Link href="/guidelines" className="hover:text-foreground transition-colors">
                  Richtlinien
                </Link>
              </li>
              <li>
                <Link href="/contribute" className="hover:text-foreground transition-colors">
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} ShareLocal. Alle Rechte vorbehalten.</p>
          <div className="flex gap-4">
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">
              AGB
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              Datenschutz
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

