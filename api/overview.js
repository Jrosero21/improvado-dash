const getPool = require('./_db');
const { days, platform, campaign, W, Wprev } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pool = getPool();
  try {
    const d = days(req); const p = platform(req); const c = campaign(req);
    const isPrev = req.query.prev === '1';
    const where = isPrev ? Wprev(d) : W(d, p, c);
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
      FROM unified_ads WHERE ${where}`
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
};
