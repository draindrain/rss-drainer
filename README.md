# RSS Drainer

An automated RSS feed tracker that runs as a GitHub Action and posts new items to Discord channels via webhooks.

## Features

- Monitors multiple RSS feeds organized by category
- Automatically posts new items to Discord channels
- Runs every 15 minutes via GitHub Actions
- Persistent tracking using GitHub Gist (no database needed)
- Easy configuration - just edit this README.md

## Setup Instructions

### 1. Fork/Clone this Repository

Fork or clone this repository to your GitHub account.

### 2. Create a GitHub Gist for Tracking

1. Go to https://gist.github.com/
2. Create a new gist with any name (e.g., "rss-drainer-tracking")
3. Add a dummy file with any content
4. Save the gist and copy the Gist ID from the URL (e.g., `https://gist.github.com/username/GIST_ID_HERE`)

### 3. Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `gist` scope
3. Copy the token (you won't be able to see it again)

### 4. Set up Discord Webhooks

For each category you want to track:

1. Go to your Discord server settings
2. Select the channel where you want posts
3. Go to Integrations → Webhooks
4. Create a webhook and copy the URL

### 5. Create GitHub Environment

1. Go to your repository Settings → Environments
2. Click "New environment"
3. Name it `production`
4. Click "Configure environment"

### 6. Configure Environment Secrets and Variables

In the `production` environment you just created:

**Environment Variables** (Settings → Environments → production → Environment variables):

- Add variable: `GIST_ID` with your Gist ID from step 2

**Environment Secrets** (Settings → Environments → production → Environment secrets):

- `GIST_TOKEN`: Your GitHub token from step 3
- `DISCORD_WEBHOOK_AI`: Discord webhook URL for AI category
- `DISCORD_WEBHOOK_WORLDNEWS`: Discord webhook URL for World News category
- `DISCORD_WEBHOOK_YOUTUBE`: Discord webhook URL for YouTube category

**Note**: Add more webhook secrets as needed for additional categories. Format: `DISCORD_WEBHOOK_CATEGORYNAME`

### 7. Add RSS Feeds to README

Edit this README.md and add your RSS feeds under category sections (see examples below).

### 8. Enable GitHub Actions

1. Go to the Actions tab in your repository
2. Enable workflows if prompted
3. The workflow will run automatically every 15 minutes
4. You can also trigger it manually from the Actions tab

## RSS Feed Configuration

Add your RSS feeds below, organized by category. Each category should have:

- A level 2 heading (`## Category Name`)
- RSS feed URLs as list items or plain URLs

The category name will be converted to the webhook environment variable name. For example:

- `## AI` → `DISCORD_WEBHOOK_AI`
- `## World News` → `DISCORD_WEBHOOK_WORLDNEWS`

### Feeds

## AI

- https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml
- https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_engineering.xml

## WorldNews

- https://feeds.bbci.co.uk/news/world/rss.xml
- https://rss.nytimes.com/services/xml/rss/nyt/World.xml

## YouTube

- https://www.youtube.com/feeds/videos.xml?channel_id=UC0C-17n9iuUQPylguM1d-lQ

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js 20
- **RSS Parsing**: `rss-parser`
- **HTTP Requests**: `axios`
- **CI/CD**: GitHub Actions
- **Storage**: GitHub Gist API

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your credentials:

   ```env
   GIST_ID=your_gist_id
   GIST_TOKEN=your_github_token
   DISCORD_WEBHOOK_AI=your_webhook_url
   DISCORD_WEBHOOK_WORLDNEWS=your_webhook_url
   DISCORD_WEBHOOK_YOUTUBE=your_webhook_url
   ```

3. Build and run:
   ```bash
   npm run build
   npm start
   ```

## Adding New Categories

1. Add a new section in this README with your RSS feeds:

   ```markdown
   ## Gaming

   - https://example.com/gaming-feed.xml
   ```

2. Create a Discord webhook for the new category

3. Add the webhook URL to your `production` environment:
   - Go to Settings → Environments → production → Environment secrets
   - Add new secret: `DISCORD_WEBHOOK_GAMING`
   - Value: Your Discord webhook URL

4. Update `.github/workflows/rss-tracker.yml` to include the new secret in the `env` section:
   ```yaml
   DISCORD_WEBHOOK_GAMING: ${{ secrets.DISCORD_WEBHOOK_GAMING }}
   ```

**Note**: When you first add a new feed, the system will automatically initialize it by marking all existing items as "already seen" without posting them to Discord. This prevents spam in your channel. Only items published after the feed is added will be posted.

## How It Works

### First Run (New Feed)

When a feed is added for the first time:

1. The system fetches all items from the feed
2. Marks them as "already seen" in the tracking data
3. Does NOT post them to Discord (to avoid spam)
4. On subsequent runs, only genuinely new items will be posted

### Normal Operation

Once a feed is initialized:

1. Fetches items from all configured RSS feeds
2. Checks against tracking data to identify new items
3. Posts only new items to the corresponding Discord channel
4. Updates tracking data with newly posted items

## Troubleshooting

### Workflow not running

- Check that GitHub Actions is enabled in your repository settings
- Verify the workflow file is in `.github/workflows/`
- Check the Actions tab for any error messages

### No items being posted

- Verify your RSS feed URLs are correct and accessible
- Check that webhook URLs are valid
- Look at the workflow logs in the Actions tab
- Make sure the feeds have new items that haven't been posted before

### Discord webhook errors

- Verify webhook URLs are correct
- Check that the webhooks haven't been deleted in Discord
- Ensure webhook URLs are added as secrets correctly

## License

MIT
