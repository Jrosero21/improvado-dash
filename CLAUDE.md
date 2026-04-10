# Improvado Ad Analytics Dashboard

A modern, one-page analytics dashboard built with React, Vite, and Tailwind CSS. Displays cross-channel advertising performance data from a live MySQL database (Railway), styled to match Improvado's dark, data-forward aesthetic. Includes an integrated Claude AI chatbot that can answer questions about the dataset and provide analysis.

---

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS** for styling
- **Recharts** for all chart visualizations
- **Anthropic Claude API** (`claude-sonnet-4-5`) for the embedded chatbot
- **MySQL2** for database queries (server-side only via API routes)
- **Express** as a lightweight API server for DB queries and Claude proxy

---

## Project Structure

```
improvado-dashboard/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── KPICard.jsx
│   │   │   ├── SpendTrendChart.jsx
│   │   │   ├── DonutChart.jsx
│   │   │   ├── CampaignBarChart.jsx
│   │   │   ├── DayOfWeekChart.jsx
│   │   │   ├── DailyConversionsChart.jsx
│   │   │   ├── PlatformMatrix.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   └── FilterBar.jsx
│   │   ├── hooks/
│   │   │   └── useAdData.js
│   │   ├── lib/
│   │   │   └── utils.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── index.js          ← Express API server
│   ├── db.js             ← MySQL connection pool
│   ├── routes/
│   │   ├── metrics.js    ← All dashboard data endpoints
│   │   └── chat.js       ← Claude API proxy endpoint
│   └── package.json
├── .env.example
└── README.md
```

---

## Database Connection

**Railway MySQL — already live, do not change these:**

```
Host:     mainline.proxy.rlwy.net
Port:     47875
Database: railway
User:     root
Password: (set in .env as DB_PASSWORD)
```

### Tables

**`unified_ads`** — primary table for all dashboard metrics
| Column | Type | Description |
|---|---|---|
| `ad_date` | DATE | Date of the record |
| `platform` | VARCHAR | `Facebook`, `Google`, or `TikTok` |
| `campaign_name` | VARCHAR | Campaign identifier |
| `impressions` | INT | Times ad was shown |
| `clicks` | INT | Times ad was clicked |
| `spend` | DECIMAL | Amount spent in USD |
| `conversions` | INT | Goal completions |
| `video_views` | INT | Video views (TikTok and Facebook only) |

**`facebook_ads`** — raw Facebook data (supplemental)
**`google_ads`** — raw Google data (supplemental)
**`tiktok_ads`** — raw TikTok data with engagement (supplemental)

### Key SQL Patterns

```sql
-- Platform summary
SELECT
  platform,
  SUM(spend) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(clicks) / NULLIF(SUM(impressions), 0) as ctr,
  SUM(spend) / NULLIF(SUM(conversions), 0) as cpa,
  (SUM(spend) / NULLIF(SUM(impressions), 0)) * 1000 as cpm,
  SUM(spend) / NULLIF(SUM(clicks), 0) as cpc,
  SUM(conversions) / NULLIF(SUM(clicks), 0) as conv_rate,
  SUM(video_views) / NULLIF(SUM(impressions), 0) as video_view_rate
FROM unified_ads
GROUP BY platform
ORDER BY total_spend DESC;

-- Daily spend by platform
SELECT ad_date, platform, SUM(spend) as spend
FROM unified_ads
GROUP BY ad_date, platform
ORDER BY ad_date ASC, platform ASC;

-- Campaign breakdown
SELECT platform, campaign_name,
  SUM(spend) as spend,
  SUM(conversions) as conversions,
  SUM(spend) / NULLIF(SUM(conversions), 0) as cpa,
  SUM(clicks) / NULLIF(SUM(impressions), 0) as ctr,
  SUM(conversions) / NULLIF(SUM(clicks), 0) as conv_rate
FROM unified_ads
GROUP BY platform, campaign_name
ORDER BY cpa ASC;

-- Day of week performance
SELECT
  DAYNAME(ad_date) as day_name,
  DAYOFWEEK(ad_date) as day_no,
  AVG(daily_spend) as avg_spend,
  AVG(daily_conversions) as avg_conversions
FROM (
  SELECT ad_date,
    SUM(spend) as daily_spend,
    SUM(conversions) as daily_conversions
  FROM unified_ads
  GROUP BY ad_date
) daily
GROUP BY day_name, day_no
ORDER BY day_no ASC;

-- Weekly rollup
SELECT
  DATE(ad_date - INTERVAL (WEEKDAY(ad_date)) DAY) as week_starting,
  SUM(spend) as week_spend,
  SUM(conversions) as week_conversions,
  SUM(spend) / NULLIF(SUM(conversions), 0) as week_cpa
FROM unified_ads
GROUP BY week_starting
ORDER BY week_starting ASC;
```

---

## API Endpoints (Express server)

```
GET  /api/metrics/summary        → top-level KPIs
GET  /api/metrics/platforms      → per-platform breakdown
GET  /api/metrics/campaigns      → per-campaign breakdown
GET  /api/metrics/daily          → daily spend + conversions by platform
GET  /api/metrics/weekly         → weekly rollup
GET  /api/metrics/dayofweek      → avg metrics by day of week
POST /api/chat                   → Claude chatbot proxy
```

All endpoints support optional query params: `?platform=TikTok`, `?campaign=Search_Brand_Terms`

---

## Dashboard KPIs — Verified Values (Jan 1–30, 2024)

Use these exact values to verify the dashboard is pulling data correctly:

| Metric | Value |
|---|---|
| Total Spend | $130,245 |
| Total Impressions | 40,473,185 |
| Total Clicks | 688,333 |
| Total Conversions | 13,363 |
| Blended CTR | 1.70% |
| Blended CPA | $9.75 |
| Blended CPM | $3.22 |
| Avg Daily Spend | $4,341 |
| Avg Daily Conversions | 445 |
| Video View Rate (blended) | 61.1% |

### Platform Breakdown

| Platform | Spend | Impressions | Clicks | Conversions | CTR | CPA | CPM | Conv Rate |
|---|---|---|---|---|---|---|---|---|
| TikTok | $74,267 | 28,708,167 | 461,844 | 6,750 | 1.61% | $11.00 | $2.59 | 1.46% |
| Google | $37,686 | 7,223,544 | 137,590 | 4,218 | 1.90% | $8.93 | $5.22 | 3.07% |
| Facebook | $18,292 | 4,541,474 | 88,899 | 2,395 | 1.96% | $7.64 | $4.03 | 2.69% |

### Campaign Breakdown (sorted by CPA)

| Platform | Campaign | Spend | Conversions | CPA | CTR | Conv Rate |
|---|---|---|---|---|---|---|
| Google | Search_Brand_Terms | $7,368 | 1,445 | $5.10 | 5.22% | 3.74% |
| Facebook | Conversions_Retargeting | $6,371 | 1,070 | $5.95 | 4.63% | 6.26% |
| Google | Shopping_All_Products | $11,417 | 1,801 | $6.34 | 3.34% | 2.88% |
| Facebook | Traffic_Drive_Jan | $5,574 | 741 | $7.52 | 3.68% | 2.03% |
| Facebook | Brand_Awareness_Q1 | $4,088 | 433 | $9.44 | 2.03% | 1.50% |
| Google | Display_Remarketing | $3,353 | 345 | $9.72 | 0.36% | 2.79% |
| TikTok | Influencer_Collab | $26,312 | 2,653 | $9.92 | 1.62% | 1.55% |
| TikTok | Conversion_Focus | $20,606 | 2,061 | $10.00 | 1.91% | 2.71% |
| TikTok | Awareness_GenZ | $15,640 | 1,203 | $13.00 | 1.47% | 1.01% |
| TikTok | Traffic_Campaign | $11,709 | 833 | $14.06 | 1.57% | 0.86% |
| Facebook | Video_Views_Campaign | $2,259 | 151 | $14.96 | 0.36% | 2.39% |
| Google | Search_Generic_Terms | $15,549 | 627 | $24.80 | 1.99% | 2.59% |

### Day of Week Performance

| Day | Avg Spend | Avg Conversions | Avg CTR | Avg CPA |
|---|---|---|---|---|
| Monday | $4,174 | 420 | 1.72% | $9.97 |
| Tuesday | $4,316 | 450 | 1.75% | $9.58 |
| Wednesday | $4,403 | 452 | 1.78% | $9.80 |
| **Thursday** | **$4,690** | **496** | **1.68%** | **$9.41** |
| Friday | $4,590 | 466 | 1.65% | $9.91 |
| Saturday | $4,168 | 427 | 1.66% | $9.73 |
| Sunday | $4,097 | 414 | 1.76% | $9.89 |

### Weekly Trend

| Week | Spend | Conversions | CPA |
|---|---|---|---|
| Jan 1 | $23,183 | 2,390 | $9.70 |
| Jan 8 | $28,491 | 2,904 | $9.81 |
| Jan 15 | $33,383 | 3,421 | $9.76 |
| Jan 22 | $35,213 | 3,624 | $9.72 |
| Jan 29 | $9,975 | 1,024 | $9.74 |

---

## Design System

Match Improvado's dark, data-forward aesthetic. Clean, not flashy.

### Colors

```js
// tailwind.config.js — extend theme with these
colors: {
  brand: {
    purple: '#6E3BFF',    // primary accent
    blue:   '#00C2FF',    // secondary accent (use sparingly)
  },
  canvas:  '#0A0B0F',     // page background
  card:    '#13141A',     // card background
  surface: '#1C1D26',     // elevated surface
  border:  '#2A2B35',     // borders
  text: {
    primary: '#F2F2F5',
    muted:   '#6B6D7A',
  },
  platform: {
    facebook: '#1877F2',
    google:   '#34A853',
    tiktok:   '#EE1D52',
  },
  status: {
    success: '#00C48C',   // good CPA, positive delta
    danger:  '#FF4D6A',   // bad CPA, negative delta
    warning: '#F5A623',
  }
}
```

### Typography
- Font: `Inter` (import from Google Fonts) or `system-ui`
- Heading sizes: 22px / 18px / 14px
- Body: 14px regular, 13px muted
- All weights: 400 or 500 only — never 600 or 700

### Card Design
```css
/* All cards use these base styles */
background: #13141A;
border: 1px solid #2A2B35;
border-radius: 12px;
padding: 20px 24px;
```

### KPI Cards
- Top accent border: 2px solid #6E3BFF
- Large number: 24px, weight 500
- Label: 12px, muted color
- CPA card: text turns #FF4D6A when value > 10, #00C48C when ≤ 10

### Platform Color Rules
- Always use platform colors consistently across every chart
- Facebook: `#1877F2`, Google: `#34A853`, TikTok: `#EE1D52`
- Legend always shows these colors — never auto-assign

---

## Visualizations (use Recharts)

### 1. KPI Cards Row (7 cards, top of page)
- Total Spend
- Avg Daily Spend
- Total Impressions
- Total Conversions
- Avg Daily Conversions
- Blended CTR
- Blended CPA ← conditional color

### 2. Spend Trend Line Chart
- X: date, Y: spend in USD
- Three lines — one per platform, platform colors
- Default: weekly aggregation
- Toggle button to switch between Weekly / Daily view
- Recharts `LineChart` with `ResponsiveContainer`

### 3. Spend Distribution Donut
- Recharts `PieChart` with `innerRadius`
- Three slices, platform colors
- Labels: platform name + percentage
- Center text: "Total Spend" + "$130,245"

### 4. CPA by Platform & Campaign Bar Chart
- Recharts `BarChart` horizontal
- Toggle between Platform view (3 bars) and Campaign view (12 bars)
- Platform colors on bars
- Reference line at $10 in red (#FF4D6A, dashed)
- Data labels on bars

### 5. Avg Performance by Day of Week
- Recharts `BarChart` (vertical, grouped/clustered)
- Two series: Avg Spend (purple #6E3BFF) + Avg Conversions (green #00C48C)
- X: Mon–Sun in correct order (not alphabetical)
- Reference lines for averages ($4,341 and 445)
- Tooltip shows: day name, avg spend, avg conversions, % vs average for each

### 6. Daily Conversions Stacked Column
- Recharts `BarChart` stacked
- X: date (Jan 1–30), Y: conversions
- Three stacked segments per bar, platform colors
- Shows the Jan 11 budget ramp clearly

### 7. Platform Efficiency Table
- Plain HTML table with dark styling
- Columns: Platform, Spend, Impressions, CPM, Clicks, CTR, Conversions, CPA
- Sorted by CPA ascending
- Platform name colored in brand color
- CPA cell: red background if > $10

---

## Filter Bar

Three filters at the top of the page, above the KPI cards:
- **Week** — dropdown, options: All, Week of Jan 1, Jan 8, Jan 15, Jan 22, Jan 29
- **Platform** — toggle buttons (All / Facebook / Google / TikTok), styled with brand colors
- **Campaign** — dropdown, lists all 12 campaign names + "All"

All filters apply to all charts simultaneously. When a filter is active, all charts re-fetch or re-filter their data.

---

## Chatbot Integration

### Overview
A floating chat panel, anchored bottom-right of the page. Toggle open/closed with a chat icon button. When open, renders as a card panel (not a modal) — roughly 380px wide, 500px tall.

### Claude API Setup
```js
// server/routes/chat.js
// POST /api/chat
// Proxies to Anthropic API — never expose the API key to the client

const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// System prompt — inject actual data context
const SYSTEM_PROMPT = `
You are an expert marketing data analyst embedded in an advertising analytics dashboard.
You have access to cross-channel advertising data from Facebook, Google, and TikTok
for January 2024. Here is the complete dataset context:

OVERALL METRICS:
- Total Spend: $130,245
- Total Impressions: 40,473,185
- Total Clicks: 688,333
- Total Conversions: 13,363
- Blended CTR: 1.70%
- Blended CPA: $9.75 (target is under $10)
- Blended CPM: $3.22
- Avg Daily Spend: $4,341
- Avg Daily Conversions: 445

PLATFORM BREAKDOWN:
- TikTok: 57% of spend ($74,267), CPA $11.00 (OVER $10 THRESHOLD), CTR 1.61%, Conv Rate 1.46%
- Google: 29% of spend ($37,686), CPA $8.93, CTR 1.90%, Conv Rate 3.07%
- Facebook: 14% of spend ($18,292), CPA $7.64, CTR 1.96%, Conv Rate 2.69%

CAMPAIGN PERFORMANCE (sorted by CPA):
- Google Search_Brand_Terms: $5.10 CPA, 5.22% CTR — best campaign
- Facebook Conversions_Retargeting: $5.95 CPA, 6.26% Conv Rate — most efficient traffic
- Google Shopping_All_Products: $6.34 CPA
- Facebook Traffic_Drive_Jan: $7.52 CPA
- Facebook Brand_Awareness_Q1: $9.44 CPA
- Google Display_Remarketing: $9.72 CPA
- TikTok Influencer_Collab: $9.92 CPA
- TikTok Conversion_Focus: $10.00 CPA
- TikTok Awareness_GenZ: $13.00 CPA
- TikTok Traffic_Campaign: $14.06 CPA
- Facebook Video_Views_Campaign: $14.96 CPA — worst Facebook campaign
- Google Search_Generic_Terms: $24.80 CPA — worst campaign overall (5x more than Brand Terms)

DAY OF WEEK INSIGHTS:
- Thursday: best day — avg spend $4,690 (+8% vs avg), avg conversions 496 (+11.3% vs avg), CPA $9.41
- Sunday: worst day — avg spend $4,097 (-5.6% vs avg), avg conversions 414 (-7.1% vs avg)
- Thursday delivers 11.3% more conversions than average despite only 8% more spend

WEEKLY TREND:
- Budget grew 52% from Week 1 ($23,183) to Week 4 ($35,213)
- CPA remained stable throughout the ramp ($9.70 → $9.72)

KEY INSIGHTS:
1. Facebook is significantly underfunded — 14% of budget, 17.9% of conversions
2. TikTok is overfunded — 57% of budget, 50.5% of conversions, only platform over $10 CPA
3. Google Search Generic Terms is a money pit at $24.80 CPA vs Brand Terms at $5.10
4. Recommended reallocation: shift 10-15% from TikTok to Facebook Retargeting + Google Brand Terms
5. Thursday is consistently the most efficient day across all metrics

Answer questions about this data concisely and precisely. Provide specific numbers.
If asked for recommendations, be direct and data-driven.
Keep responses under 150 words unless a detailed analysis is specifically requested.
Do not make up data that is not in the context above.
`;
```

### Chatbot UI Requirements
- Dark themed, matches dashboard cards
- Input field at bottom, send button
- Message bubbles: user messages right-aligned (purple bg), assistant messages left-aligned (card surface bg)
- Typing indicator (three animated dots) while waiting for response
- Suggested starter questions displayed when chat is empty:
  - "Which platform has the best CPA?"
  - "Why is TikTok underperforming?"
  - "What's the Thursday insight?"
  - "Where should we reallocate budget?"
- Clear chat button in header
- Error state if API call fails

---

## Environment Variables

```bash
# .env (server)
DB_HOST=mainline.proxy.rlwy.net
DB_PORT=47875
DB_NAME=railway
DB_USER=root
DB_PASSWORD=your_railway_password_here
ANTHROPIC_API_KEY=your_anthropic_key_here
PORT=3001

# client/.env
VITE_API_URL=http://localhost:3001
```

---

## Getting Started

```bash
# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install

# Start server (port 3001)
cd server && node index.js

# Start client (port 5173)
cd client && npm run dev
```

---

## Key Business Insights to Surface

These are the most important findings — make sure each is visible or discoverable on the dashboard:

1. **CPA Alert** — TikTok CPA is $11.00, over the $10 threshold. The CPA card should visually flag this.
2. **Budget Inversion** — Facebook generates 17.9% of conversions on 14% of budget. TikTok generates 50.5% on 57%.
3. **5× Campaign Gap** — Google Brand Terms ($5.10) vs Generic Terms ($24.80) on the same platform.
4. **Thursday Effect** — Thursday delivers 11.3% more conversions AND 3.6% cheaper CPA vs the daily average.
5. **Budget Ramp** — 52% spend increase from Week 1 to Week 4, with CPA virtually unchanged.

---

## Notes for Claude Code

- Keep the server simple — Express with MySQL2, no ORM needed
- All DB queries run server-side only. The client never connects to MySQL directly.
- The Claude API key is proxied through the server — never expose it in client code
- Use Recharts for all charts — it's React-native and works with Vite out of the box
- Start with hardcoded data to verify the UI, then wire up the API endpoints
- The chatbot system prompt already contains all the data — Claude does not need to query the DB in real-time. The context is baked into the system prompt.
- If you need to query live data for the chatbot (advanced), you can add a tool to the Claude API call that runs SQL queries — but the baked-in context is sufficient for this project.
