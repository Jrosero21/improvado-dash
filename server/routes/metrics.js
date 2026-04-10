const express = require('express');
const router = express.Router();
const pool = require('../db');

function buildWhere(query) {
  const conditions = [];
  const params = [];

  if (query.platform && query.platform !== 'All') {
    conditions.push('platform = ?');
    params.push(query.platform);
  }
  if (query.campaign && query.campaign !== 'All') {
    conditions.push('campaign_name = ?');
    params.push(query.campaign);
  }
  if (query.week && query.week !== 'All') {
    conditions.push("DATE(ad_date - INTERVAL (WEEKDAY(ad_date)) DAY) = ?");
    params.push(query.week);
  }

  return {
    where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  };
}

// GET /api/metrics/summary
router.get('/summary', async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query);
    const [rows] = await pool.query(
      `SELECT
        SUM(spend) as total_spend,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        SUM(clicks) / NULLIF(SUM(impressions), 0) as blended_ctr,
        SUM(spend) / NULLIF(SUM(conversions), 0) as blended_cpa,
        SUM(spend) / NULLIF(SUM(impressions), 0) * 1000 as blended_cpm,
        SUM(video_views) / NULLIF(SUM(impressions), 0) as video_view_rate,
        COUNT(DISTINCT ad_date) as days_count
      FROM unified_ads ${where}`,
      params
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metrics/platforms
router.get('/platforms', async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query);
    const [rows] = await pool.query(
      `SELECT
        platform,
        SUM(spend) as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions,
        SUM(clicks) / NULLIF(SUM(impressions), 0) as ctr,
        SUM(spend) / NULLIF(SUM(conversions), 0) as cpa,
        SUM(spend) / NULLIF(SUM(impressions), 0) * 1000 as cpm,
        SUM(spend) / NULLIF(SUM(clicks), 0) as cpc,
        SUM(conversions) / NULLIF(SUM(clicks), 0) as conv_rate
      FROM unified_ads ${where}
      GROUP BY platform
      ORDER BY spend DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metrics/campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query);
    const [rows] = await pool.query(
      `SELECT
        platform,
        campaign_name,
        SUM(spend) as spend,
        SUM(conversions) as conversions,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        SUM(spend) / NULLIF(SUM(conversions), 0) as cpa,
        SUM(clicks) / NULLIF(SUM(impressions), 0) as ctr,
        SUM(conversions) / NULLIF(SUM(clicks), 0) as conv_rate
      FROM unified_ads ${where}
      GROUP BY platform, campaign_name
      ORDER BY cpa ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metrics/daily
router.get('/daily', async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query);
    const [rows] = await pool.query(
      `SELECT
        ad_date,
        platform,
        SUM(spend) as spend,
        SUM(conversions) as conversions,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks
      FROM unified_ads ${where}
      GROUP BY ad_date, platform
      ORDER BY ad_date ASC, platform ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metrics/weekly
router.get('/weekly', async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query);
    const [rows] = await pool.query(
      `SELECT
        DATE(ad_date - INTERVAL (WEEKDAY(ad_date)) DAY) as week_starting,
        SUM(spend) as spend,
        SUM(conversions) as conversions,
        SUM(spend) / NULLIF(SUM(conversions), 0) as cpa
      FROM unified_ads ${where}
      GROUP BY week_starting
      ORDER BY week_starting ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metrics/dayofweek
router.get('/dayofweek', async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query);
    const [rows] = await pool.query(
      `SELECT
        DAYNAME(ad_date) as day_name,
        DAYOFWEEK(ad_date) as day_no,
        AVG(daily_spend) as avg_spend,
        AVG(daily_conversions) as avg_conversions,
        AVG(daily_cpa) as avg_cpa
      FROM (
        SELECT
          ad_date,
          SUM(spend) as daily_spend,
          SUM(conversions) as daily_conversions,
          SUM(spend) / NULLIF(SUM(conversions), 0) as daily_cpa
        FROM unified_ads ${where}
        GROUP BY ad_date
      ) daily
      GROUP BY day_name, day_no
      ORDER BY day_no ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/metrics/campaigns/list  — just unique campaign names for filter dropdown
router.get('/campaigns/list', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT campaign_name, platform FROM unified_ads ORDER BY platform, campaign_name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
