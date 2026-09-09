module.exports = async (req, res) => {
  const date = req.query.date
  const action = req.query.action // 'add' or 'del'

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (date && kvUrl && kvToken) {
    try {
      const year = date.split('-')[0] || '2026'
      const setKey = `pcl_checkin_set_${year}`

      if (action === 'del') {
        await fetch(`${kvUrl}/srem/${setKey}/${date}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` }
        })
      } else {
        await fetch(`${kvUrl}/sadd/${setKey}/${date}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` }
        })
      }
    } catch (err) {}
  }

  const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=', 'base64')
  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).send(transparentPng)
}