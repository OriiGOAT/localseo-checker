import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface AuditScore {
  score: number;
  performanceScore: number | null;
  accessibilityScore: number | null;
  metaTagsScore: number;
  schemaMarkupScore: number;
  issues: string[];
  strengths: string[];
  actionItems: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  metadata: {
    domain: string;
    auditedAt: string;
    metaTags: {
      title?: string;
      description?: string;
      viewport?: string;
      canonicalUrl?: string;
    };
    hasLocalBusinessSchema: boolean;
    mobileUsable: boolean;
    pageSpeedAvailable: boolean;
  };
}

async function fetchPageSpeedData(domain: string): Promise<Record<string, unknown> | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;
    if (!apiKey) {
      throw new Error('PageSpeed API key not configured');
    }

    const response = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
      params: {
        url: domain.startsWith('http') ? domain : `https://${domain}`,
        key: apiKey,
        strategy: 'mobile',
      },
    });

    return response.data;
  } catch (error) {
    console.error('PageSpeed API error:', error);
    return null;
  }
}

async function scrapeMetaTags(domain: string): Promise<{
  metaTags: Record<string, string | undefined>;
  hasLocalBusinessSchema: boolean;
}> {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const metaTags = {
      title: $('title').text() || $('meta[property="og:title"]').attr('content'),
      description:
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content'),
      canonicalUrl: $('link[rel="canonical"]').attr('href'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      robots: $('meta[name="robots"]').attr('content'),
    };

    const hasLocalBusinessSchema = $('script[type="application/ld+json"]')
      .text()
      .includes('LocalBusiness');

    return { metaTags, hasLocalBusinessSchema };
  } catch (error) {
    console.error('Scraping error:', error);
    return { metaTags: {}, hasLocalBusinessSchema: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required and must be a string' },
        { status: 400 }
      );
    }

    const [pageSpeedData, scrapedData] = await Promise.all([
      fetchPageSpeedData(domain),
      scrapeMetaTags(domain),
    ]);

    const getValueSafely = (obj: unknown, path: string[]): unknown => {
      let current: unknown = obj;
      for (const key of path) {
        if (typeof current === 'object' && current !== null) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return undefined;
        }
      }
      return current;
    };

    // Extract PageSpeed scores, checking for valid data (not 0 from API failure)
    const performanceScoreValue = pageSpeedData
      ? getValueSafely(pageSpeedData, ['lighthouseResult', 'categories', 'performance', 'score'])
      : undefined;
    const performanceScore = typeof performanceScoreValue === 'number' && performanceScoreValue > 0
      ? Math.round(performanceScoreValue * 100)
      : null;

    const accessibilityScoreValue = pageSpeedData
      ? getValueSafely(pageSpeedData, ['lighthouseResult', 'categories', 'accessibility', 'score'])
      : undefined;
    const accessibilityScore = typeof accessibilityScoreValue === 'number' && accessibilityScoreValue > 0
      ? Math.round(accessibilityScoreValue * 100)
      : null;

    // Check if PageSpeed API returned valid data
    const pageSpeedAvailable = performanceScore !== null || accessibilityScore !== null;

    const metaTagsScore = calculateMetaTagsScore(scrapedData.metaTags);
    const schemaScore = scrapedData.hasLocalBusinessSchema ? 100 : 0;

    const issues: string[] = [];
    const strengths: string[] = [];
    const actionItems: AuditScore['actionItems'] = [];

    // Meta Title Validation (100% verifiable - scraped from HTML)
    if (!scrapedData.metaTags.title) {
      issues.push('Meta-Titel fehlt');
      actionItems.push({
        title: `Meta-Titel für ${domain} hinzufügen`,
        description: `Fügen Sie einen einzigartigen Meta-Titel (50-60 Zeichen) hinzu. Beispiel:\n<title>Startseite | ${domain}</title>\n\nOptimal: 50-60 Zeichen, Fokus-Keyword am Anfang, Brand-Name am Ende.`,
        priority: 'high',
      });
    } else {
      const titleLength = (scrapedData.metaTags.title as string).length;
      strengths.push(`Meta-Titel vorhanden (${titleLength} Zeichen)`);

      if (titleLength < 30) {
        issues.push('Meta-Titel ist zu kurz');
        actionItems.push({
          title: 'Meta-Titel verlängern',
          description: `Ihr aktueller Titel: "${scrapedData.metaTags.title}"\n\nEr ist nur ${titleLength} Zeichen lang. Ideal sind 50-60 Zeichen. Beispiel:\n<title>Professionelle Dienstleistungen in ${domain} | Top-Qualität</title>`,
          priority: 'medium',
        });
      } else if (titleLength > 70) {
        issues.push('Meta-Titel ist zu lang');
        actionItems.push({
          title: 'Meta-Titel kürzen',
          description: `Ihr aktueller Titel ist ${titleLength} Zeichen lang und wird in Suchergebnissen gekürzt. Ideal sind 50-60 Zeichen. Kürzen Sie ihn auf:\n<title>Hauptkeyword | ${domain.split('.')[0]}</title>`,
          priority: 'low',
        });
      }
    }

    // Meta Description Validation (100% verifiable - scraped from HTML)
    if (!scrapedData.metaTags.description) {
      issues.push('Meta-Beschreibung fehlt');
      actionItems.push({
        title: 'Meta-Beschreibung für ${domain} erstellen',
        description: `Erstellen Sie eine überzeugende Meta-Beschreibung (150-160 Zeichen). Beispiel:\n<meta name="description" content="Hochwertige Leistungen für ${domain}. Erfahren Sie, wie wir Ihnen helfen können. Jetzt beraten lassen!">\n\nMuss ein Call-to-Action enthalten und für Suchmaschinen optimiert sein.`,
        priority: 'high',
      });
    } else {
      const descLength = (scrapedData.metaTags.description as string).length;
      strengths.push(`Meta-Beschreibung vorhanden (${descLength} Zeichen)`);

      if (descLength < 120) {
        issues.push('Meta-Beschreibung ist zu kurz');
        actionItems.push({
          title: 'Meta-Beschreibung erweitern',
          description: `Ihre aktuelle Beschreibung: "${scrapedData.metaTags.description}"\n\nSie ist nur ${descLength} Zeichen. Ideal sind 150-160 Zeichen. Erweitern Sie sie um einen Call-to-Action:\n<meta name="description" content="${scrapedData.metaTags.description} Kontaktieren Sie uns noch heute!">`,
          priority: 'medium',
        });
      } else if (descLength > 160) {
        issues.push('Meta-Beschreibung ist zu lang');
        actionItems.push({
          title: 'Meta-Beschreibung kürzen',
          description: `Ihre Beschreibung ist ${descLength} Zeichen und wird in Suchergebnissen gekürzt. Kürzen Sie auf 150-160 Zeichen. Entfernen Sie Redundanzen und konzentrieren Sie sich auf den wichtigsten Nutzen für den Nutzer.`,
          priority: 'low',
        });
      }
    }

    // Viewport Meta Tag (100% verifiable - scraped from HTML)
    if (!scrapedData.metaTags.viewport) {
      issues.push('Viewport Meta-Tag fehlt');
      actionItems.push({
        title: 'Viewport Meta-Tag konfigurieren',
        description: `Mobile-Responsivität ist nicht konfiguriert. Fügen Sie dieses Tag im <head> hinzu:\n<meta name="viewport" content="width=device-width, initial-scale=1">\n\nOhne Viewport wird die Website auf mobilen Geräten nicht korrekt angezeigt.`,
        priority: 'high',
      });
    } else {
      strengths.push('✓ Viewport Meta-Tag vorhanden - Mobile-Responsivität konfiguriert');
    }

    // Canonical URL (100% verifiable - scraped from HTML)
    if (!scrapedData.metaTags.canonicalUrl) {
      issues.push('Kanonische URL fehlt');
      actionItems.push({
        title: 'Kanonische URL definieren',
        description: `Definieren Sie eine kanonische URL, um Duplicate-Content-Probleme zu vermeiden:\n<link rel="canonical" href="https://${domain}/">\n\nDies verhindert, dass Google verwandte URLs als Duplikate einstuft.`,
        priority: 'medium',
      });
    } else {
      strengths.push('✓ Kanonische URL konfiguriert');
    }

    // LocalBusiness Schema (100% verifiable - JSON-LD detection)
    if (!scrapedData.hasLocalBusinessSchema) {
      issues.push('LocalBusiness Schema Markup fehlt');
      actionItems.push({
        title: 'LocalBusiness Schema Markup hinzufügen',
        description: `Implementieren Sie strukturierte Daten für bessere Local-SEO. Fügen Sie dieses JSON-LD im <head> ein:\n<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "LocalBusiness",\n  "name": "${domain}",\n  "url": "https://${domain}",\n  "telephone": "+49...",\n  "address": {\n    "@type": "PostalAddress",\n    "streetAddress": "Straße 123",\n    "addressLocality": "Stadt",\n    "postalCode": "12345",\n    "addressCountry": "DE"\n  }\n}</script>\n\nDies hilft Google, Ihr Unternehmen korrekt in der lokalen Suche anzuzeigen.`,
        priority: 'high',
      });
    } else {
      strengths.push('✓ LocalBusiness Schema Markup vorhanden');
    }

    // Performance Analysis (100% verifiable - from PageSpeed Insights API)
    if (performanceScore === null) {
      actionItems.push({
        title: 'Performance-Audit nicht verfügbar',
        description: `Die Google PageSpeed Insights API konnte die Website nicht analysieren. Dies kann vorkommen wenn:\n\n1. Die Website nicht erreichbar ist\n2. Die Website geblockt oder geschützt ist\n3. Die API-Rate-Limits erreicht sind\n\nBitte überprüfen Sie, dass:\n- Die Domain korrekt ist\n- Die Website öffentlich erreichbar ist\n- Keine IP-Blöcke oder Firewalls den Zugriff verhindern\n\nVersuch später erneut.`,
        priority: 'high',
      });
      issues.push('Performance-Daten nicht verfügbar');
    } else if (performanceScore < 50) {
      issues.push('Ladegeschwindigkeit kritisch niedrig');
      actionItems.push({
        title: `Website-Performance verbessern (Lighthouse Score: ${performanceScore}/100)`,
        description: `Die Ladegeschwindigkeit ist kritisch (${performanceScore}/100). Dies beeinträchtigt Rankings und Nutzererlebnis. Typische Optimierungen:\n\n1. Bilder komprimieren (WebP-Format, Lazy Loading)\n2. Render-blocking CSS/JS identifizieren\n3. Unnötige Scripts entfernen\n4. Server-Response-Zeit reduzieren\n\nZiel: Score > 70 in 4 Wochen.`,
        priority: 'high',
      });
    } else if (performanceScore < 75) {
      issues.push('Ladegeschwindigkeit verbesserungsbedürftig');
      actionItems.push({
        title: `Website-Performance optimieren (Lighthouse Score: ${performanceScore}/100)`,
        description: `Die Ladegeschwindigkeit ist verbesserungsbedürftig (${performanceScore}/100). Konkrete Maßnahmen:\n\n1. Browser-Caching aktivieren\n2. CSS/JS minimieren\n3. Unused CSS entfernen\n\nZiel: Score > 80.`,
        priority: 'medium',
      });
    } else if (performanceScore >= 90) {
      strengths.push(`✓ Hervorragende Ladegeschwindigkeit (${performanceScore}/100)`);
    }

    // Accessibility (100% verifiable - from PageSpeed Insights API)
    if (accessibilityScore === null) {
      actionItems.push({
        title: 'Barrierefreiheit-Audit nicht verfügbar',
        description: `Die Google PageSpeed Insights API konnte die Barrierefreiheit nicht analysieren. Dies ist häufig mit Performance-API-Fehlern verbunden. Versuchen Sie später erneut.`,
        priority: 'low',
      });
    } else if (accessibilityScore < 50) {
      issues.push('Barrierefreiheit kritisch niedrig');
      actionItems.push({
        title: `Barrierefreiheit verbessern (Accessibility Score: ${accessibilityScore}/100)`,
        description: `Barrierefreiheit ist niedrig (${accessibilityScore}/100). Kritische Mängel:\n\n1. Überprüfen Sie Alt-Texte bei Bildern\n2. Farbkontrast ist möglicherweise zu gering\n3. Headings-Struktur überprüfen (h1 → h2 → h3)\n4. ARIA-Labels auf interaktiven Elementen hinzufügen\n\nZiel: Score > 80.`,
        priority: 'high',
      });
    } else if (accessibilityScore >= 90) {
      strengths.push(`✓ Gute Barrierefreiheit (${accessibilityScore}/100)`);
    }

    // Calculate score based on available data only
    let score: number;
    if (pageSpeedAvailable) {
      // All data available: use full weighted calculation
      const perfScore = performanceScore ?? 0;
      const accScore = accessibilityScore ?? 0;
      score = Math.round(
        (perfScore * 0.25 + accScore * 0.15 + metaTagsScore * 0.3 + schemaScore * 0.3)
      );
    } else {
      // PageSpeed API failed: only use verifiable meta tags and schema scores
      // Adjust weights to sum to 1.0 (0.3 + 0.3 = 0.6, so divide by 0.6)
      score = Math.round(
        ((metaTagsScore * 0.3 + schemaScore * 0.3) / 0.6) * 100
      ) / 100 * 100;
      if (isNaN(score)) score = Math.round((metaTagsScore + schemaScore) / 2);
    }

    const result: AuditScore = {
      score: Math.round(score),
      performanceScore,
      accessibilityScore,
      metaTagsScore,
      schemaMarkupScore: schemaScore,
      issues,
      strengths,
      actionItems,
      metadata: {
        domain,
        auditedAt: new Date().toISOString(),
        metaTags: scrapedData.metaTags,
        hasLocalBusinessSchema: scrapedData.hasLocalBusinessSchema,
        mobileUsable: pageSpeedData ? getValueSafely(pageSpeedData, ['lighthouseResult', 'configSettings', 'emulatedFormFactor']) === 'mobile' : false,
        pageSpeedAvailable,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Audit-Durchführung. Bitte überprüfen Sie die Domain.' },
      { status: 500 }
    );
  }
}

function calculateMetaTagsScore(metaTags: Record<string, unknown>): number {
  let score = 0;
  const maxScore = 5;

  if (metaTags.title) score++;
  if (metaTags.description) score++;
  if (metaTags.viewport) score++;
  if (metaTags.canonicalUrl) score++;
  if (metaTags.ogImage) score++;

  return Math.round((score / maxScore) * 100);
}
