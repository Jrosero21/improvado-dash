const getPool = require('./_db');
const { days, Wp } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pool = getPool();
  try {
    const d = days(req);
    const [rows] = await pool.query(
      `SELECT SUM(video_views) as views, SUM(video_watch_25) as watch_25,
        SUM(video_watch_50) as watch_50, SUM(video_watch_75) as watch_75,
        SUM(video_watch_100) as watch_100, SUM(likes) as likes,
        SUM(shares) as shares, SUM(comments) as comments
      FROM tiktok_ads WHERE ${Wp(d)}`
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
