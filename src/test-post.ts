import 'dotenv/config';
import { parseReadme, categoryToWebhookName } from './readme-parser.js';
import { parseMultipleFeeds } from './rss-parser.js';
import { postToDiscord, isValidWebhookUrl } from './discord.js';

/**
 * Test script to post the latest item from each feed to Discord
 * Does NOT read or update the Gist tracking data
 * Useful for testing webhook configuration and Discord integration
 */
async function testPost() {
  console.log('=== RSS Drainer Test Script ===');
  console.log('Testing by posting the latest item from each feed...\n');

  try {
    // Parse README.md to get categorized feeds
    console.log('--- Parsing README.md ---');
    const categoryFeeds = await parseReadme('README.md');
    const categories = Object.keys(categoryFeeds);

    if (categories.length === 0) {
      console.log('No categories found in README.md');
      return;
    }

    console.log(`Found ${categories.length} categories: ${categories.join(', ')}\n`);

    // Process each category
    for (const category of categories) {
      console.log(`--- Testing Category: ${category} ---`);

      const feeds = categoryFeeds[category];

      // Get webhook URL for this category
      const webhookEnvName = categoryToWebhookName(category);
      const webhookUrl = process.env[webhookEnvName];

      if (!webhookUrl) {
        console.error(
          `❌ No webhook URL found for ${category} (expected env var: ${webhookEnvName})`
        );
        continue;
      }

      // Validate webhook URL
      if (!isValidWebhookUrl(webhookUrl)) {
        console.error(`❌ Invalid webhook URL for ${category}`);
        continue;
      }

      console.log(`✅ Webhook URL found and valid for ${category}`);

      // Fetch and parse all feeds in this category
      console.log(`Fetching ${feeds.length} feed(s)...`);
      const allItems = await parseMultipleFeeds(feeds);

      if (allItems.length === 0) {
        console.log(`❌ No items found for ${category}\n`);
        continue;
      }

      console.log(`Found ${allItems.length} total items`);

      // Sort by pubDate (newest first) to get the latest item
      allItems.sort((a, b) => {
        if (!a.pubDate || !b.pubDate) return 0;
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      });

      // Get the latest item
      const latestItem = allItems[0];

      console.log(`Latest item: "${latestItem.title}"`);
      console.log(`Publishing date: ${latestItem.pubDate || 'N/A'}`);
      console.log(`Posting to Discord...`);

      // Post to Discord
      const success = await postToDiscord(webhookUrl, latestItem, category);

      if (success) {
        console.log(`✅ Successfully posted to Discord for ${category}\n`);
      } else {
        console.log(`❌ Failed to post to Discord for ${category}\n`);
      }

      // Add a small delay between categories to avoid rate limiting
      await sleep(2000);
    }

    console.log('=== Test Complete ===');
  } catch (error) {
    console.error('\n!!! Error !!!');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Helper function to sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the test script
testPost();
