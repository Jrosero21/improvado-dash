const getPool = require('./_db');
const { days, platform, campaign, W } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pool = getPool();
  try {
    const d = days(req); const p = platform(req); const c = campaign(req);
    const [rows] = await pool.query(
      `SELECT platform,
        SUM(spend) as spend, SUM(impressions) as impressions,
        SUM(clicks) as clicks, SUM(conversions) as conversions,
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
};
