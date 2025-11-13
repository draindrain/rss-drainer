# RSS Drainer - Implementation Plan

## Phase 1: Project Setup

### 1.1 Initialize Node.js Project
- [ ] Create `package.json` with project metadata
- [ ] Add dependencies: `rss-parser`, `axios`
- [ ] Add dev dependencies: `eslint` (optional)
- [ ] Create `.gitignore` file (node_modules, .env, etc.)

### 1.2 Create Project Structure
- [ ] Create `src/` directory for source code
- [ ] Create placeholder files:
  - `src/index.js` - Main entry point
  - `src/rss-parser.js` - RSS feed parsing
  - `src/readme-parser.js` - README.md parsing
  - `src/tracking.js` - GitHub Gist tracking
  - `src/discord.js` - Discord webhook posting

## Phase 2: Core Functionality

### 2.1 README Parser (`src/readme-parser.js`)
- [ ] Read README.md file
- [ ] Parse markdown sections (headers)
- [ ] Extract RSS feed URLs under each section
- [ ] Return structured data: `{ category: [feed1, feed2, ...] }`
- [ ] Handle edge cases (empty sections, malformed URLs)

### 2.2 RSS Feed Parser (`src/rss-parser.js`)
- [ ] Initialize rss-parser library
- [ ] Create function to fetch and parse single RSS feed
- [ ] Extract item data: title, link, guid/id, pubDate
- [ ] Handle parsing errors gracefully
- [ ] Return normalized item objects

### 2.3 GitHub Gist Tracking (`src/tracking.js`)
- [ ] Create function to fetch Gist content via GitHub API
- [ ] Parse tracking data (JSON format: `{ "item-guid": timestamp }`)
- [ ] Create function to check if item already posted
- [ ] Create function to update Gist with new posted items
- [ ] Handle Gist not found (initialize new one)
- [ ] Error handling for API failures

### 2.4 Discord Poster (`src/discord.js`)
- [ ] Create function to post message to Discord webhook
- [ ] Format message (simple: title + link)
- [ ] Handle rate limiting (Discord allows 30 requests/min per webhook)
- [ ] Add retry logic for failed posts
- [ ] Return success/failure status

### 2.5 Main Orchestrator (`src/index.js`)
- [ ] Load environment variables (webhook URLs, Gist token, Gist ID)
- [ ] Parse README.md to get categorized feeds
- [ ] Load tracking data from Gist
- [ ] For each category:
  - [ ] Get Discord webhook URL from environment
  - [ ] For each feed in category:
    - [ ] Fetch and parse RSS feed
    - [ ] Filter out already-posted items
    - [ ] Post new items to Discord
    - [ ] Update tracking data
- [ ] Save updated tracking data to Gist
- [ ] Log summary (feeds checked, items posted, errors)
- [ ] Handle errors without crashing

## Phase 3: GitHub Actions Integration

### 3.1 Create Workflow File
- [ ] Create `.github/workflows/` directory
- [ ] Create `rss-tracker.yml` workflow file
- [ ] Configure schedule trigger (cron: every 15 minutes)
- [ ] Add manual trigger option (workflow_dispatch)
- [ ] Set up Node.js 20 environment
- [ ] Configure checkout action

### 3.2 Configure Workflow Steps
- [ ] Checkout repository
- [ ] Set up Node.js
- [ ] Install dependencies (`npm ci`)
- [ ] Run main script
- [ ] Add error handling and notifications

### 3.3 Environment Variables
- [ ] Document required secrets in README
- [ ] Add example for setting up GitHub secrets
- [ ] Add instructions for creating Gist and getting Gist ID

## Phase 4: README.md Configuration

### 4.1 Create Example README.md
- [ ] Add project title and description
- [ ] Add setup instructions
- [ ] Create example RSS feed sections:
  - [ ] AI section with example feeds
  - [ ] WorldNews section with example feeds
  - [ ] YouTube section with example feeds
- [ ] Add instructions for adding new categories
- [ ] Document required secret naming convention

### 4.2 Documentation
- [ ] Setup guide (GitHub secrets, Gist creation)
- [ ] How to add new RSS feeds
- [ ] How to add new categories/Discord channels
- [ ] Troubleshooting section

## Phase 5: Testing & Validation

### 5.1 Local Testing
- [ ] Test README parser with sample README.md
- [ ] Test RSS parser with real feeds
- [ ] Test GitHub Gist API (create test gist)
- [ ] Test Discord webhook posting (test channel)
- [ ] Test full flow end-to-end locally with .env file

### 5.2 GitHub Actions Testing
- [ ] Set up GitHub secrets in repository
- [ ] Create test Gist
- [ ] Test manual workflow trigger
- [ ] Verify scheduled runs work correctly
- [ ] Check Discord messages format and delivery
- [ ] Verify tracking prevents duplicate posts

### 5.3 Edge Cases
- [ ] Test with empty RSS feeds
- [ ] Test with malformed RSS feeds
- [ ] Test with network failures
- [ ] Test with invalid webhook URLs
- [ ] Test with Gist API failures
- [ ] Ensure graceful degradation

## Phase 6: Refinements

### 6.1 Error Handling
- [ ] Add comprehensive logging
- [ ] Add error notifications (optional: Discord DM or separate channel)
- [ ] Handle rate limiting gracefully
- [ ] Add retry logic for transient failures

### 6.2 Performance Optimization
- [ ] Batch Discord posts if many new items (avoid rate limits)
- [ ] Add concurrency control for RSS fetching
- [ ] Optimize Gist updates (single update per run)

### 6.3 Optional Enhancements
- [ ] Add support for feed-specific posting limits
- [ ] Add filtering by keywords
- [ ] Add date-based filtering (don't post items older than X days)
- [ ] Add healthcheck endpoint or status badge

## Implementation Order

1. **Start Here**: Phase 1 (Project Setup)
2. **Core Logic**: Phase 2.1 → 2.2 → 2.3 → 2.4 → 2.5
3. **README**: Phase 4.1 (needed for testing)
4. **Local Testing**: Phase 5.1
5. **GitHub Actions**: Phase 3
6. **Production Testing**: Phase 5.2 & 5.3
7. **Polish**: Phase 6

## Notes

- Each phase can be tested independently before moving to the next
- Commit after each major component is working
- Use console.log liberally for debugging during development
- Test with a private Discord server first before using production channels
