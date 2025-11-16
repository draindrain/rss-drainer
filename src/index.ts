import 'dotenv/config';
import { parseReadme, categoryToWebhookName } from './readme-parser.js';
import { parseMultipleFeeds } from './rss-parser.js';
import { TrackingManager } from './tracking.js';
import { postMultipleToDiscord, isValidWebhookUrl } from './discord.js';
import type { RSSItem } from './rss-parser.js';

interface ProcessingStats {
  categoriesProcessed: number;
  feedsChecked: number;
  itemsFound: number;
  itemsPosted: number;
  errors: number;
}

async function main() {
  console.log('=== RSS Drainer Started ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const stats: ProcessingStats = {
    categoriesProcessed: 0,
    feedsChecked: 0,
    itemsFound: 0,
    itemsPosted: 0,
    errors: 0,
  };

  try {
    // Load environment variables
    const gistId = process.env.GIST_ID;
    const gistToken = process.env.GIST_TOKEN;

    if (!gistId || !gistToken) {
      throw new Error('GIST_ID and GIST_TOKEN environment variables are required');
    }

    // Initialize tracking manager
    const tracker = new TrackingManager(gistId, gistToken);
    await tracker.load();

    // Clean up old tracking entries (keep last 30 days)
    tracker.cleanup(30);

    // Parse README.md to get categorized feeds
    console.log('\n--- Parsing README.md ---');
    const categoryFeeds = await parseReadme('README.md');
    const categories = Object.keys(categoryFeeds);

    if (categories.length === 0) {
      console.log('No categories found in README.md');
      return;
    }

    console.log(`Found ${categories.length} categories: ${categories.join(', ')}`);

    // Process each category
    for (const category of categories) {
      console.log(`\n--- Processing Category: ${category} ---`);

      const feeds = categoryFeeds[category];
      stats.feedsChecked += feeds.length;

      // Get webhook URL for this category
      const webhookEnvName = categoryToWebhookName(category);
      const webhookUrl = process.env[webhookEnvName];

      if (!webhookUrl) {
        console.error(
          `Warning: No webhook URL found for ${category} (expected env var: ${webhookEnvName})`
        );
        stats.errors++;
        continue;
      }

      // Validate webhook URL
      if (!isValidWebhookUrl(webhookUrl)) {
        console.error(`Warning: Invalid webhook URL for ${category}`);
        stats.errors++;
        continue;
      }

      // Fetch and parse all feeds in this category
      console.log(`Fetching ${feeds.length} feed(s) for ${category}...`);
      const allItems = await parseMultipleFeeds(feeds);
      stats.itemsFound += allItems.length;

      if (allItems.length === 0) {
        console.log(`No items found for ${category}`);
        continue;
      }

      // Group items by feed URL to detect new feeds individually
      const itemsByFeed = new Map<string, RSSItem[]>();
      for (const item of allItems) {
        const feedKey = item.feedUrl || 'unknown';
        if (!itemsByFeed.has(feedKey)) {
          itemsByFeed.set(feedKey, []);
        }
        itemsByFeed.get(feedKey)!.push(item);
      }

      const newItems: RSSItem[] = [];
      let totalInitialized = 0;

      // Process each feed group
      for (const [feedKey, feedItems] of itemsByFeed) {
        const trackedItemsFromFeed = feedItems.filter(
          (item) => item.guid && tracker.isPosted(item.guid)
        );
        const isNewFeed = trackedItemsFromFeed.length === 0 && feedItems.length > 0;

        if (isNewFeed) {
          console.log(
            `⚠️  New feed detected (${feedKey})! Initializing ${feedItems.length} items without posting...`
          );

          // Mark all existing items as posted without actually posting them
          for (const item of feedItems) {
            if (item.guid) {
              tracker.markAsPosted(item.guid);
              totalInitialized++;
            }
          }

          console.log(`✅ Feed initialized. Future new items will be posted to Discord.`);
        } else {
          // Filter out already-posted items
          for (const item of feedItems) {
            if (!item.guid) {
              console.log(`Skipping item without guid: ${item.title}`);
              continue;
            }

            if (!tracker.isPosted(item.guid)) {
              newItems.push(item);
            }
          }
        }
      }

      if (totalInitialized > 0) {
        console.log(`Initialized ${totalInitialized} items from new feeds in ${category}`);
      }

      console.log(
        `Found ${newItems.length} new item(s) out of ${allItems.length} total for ${category}`
      );

      if (newItems.length === 0) {
        console.log(`No new items to post for ${category}`);
        stats.categoriesProcessed++;
        continue;
      }

      // Sort by pubDate (oldest first) if available
      newItems.sort((a, b) => {
        if (!a.pubDate || !b.pubDate) return 0;
        return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
      });

      // Post new items to Discord
      console.log(`Posting ${newItems.length} item(s) to Discord for ${category}...`);
      const successCount = await postMultipleToDiscord(webhookUrl, newItems, category);

      // Mark successfully posted items as posted
      let markedCount = 0;
      for (let i = 0; i < successCount; i++) {
        const item = newItems[i];
        if (item.guid) {
          tracker.markAsPosted(item.guid);
          markedCount++;
        }
      }

      stats.itemsPosted += successCount;
      stats.categoriesProcessed++;

      console.log(`Posted ${successCount}/${newItems.length} items for ${category}`);

      if (successCount < newItems.length) {
        stats.errors += newItems.length - successCount;
      }
    }

    // Save tracking data
    console.log('\n--- Saving Tracking Data ---');
    await tracker.save();

    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Categories processed: ${stats.categoriesProcessed}/${categories.length}`);
    console.log(`Feeds checked: ${stats.feedsChecked}`);
    console.log(`Items found: ${stats.itemsFound}`);
    console.log(`Items posted: ${stats.itemsPosted}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('=== RSS Drainer Completed ===');
  } catch (error) {
    console.error('\n!!! Fatal Error !!!');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main();
