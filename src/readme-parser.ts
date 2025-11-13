import { readFile } from 'fs/promises';

export interface CategoryFeeds {
  [category: string]: string[];
}

/**
 * Parses README.md to extract RSS feed URLs organized by category sections
 * @param readmePath Path to the README.md file
 * @returns Object with categories as keys and arrays of feed URLs as values
 */
export async function parseReadme(readmePath: string = 'README.md'): Promise<CategoryFeeds> {
  try {
    const content = await readFile(readmePath, 'utf-8');
    const categoryFeeds: CategoryFeeds = {};

    // Find the RSS feed configuration section
    // Look for the marker "### Feeds" or "### Example Feeds" or any section before "## Technology Stack" or similar
    const feedSectionMatch = content.match(
      /###\s+(?:Example\s+)?Feeds[\s\S]*?(?=##\s+(?:Technology Stack|Local Development|How It Works|Troubleshooting|License|$))/i
    );

    if (!feedSectionMatch) {
      console.warn('No feed configuration section found in README.md');
      return categoryFeeds;
    }

    const feedSection = feedSectionMatch[0];
    const lines = feedSection.split('\n');
    let currentCategory: string | null = null;

    for (const line of lines) {
      // Check for markdown headers (## Category Name) - only level 2 headers
      const headerMatch = line.match(/^##\s+(.+)$/);
      if (headerMatch) {
        currentCategory = headerMatch[1].trim();
        categoryFeeds[currentCategory] = [];
        continue;
      }

      // Check for URLs in list items or standalone
      if (currentCategory) {
        // Match URLs (both in list items and standalone)
        const urlMatch = line.match(/https?:\/\/[^\s)]+/);
        if (urlMatch) {
          const url = urlMatch[0].trim();
          // Basic URL validation
          if (url.startsWith('http://') || url.startsWith('https://')) {
            categoryFeeds[currentCategory].push(url);
          }
        }
      }
    }

    // Remove empty categories
    Object.keys(categoryFeeds).forEach(category => {
      if (categoryFeeds[category].length === 0) {
        delete categoryFeeds[category];
      }
    });

    return categoryFeeds;
  } catch (error) {
    console.error('Error parsing README.md:', error);
    throw new Error(`Failed to parse README.md: ${error}`);
  }
}

/**
 * Converts category name to Discord webhook environment variable name
 * Example: "AI" -> "DISCORD_WEBHOOK_AI", "World News" -> "DISCORD_WEBHOOK_WORLDNEWS"
 */
export function categoryToWebhookName(category: string): string {
  return `DISCORD_WEBHOOK_${category.toUpperCase().replace(/\s+/g, '')}`;
}
