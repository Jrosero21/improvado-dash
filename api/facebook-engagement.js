const getPool = require('./_db');
const { days, Wp } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pool = getPool();
  try {
    const d = days(req);
    const [rows] = await pool.query(
      `SELECT AVG(engagement_rate) as avg_engagement_rate,
        AVG(frequency) as avg_frequency,
        SUM(reach) as total_reach,
        SUM(video_views) as total_video_views
      FROM facebook_ads WHERE ${Wp(d)}`
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
