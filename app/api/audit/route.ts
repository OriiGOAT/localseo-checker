import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface AuditScore {
  score: number;
  performanceScore: number;
  accessibilityScore: number;
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

    const performanceScoreValue = pageSpeedData
      ? getValueSafely(pageSpeedData, ['lighthouseResult', 'categories', 'performance', 'score'])
      : undefined;
    const performanceScore = typeof performanceScoreValue === 'number'
      ? Math.round(performanceScoreValue * 100)
      : 0;

    const accessibilityScoreValue = pageSpeedData
      ? getValueSafely(pageSpeedData, ['lighthouseResult', 'categories', 'accessibility', 'score'])
      : undefined;
    const accessibilityScore = typeof accessibilityScoreValue === 'number'
      ? Math.round(accessibilityScoreValue * 100)
      : 0;

    const metaTagsScore = calculateMetaTagsScore(scrapedData.metaTags);
    const schemaScore = scrapedData.hasLocalBusinessSchema ? 100 : 0;

    const issues: string[] = [];
    const strengths: string[] = [];
    const actionItems: AuditScore['actionItems'] = [];

    // Meta tags validation
    if (!scrapedData.metaTags.title) {
      issues.push('Meta title fehlt');
      actionItems.push({
        title: 'Meta-Titel hinzufügen',
        description: 'Fügen Sie einen aussagekräftigen Meta-Titel hinzu (50-60 Zeichen)',
        priority: 'high',
      });
    } else {
      strengths.push('Meta-Titel vorhanden');
    }

    if (!scrapedData.metaTags.description) {
      issues.push('Meta-Beschreibung fehlt');
      actionItems.push({
        title: 'Meta-Beschreibung hinzufügen',
        description: 'Verfassen Sie eine aussagekräftige Meta-Beschreibung (150-160 Zeichen)',
        priority: 'high',
      });
    } else {
      strengths.push('Meta-Beschreibung vorhanden');
    }

    if (!scrapedData.metaTags.viewport) {
      issues.push('Viewport Meta-Tag fehlt');
      actionItems.push({
        title: 'Viewport Meta-Tag hinzufügen',
        description: 'Fügen Sie <meta name="viewport" content="width=device-width, initial-scale=1"> hinzu',
        priority: 'high',
      });
    } else {
      strengths.push('Mobile-Responsivität konfiguriert');
    }

    if (!scrapedData.metaTags.canonicalUrl) {
      issues.push('Kanonische URL fehlt');
      actionItems.push({
        title: 'Kanonische URL definieren',
        description: 'Legen Sie eine kanonische URL fest, um Duplicate-Content-Probleme zu vermeiden',
        priority: 'medium',
      });
    } else {
      strengths.push('Kanonische URL vorhanden');
    }

    // LocalBusiness Schema
    if (!scrapedData.hasLocalBusinessSchema) {
      issues.push('LocalBusiness Schema Markup fehlt');
      actionItems.push({
        title: 'LocalBusiness Schema Markup hinzufügen',
        description:
          'Implementieren Sie strukturierte Daten für Local SEO mit JSON-LD LocalBusiness Schema',
        priority: 'high',
      });
    } else {
      strengths.push('LocalBusiness Schema Markup vorhanden');
    }

    // Performance
    if (performanceScore < 50) {
      actionItems.push({
        title: 'Performance optimieren',
        description: 'Verbesserungen der Ladegeschwindigkeit können die Rankings verbessern',
        priority: 'high',
      });
    } else if (performanceScore >= 90) {
      strengths.push('Ausgezeichnete Performance');
    }

    const score = Math.round(
      (performanceScore * 0.25 + accessibilityScore * 0.15 + metaTagsScore * 0.3 + schemaScore * 0.3)
    );

    const result: AuditScore = {
      score,
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
