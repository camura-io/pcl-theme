module.exports = async (req, res) => {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. 获取当前真实北京时间 (UTC+8)
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const curYear = now.getUTCFullYear();
  const curMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
  const curDay = String(now.getUTCDate()).padStart(2, '0');
  const serverDateKey = `${curYear}-${curMonth}-${curDay}`;
  const clientDateKey = req.query.date || serverDateKey;

  const m = parseInt(req.query.m, 10);
  let u = (req.query.u || req.query.user || 'camura').toLowerCase();
  if (u === 'boy' || u === 'he') u = 'camura';
  if (u === 'girl' || u === 'she' || u === 'her') u = 'yarnsta';

  if (kvUrl && kvToken) {
    try {
      const promises = [];

      // 2. 自动持久化打卡记录 (确保今日以及客户端传来的日期都永久打卡成功)
      promises.push(
        fetch(`${kvUrl}/sadd/pcl_checkin_set_${curYear}/${serverDateKey}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` }
        })
      );
      if (clientDateKey && clientDateKey !== serverDateKey) {
        const clientYear = clientDateKey.slice(0, 4) || curYear;
        promises.push(
          fetch(`${kvUrl}/sadd/pcl_checkin_set_${clientYear}/${clientDateKey}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${kvToken}` }
          })
        );
      }

      // 3. 跨午夜连续游玩与独立时长智能结算
      if (!isNaN(m)) {
        const lastPingKey = `pcl_last_ping_${u}`;
        const todayDurKey = `pcl_duration_${u}_${serverDateKey}`;
        const clientDurKey = `pcl_duration_${u}_${clientDateKey}`;

        // 并行获取当前真实日期的时长和上次心跳时间戳
        const [todayDurRes, lastPingRes] = await Promise.all([
          fetch(`${kvUrl}/get/${todayDurKey}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json()).catch(() => null),
          fetch(`${kvUrl}/get/${lastPingKey}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json()).catch(() => null)
        ]);

        const currentTodayVal = parseInt(todayDurRes?.result, 10) || 0;
        const lastPingTime = parseInt(lastPingRes?.result, 10) || 0;
        const nowMs = now.getTime();
        const deltaMs = (lastPingTime > 0) ? (nowMs - lastPingTime) : 0;

        if (clientDateKey === serverDateKey) {
          // 同一天内游玩：以客户端上报的最大累计值为准，或基于心跳增量累加
          let targetVal = Math.max(m, currentTodayVal);
          if (deltaMs > 0 && deltaMs <= 5 * 60 * 1000) {
            const deltaM = Math.min(5, Math.max(1, Math.round(deltaMs / 60000)));
            targetVal = Math.max(targetVal, currentTodayVal + deltaM);
          }
          promises.push(
            fetch(`${kvUrl}/set/${todayDurKey}/${targetVal}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${kvToken}` }
            }),
            fetch(`${kvUrl}/expire/${todayDurKey}/2592000`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${kvToken}` }
            })
          );
        } else {
          // 跨午夜连续游玩 (客户端为昨天，服务器已到今天)
          // 0点以后的连续心跳自动累加到今天 (serverDateKey) 的时长
          let newTodayVal = currentTodayVal;
          if (deltaMs > 0 && deltaMs <= 5 * 60 * 1000) {
            const deltaM = Math.min(5, Math.max(1, Math.round(deltaMs / 60000)));
            newTodayVal = currentTodayVal + deltaM;
          } else if (newTodayVal === 0) {
            newTodayVal = 2; // 跨天新记录保底
          }

          promises.push(
            fetch(`${kvUrl}/set/${todayDurKey}/${newTodayVal}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${kvToken}` }
            }),
            fetch(`${kvUrl}/expire/${todayDurKey}/2592000`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${kvToken}` }
            }),
            fetch(`${kvUrl}/expire/${clientDurKey}/2592000`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${kvToken}` }
            })
          );
        }

        // 更新最后心跳时间戳
        promises.push(
          fetch(`${kvUrl}/set/${lastPingKey}/${nowMs}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${kvToken}` }
          }),
          fetch(`${kvUrl}/expire/${lastPingKey}/86400`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${kvToken}` }
          })
        );
      }

      await Promise.all(promises);
    } catch (err) {}
  }

  const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=', 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(transparentPng);
};