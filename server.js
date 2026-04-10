const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
app.use(cors());
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
    const d = days(req);
    const [rows] = await pool.execute(
      `SELECT
        SUM(spend) as total_spend,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        SUM(video_views) as total_video_views,
        COUNT(DISTINCT campaign_name) as total_campaigns,
        MIN(ad_date) as date_from,
        MAX(ad_date) as date_to
      FROM unified_ads
      WHERE ad_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [d]
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
    const [rows] = await pool.execute(
      `SELECT
        SUM(spend) as total_spend,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions
      FROM unified_ads
      WHERE ad_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND ad_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [d * 2, d]
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
    const d = days(req);
    const [rows] = await pool.execute(
      `SELECT
        platform,
        SUM(spend) as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions,
        SUM(video_views) as video_views
      FROM unified_ads
      WHERE ad_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY platform
      ORDER BY spend DESC`,
      [d]
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
    const d = days(req);
    const [rows] = await pool.execute(
      `SELECT
        ad_date as date,
        platform,
        SUM(spend) as spend,
        SUM(conversions) as conversions,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions
      FROM unified_ads
      WHERE ad_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY ad_date, platform
      ORDER BY ad_date ASC`,
      [d]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/campaigns", async (req, res) => {
  try {
    const d = days(req);
    const limit = parseInt(req.query.limit || 12);
    const [rows] = await pool.execute(
      `SELECT
        platform,
        campaign_name,
        SUM(spend) as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions
      FROM unified_ads
      WHERE ad_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY platform, campaign_name
      ORDER BY spend DESC
      LIMIT ?`,
      [d, limit]
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
    const [rows] = await pool.execute(
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
      FROM tiktok_ads
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [d]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/google-quality", async (req, res) => {
  try {
    const d = days(req);
    const [rows] = await pool.execute(
      `SELECT
        AVG(quality_score) as avg_quality_score,
        AVG(search_impression_share) as avg_impression_share,
        AVG(avg_cpc) as avg_cpc,
        SUM(conversion_value) as total_conversion_value,
        SUM(cost) as total_cost,
        SUM(conversions) as total_conversions
      FROM google_ads
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [d]
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
    const [rows] = await pool.execute(
      `SELECT
        AVG(engagement_rate) as avg_engagement_rate,
        AVG(frequency) as avg_frequency,
        SUM(reach) as total_reach,
        SUM(video_views) as total_video_views,
        SUM(spend) as total_spend,
        SUM(conversions) as total_conversions
      FROM facebook_ads
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [d]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Dashboard API → http://localhost:${PORT}`));
