# RSS Drainer

An automated RSS feed tracker that runs as a GitHub Action cronjob and posts new items to Discord channels via webhooks.

## Overview

RSS Drainer monitors multiple RSS feeds organized by category (e.g., AI, World News, YouTube) and automatically posts new items to corresponding Discord channels. It runs every 15 minutes as a GitHub Action, ensuring near real-time updates without manual intervention.

## Key Features

- **Automated Monitoring**: Runs every 15 minutes via GitHub Actions
- **Category-Based Organization**: RSS feeds organized by sections in README.md
- **Discord Integration**: Posts to separate Discord channels per category using webhooks
- **Persistent Tracking**: Uses GitHub Gist to track posted items and avoid duplicates
- **Easy Configuration**: Update RSS feeds directly from GitHub web interface by editing README.md
- **Secure Credentials**: Discord webhook URLs stored as GitHub Actions secrets

## Architecture

### Components

1. **RSS Parser** (`src/rss-parser.js`)
   - Fetches and parses RSS feeds
   - Extracts title, link, and publish date from feed items

2. **README Parser** (`src/readme-parser.js`)
   - Reads and parses README.md
   - Extracts feed URLs organized by category sections
   - Maps categories to Discord webhook secret names

3. **Tracking Manager** (`src/tracking.js`)
   - Manages GitHub Gist for storing posted items
   - Checks if items have already been posted
   - Updates tracking data after successful posts

4. **Discord Poster** (`src/discord.js`)
   - Posts formatted messages to Discord channels
   - Handles webhook API calls
   - Simple title + link format

5. **Main Orchestrator** (`src/index.js`)
   - Coordinates all components
   - Processes each category and feed
   - Error handling and logging

### Data Flow

1. GitHub Action triggers on schedule (every 15 minutes)
2. Script reads README.md to get categorized feed URLs
3. For each category:
   - Fetch RSS feed items
   - Check against GitHub Gist tracking data
   - Filter out already-posted items
   - Post new items to category's Discord channel
   - Update GitHub Gist with newly posted items

## Configuration

### GitHub Secrets Required

- `GIST_TOKEN`: GitHub Personal Access Token with gist permissions
- `GIST_ID`: ID of the GitHub Gist used for tracking
- `DISCORD_WEBHOOK_AI`: Discord webhook URL for AI category
- `DISCORD_WEBHOOK_WORLDNEWS`: Discord webhook URL for World News category
- `DISCORD_WEBHOOK_YOUTUBE`: Discord webhook URL for YouTube category
- *(Add more webhook secrets as needed for additional categories)*

### README.md Format

The README.md should contain sections with RSS feed URLs:

```markdown
## AI
- https://example.com/ai-feed.xml
- https://another-ai-source.com/rss

## WorldNews
- https://news-source.com/rss
- https://global-news.com/feed.xml

## YouTube
- https://youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
```

Section names are converted to webhook secret names (e.g., "AI" → `DISCORD_WEBHOOK_AI`)

## Technology Stack

- **Runtime**: Node.js 20
- **RSS Parsing**: `rss-parser` library
- **HTTP Requests**: `axios` library
- **Markdown Parsing**: Custom regex-based parser
- **CI/CD**: GitHub Actions
- **Storage**: GitHub Gist API

## Benefits

- ✅ No server hosting required - runs on GitHub infrastructure
- ✅ Free for public repositories
- ✅ Easy to maintain and update via GitHub web interface
- ✅ Reliable Discord delivery
- ✅ No database setup needed
- ✅ Clean separation of concerns
- ✅ Version controlled configuration
