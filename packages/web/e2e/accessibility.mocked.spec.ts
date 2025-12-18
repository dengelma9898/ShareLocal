/**
 * Accessibility Tests mit axe-core
 * 
 * Testet WCAG 2.1 AA Compliance auf wichtigen Seiten
 * Verwendet Mock-Mode für schnelle CI-Tests
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Wichtige Seiten für Accessibility-Tests
const pagesToTest = [
  { name: 'Homepage', path: '/' },
  { name: 'Listings Page', path: '/listings' },
  { name: 'Login Page', path: '/login' },
  { name: 'Register Page', path: '/register' },
];

test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  for (const pageConfig of pagesToTest) {
    test(`${pageConfig.name} sollte keine Accessibility-Verletzungen haben`, async ({ page }) => {
      await page.goto(pageConfig.path);
      
      // Warte auf vollständiges Laden der Seite
      await page.waitForLoadState('networkidle');
      
      // Accessibility-Scan mit axe-core
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']) // WCAG 2.1 AA Level
        .analyze();
      
      // Erwarte keine Verletzungen
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Logge Details für Debugging (nur wenn Verletzungen vorhanden)
      if (accessibilityScanResults.violations.length > 0) {
        console.error(`\n❌ Accessibility-Verletzungen auf ${pageConfig.name} (${pageConfig.path}):`);
        accessibilityScanResults.violations.forEach((violation) => {
          console.error(`  - ${violation.id}: ${violation.description}`);
          console.error(`    Impact: ${violation.impact}`);
          console.error(`    Nodes: ${violation.nodes.length}`);
          if (violation.nodes.length > 0) {
            violation.nodes.forEach((node, index) => {
              console.error(`    Node ${index + 1}:`, node.html);
              if (node.failureSummary) {
                console.error(`      Failure: ${node.failureSummary}`);
              }
            });
          }
        });
      }
    });
  }
  
  test('Listings Page sollte keine kritischen Accessibility-Probleme haben', async ({ page }) => {
    await page.goto('/listings');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa']) // WCAG 2.1 AA
      .exclude(['iframe']) // Exkludiere iframes (falls vorhanden)
      .analyze();
    
    // Erwarte keine kritischen Verletzungen (Impact: critical, serious)
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
    
    if (criticalViolations.length > 0) {
      console.error('\n❌ Kritische Accessibility-Verletzungen:');
      criticalViolations.forEach((violation) => {
        console.error(`  - ${violation.id}: ${violation.description}`);
      });
    }
  });
  
  test('Formulare sollten accessible sein', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Teste Login-Formular
    const loginFormResults = await new AxeBuilder({ page })
      .include('form') // Nur Formular-Bereich
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(loginFormResults.violations).toEqual([]);
    
    // Teste Register-Formular
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    const registerFormResults = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(registerFormResults.violations).toEqual([]);
  });
  
  test('Navigation sollte keyboard-accessible sein', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Teste Header-Navigation
    const navResults = await new AxeBuilder({ page })
      .include('header')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    // Prüfe speziell auf Keyboard-Navigation-Probleme
    const keyboardViolations = navResults.violations.filter((v) =>
      v.id.includes('keyboard') || v.id.includes('focus') || v.id.includes('tab')
    );
    
    expect(keyboardViolations).toEqual([]);
  });
});
