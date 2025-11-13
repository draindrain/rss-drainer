import Parser from 'rss-parser';

export interface RSSItem {
  title: string;
  link: string;
  guid: string;
  pubDate?: string;
}

const parser = new Parser({
  timeout: 10000, // 10 second timeout
});

/**
 * Fetches and parses an RSS feed
 * @param feedUrl URL of the RSS feed to parse
 * @returns Array of normalized RSS items
 */
export async function parseFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    console.log(`Fetching feed: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);

    if (!feed.items || feed.items.length === 0) {
      console.log(`No items found in feed: ${feedUrl}`);
      return [];
    }

    // Normalize items to our interface
    const items: RSSItem[] = feed.items.map((item) => {
      // Use guid if available, otherwise fall back to link
      const guid = item.guid || item.id || item.link || '';

      return {
        title: item.title || 'No title',
        link: item.link || '',
        guid: guid,
        pubDate: item.pubDate || item.isoDate,
      };
    });

    console.log(`Found ${items.length} items in feed: ${feedUrl}`);
    return items;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error parsing feed ${feedUrl}:`, error.message);
    } else {
      console.error(`Error parsing feed ${feedUrl}:`, error);
    }
    // Return empty array instead of throwing to allow other feeds to continue processing
    return [];
  }
}

/**
 * Fetches and parses multiple RSS feeds
 * @param feedUrls Array of feed URLs to parse
 * @returns Array of all items from all feeds
 */
export async function parseMultipleFeeds(feedUrls: string[]): Promise<RSSItem[]> {
  const results = await Promise.allSettled(feedUrls.map(url => parseFeed(url)));

  const allItems: RSSItem[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    } else {
      console.error(`Failed to parse feed ${feedUrls[index]}:`, result.reason);
    }
  });

  return allItems;
}
