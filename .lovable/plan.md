
# Fix: Accurate AI Location Extraction via Page Scraping

## Problem

The current `extract-location` edge function sends **only the raw URL** to the AI model. The AI has no access to the actual video caption, hashtags, location tags, or transcript -- so it fabricates results based on username patterns alone.

**Test evidence:**
- `@foodwithmichel/video/...` → AI guessed "Trending Restaurant via @foodwithmichel, Los Angeles" (made up)
- `@gordonramsay/video/...` → AI guessed "Gordon Ramsay Restaurant, London" (made up)

These outputs have near-zero accuracy because the model never sees the actual content.

## Solution: Scrape Page Content with Firecrawl, Then Extract

```text
Current flow:
  URL string → AI guesses → garbage output

New flow:
  URL string → Firecrawl scrapes page → AI reads real content → accurate output
```

### Step 1: Connect Firecrawl

Firecrawl is available as a connector and will scrape TikTok/IG pages to extract captions, hashtags, location tags, and any visible text (which often contains place names, addresses, and city mentions).

### Step 2: Rewrite the `extract-location` Edge Function

The updated function will:

1. **Receive the URL** from the client (no change)
2. **Scrape the page** using Firecrawl API (`/v1/scrape`) with `formats: ['markdown']` to get all visible text content -- video captions, hashtags, comments, location tags, profile bio text
3. **Send scraped content + URL** to the AI model, giving it real data to work with instead of just a URL string
4. **Fall back gracefully** -- if Firecrawl fails (e.g., page requires login), still attempt URL-only extraction but flag it as low confidence

### Step 3: Improve the AI Prompt

Update the system prompt to:
- Prioritize extracting locations from actual caption text, hashtags, and tagged locations
- Look for address patterns, city names, country mentions, and "📍" location pins common in social posts
- Return a `confidence` field ("high", "medium", "low") so the UI can warn users when results are uncertain

### Step 4: Update the Frontend

- Show a confidence indicator on extracted results (e.g., green check for high, yellow warning for low)
- Display the source caption text so users can verify the extraction

## Technical Details

### Edge Function Changes (`supabase/functions/extract-location/index.ts`)

The function will be restructured to:

```text
1. Parse incoming URL
2. Call Firecrawl scrape API:
   - POST https://api.firecrawl.dev/v1/scrape
   - body: { url, formats: ['markdown'], onlyMainContent: true }
   - Auth: Bearer FIRECRAWL_API_KEY
3. Extract markdown content from response
4. Send to AI gateway with enriched prompt:
   - System: "Extract location from this social media post content..."
   - User: "URL: {url}\n\nPage content:\n{scraped_markdown}"
5. Add confidence field to tool schema
6. Return structured result
```

### Tool Schema Updates

Add to the extraction schema:
- `confidence`: "high" | "medium" | "low" -- based on how much location data was found in the content
- `source_caption`: the raw caption text from the post (for user verification)

### Frontend Updates

- `PasteLinkInput.tsx`: Show confidence badge and source caption in results card
- `Share.tsx`: Same confidence indicator for mobile share flow

### Config

- Add `[functions.extract-location]` entry in config.toml (already exists, no change needed)
- Firecrawl connector will inject `FIRECRAWL_API_KEY` as an environment variable

## Testing Plan

After implementation, we will test with real TikTok and Instagram URLs across different content types (food spots, gyms, travel destinations, cafes) to validate accuracy improvements. The confidence field will help identify which extractions need manual review.
