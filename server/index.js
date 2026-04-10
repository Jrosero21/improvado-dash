const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const pool = mysql.createPool({
  host: "mainline.proxy.rlwy.net",
  port: 47875,
  database: "railway",
  user: "root",
  password: "ayIdaqoMxdNKlpOyFUbXhTBZMolSmpJO",
  waitForConnections: true,
  connectionLimit: 10,
});

const days = (req) => parseInt(req.query.days || 30);
const platform = (req) => req.query.platform || null;
const campaign = (req) => req.query.campaign || null;

// All date ranges anchor to the max date in the dataset so queries
// work correctly regardless of the current wall-clock date.
const W = (d, p, c) => {
  let w = `ad_date >= (SELECT DATE_SUB(MAX(ad_date), INTERVAL ${d} DAY) FROM unified_ads)`;
  if (p) w += ` AND platform = '${p.replace(/'/g, "''")}'`;
  if (c) w += ` AND campaign_name = '${c.replace(/'/g, "''")}'`;
  return w;
};
const Wprev = (d) =>
  `ad_date >= (SELECT DATE_SUB(MAX(ad_date), INTERVAL ${d * 2} DAY) FROM unified_ads)
   AND ad_date < (SELECT DATE_SUB(MAX(ad_date), INTERVAL ${d} DAY) FROM unified_ads)`;
const Wp = (d) => `date >= (SELECT DATE_SUB(MAX(ad_date), INTERVAL ${d} DAY) FROM unified_ads)`;

// GET /api/campaigns/list — unique campaign names for dropdown


app.get("/api/campaigns/list", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT campaign_name, platform FROM unified_ads ORDER BY platform, campaign_name`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/overview", async (req, res) => {
  try {
    const d = days(req); const p = platform(req); const c = campaign(req);
    const [rows] = await pool.query(
      `SELECT
        SUM(spend) as total_spend,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        SUM(video_views) as total_video_views,
        COUNT(DISTINCT campaign_name) as total_campaigns,
        MIN(ad_date) as date_from,
        MAX(ad_date) as date_to
      FROM unified_ads WHERE ${W(d, p, c)}`
    );
    const row = rows[0];
    row.ctr = row.total_impressions > 0 ? (row.total_clicks / row.total_impressions) * 100 : 0;
    row.cpa = row.total_conversions > 0 ? row.total_spend / row.total_conversions : 0;
    row.cpm = row.total_impressions > 0 ? (row.total_spend / row.total_impressions) * 1000 : 0;
    row.cvr = row.total_clicks > 0 ? (row.total_conversions / row.total_clicks) * 100 : 0;
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/overview/prev", async (req, res) => {
  try {
    const d = days(req);
    const [rows] = await pool.query(
      `SELECT
        SUM(spend) as total_spend,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions
      FROM unified_ads WHERE ${Wprev(d)}`
    );
    const row = rows[0];
    row.ctr = row.total_impressions > 0 ? (row.total_clicks / row.total_impressions) * 100 : 0;
    row.cpa = row.total_conversions > 0 ? row.total_spend / row.total_conversions : 0;
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/platforms", async (req, res) => {
  try {
    const d = days(req); const p = platform(req); const c = campaign(req);
    const [rows] = await pool.query(
      `SELECT
        platform,
        SUM(spend) as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions,
        SUM(video_views) as video_views
      FROM unified_ads WHERE ${W(d, p, c)}
      GROUP BY platform ORDER BY spend DESC`
    );
    res.json(rows.map(r => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpa: r.conversions > 0 ? r.spend / r.conversions : 0,
      cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
      cvr: r.clicks > 0 ? (r.conversions / r.clicks) * 100 : 0,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/timeseries", async (req, res) => {
  try {
    const d = days(req); const p = platform(req); const c = campaign(req);
    const [rows] = await pool.query(
      `SELECT
        ad_date as date, platform,
        SUM(spend) as spend,
        SUM(conversions) as conversions,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions
      FROM unified_ads WHERE ${W(d, p, c)}
      GROUP BY ad_date, platform ORDER BY ad_date ASC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/campaigns", async (req, res) => {
  try {
    const d = days(req); const p = platform(req); const c = campaign(req);
    const limit = parseInt(req.query.limit || 12);
    const [rows] = await pool.query(
      `SELECT
        platform, campaign_name,
        SUM(spend) as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions
      FROM unified_ads WHERE ${W(d, p, c)}
      GROUP BY platform, campaign_name
      ORDER BY spend DESC
      LIMIT ${limit}`
    );
    res.json(rows.map(r => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpa: r.conversions > 0 ? r.spend / r.conversions : 0,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/tiktok-funnel", async (req, res) => {
  try {
    const d = days(req);
    const [rows] = await pool.query(
      `SELECT
        SUM(video_views) as views,
        SUM(video_watch_25) as watch_25,
        SUM(video_watch_50) as watch_50,
        SUM(video_watch_75) as watch_75,
        SUM(video_watch_100) as watch_100,
        SUM(likes) as likes,
        SUM(shares) as shares,
        SUM(comments) as comments,
        SUM(cost) as spend,
        SUM(conversions) as conversions
      FROM tiktok_ads WHERE ${Wp(d)}`
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/google-quality", async (req, res) => {
  try {
    const d = days(req);
    const [rows] = await pool.query(
      `SELECT
        AVG(quality_score) as avg_quality_score,
        AVG(search_impression_share) as avg_impression_share,
        AVG(avg_cpc) as avg_cpc,
        SUM(conversion_value) as total_conversion_value,
        SUM(cost) as total_cost,
        SUM(conversions) as total_conversions
      FROM google_ads WHERE ${Wp(d)}`
    );
    const row = rows[0];
    row.roas = row.total_cost > 0 ? row.total_conversion_value / row.total_cost : 0;
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/facebook-engagement", async (req, res) => {
  try {
    const d = days(req);
    const [rows] = await pool.query(
      `SELECT
        AVG(engagement_rate) as avg_engagement_rate,
        AVG(frequency) as avg_frequency,
        SUM(reach) as total_reach,
        SUM(video_views) as total_video_views,
        SUM(spend) as total_spend,
        SUM(conversions) as total_conversions
      FROM facebook_ads WHERE ${Wp(d)}`
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { system, messages } = req.body;
  if (!messages?.length) return res.status(400).json({ error: "messages required" });
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: system || "You are a senior paid media analyst.",
      messages,
    });
    res.json({ content: response.content[0].text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Dashboard API → http://localhost:${PORT}`));
