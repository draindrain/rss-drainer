import axios from 'axios';
import type { RSSItem } from './rss-parser.js';

const RATE_LIMIT_DELAY = 2000; // 2 seconds between messages to avoid rate limits

/**
 * Posts a message to a Discord webhook
 */
export async function postToDiscord(
  webhookUrl: string,
  item: RSSItem,
  category: string
): Promise<boolean> {
  try {
    // Simple format: title + link
    const content = `**${item.title}**\n${item.link}`;

    await axios.post(webhookUrl, {
      content: content,
      username: `RSS Drainer - ${category}`,
    });

    console.log(`Posted to Discord [${category}]: ${item.title}`);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error posting to Discord [${category}]:`,
        error.response?.status,
        error.response?.statusText
      );

      // Log rate limit info if available
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        console.error(`Rate limited. Retry after: ${retryAfter}s`);
      }
    } else {
      console.error(`Error posting to Discord [${category}]:`, error);
    }
    return false;
  }
}

/**
 * Posts multiple items to Discord with rate limiting
 */
export async function postMultipleToDiscord(
  webhookUrl: string,
  items: RSSItem[],
  category: string
): Promise<number> {
  let successCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const success = await postToDiscord(webhookUrl, item, category);

    if (success) {
      successCount++;
    }

    // Add delay between posts to avoid rate limiting (except for the last item)
    if (i < items.length - 1) {
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  return successCount;
}

/**
 * Helper function to sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validates a Discord webhook URL
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'discord.com' ||
      parsed.hostname === 'discordapp.com'
    ) && parsed.pathname.includes('/api/webhooks/');
  } catch {
    return false;
  }
}
