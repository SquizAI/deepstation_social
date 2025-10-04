/**
 * Firecrawl Integration Service
 * Enables web scraping, content discovery, and competitive intelligence for DeepStation
 * Part of the Advanced Autonomy & Workflow Builder (Update #6 from DEEPSTATION_20_MAJOR_UPDATES.md)
 */

export interface FirecrawlScrapeOptions {
  url: string;
  formats?: ('markdown' | 'html' | 'rawHtml' | 'screenshot' | 'links')[];
  onlyMainContent?: boolean;
  removeBase64Images?: boolean;
  maxAge?: number; // Cache duration in ms
}

export interface FirecrawlSearchOptions {
  query: string;
  limit?: number;
  sources?: ('web' | 'images' | 'news')[];
  scrapeContent?: boolean;
}

export interface FirecrawlMapOptions {
  url: string;
  search?: string;
  limit?: number;
}

export interface FirecrawlExtractOptions {
  urls: string[];
  prompt: string;
  schema?: Record<string, any>;
}

export interface ScrapedContent {
  url: string;
  title?: string;
  content: string;
  markdown?: string;
  html?: string;
  links?: string[];
  screenshot?: string;
}

export interface SearchResult {
  url: string;
  title: string;
  description: string;
  position: number;
  content?: string;
}

/**
 * Firecrawl Service for DeepStation
 * Provides web scraping, search, and content extraction capabilities
 */
export class FirecrawlService {
  /**
   * Scrape a single URL and extract content
   * Use for: Competitor analysis, content inspiration, research
   */
  async scrape(options: FirecrawlScrapeOptions): Promise<ScrapedContent> {
    // This will be called via MCP in the agent workflows
    // For now, return a typed interface that agents can use
    throw new Error('Use Firecrawl MCP tool: mcp__mcp-server-firecrawl__firecrawl_scrape');
  }

  /**
   * Search the web and optionally scrape results
   * Use for: Trend discovery, topic research, content ideas
   */
  async search(options: FirecrawlSearchOptions): Promise<SearchResult[]> {
    throw new Error('Use Firecrawl MCP tool: mcp__mcp-server-firecrawl__firecrawl_search');
  }

  /**
   * Map a website to discover all URLs
   * Use for: Sitemap generation, content inventory, bulk scraping
   */
  async map(options: FirecrawlMapOptions): Promise<string[]> {
    throw new Error('Use Firecrawl MCP tool: mcp__mcp-server-firecrawl__firecrawl_map');
  }

  /**
   * Extract structured data from multiple URLs using AI
   * Use for: Data extraction, competitive intelligence, research
   */
  async extract(options: FirecrawlExtractOptions): Promise<any[]> {
    throw new Error('Use Firecrawl MCP tool: mcp__mcp-server-firecrawl__firecrawl_extract');
  }

  /**
   * Batch scrape multiple URLs in parallel
   * Use for: Bulk content collection, multi-source analysis
   */
  async batchScrape(urls: string[]): Promise<ScrapedContent[]> {
    // Will use batch_scrape MCP tool when available
    throw new Error('Use individual scrape calls or MCP batch_scrape tool');
  }
}

/**
 * Content Discovery Workflows
 * Pre-built workflows using Firecrawl for common tasks
 */
export class ContentDiscoveryWorkflows {
  private firecrawl: FirecrawlService;

  constructor() {
    this.firecrawl = new FirecrawlService();
  }

  /**
   * Discover trending topics in your industry
   */
  async discoverTrendingTopics(industry: string, limit: number = 10): Promise<SearchResult[]> {
    const query = `${industry} trending topics 2025`;
    return this.firecrawl.search({
      query,
      limit,
      sources: ['web', 'news'],
      scrapeContent: true,
    });
  }

  /**
   * Analyze competitor content strategy
   */
  async analyzeCompetitor(competitorUrl: string): Promise<{
    pages: string[];
    content: ScrapedContent[];
    insights: string;
  }> {
    // Map competitor site
    const pages = await this.firecrawl.map({ url: competitorUrl, limit: 20 });

    // Scrape key pages
    const contentPages = pages.slice(0, 5);
    const content: ScrapedContent[] = [];

    for (const url of contentPages) {
      const scraped = await this.firecrawl.scrape({
        url,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      });
      content.push(scraped);
    }

    return {
      pages,
      content,
      insights: 'Use GPT-5/Claude 4.5 to analyze content patterns',
    };
  }

  /**
   * Find content inspiration from top-performing posts
   */
  async findContentInspiration(topic: string): Promise<{
    sources: SearchResult[];
    suggestions: string[];
  }> {
    const results = await this.firecrawl.search({
      query: `best ${topic} content examples`,
      limit: 5,
      sources: ['web'],
      scrapeContent: true,
    });

    return {
      sources: results,
      suggestions: [
        'Analyze content structure and themes',
        'Identify engagement patterns',
        'Extract key talking points',
      ],
    };
  }

  /**
   * Extract product/company information from website
   */
  async extractCompanyInfo(websiteUrl: string): Promise<any> {
    const schema = {
      type: 'object',
      properties: {
        company_name: { type: 'string' },
        description: { type: 'string' },
        products: { type: 'array', items: { type: 'string' } },
        key_features: { type: 'array', items: { type: 'string' } },
        pricing_info: { type: 'string' },
        contact_info: { type: 'object' },
      },
    };

    return this.firecrawl.extract({
      urls: [websiteUrl],
      prompt: 'Extract company and product information',
      schema,
    });
  }
}

// Export singleton instance
export const firecrawlService = new FirecrawlService();
export const contentDiscovery = new ContentDiscoveryWorkflows();
