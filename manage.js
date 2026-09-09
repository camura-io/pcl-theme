module.exports = async (req, res) => {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth() + 1;
  const curDay = now.getUTCDate();
  const todayKey = `${curYear}-${String(curMonth).padStart(2, '0')}-${String(curDay).padStart(2, '0')}`;

  // 1. 异步按需懒加载特定年份打卡数据接口 (format=json 或 action=get_year)
  if (req.query && (req.query.format === 'json' || req.query.action === 'get_year')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const queryYear = parseInt(req.query.year, 10) || curYear;
    let yearCheckins = [];
    if (kvUrl && kvToken) {
      try {
        const response = await fetch(`${kvUrl}/smembers/pcl_checkin_set_${queryYear}`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        const json = await response.json();
        if (json && Array.isArray(json.result)) {
          yearCheckins = json.result;
        }
      } catch (e) {}
    }
    if (queryYear === curYear && !yearCheckins.includes(todayKey)) {
      yearCheckins.push(todayKey);
    }
    return res.status(200).json({ year: queryYear, checkins: yearCheckins });
  }

  // 2. SSR 加载当前年份打卡与双人今日陪伴时长
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // 动态计算相识与相恋纪念天数
  const meetDate = new Date(Date.UTC(2024, 3, 4)); // 2024-04-04
  const loveDate = new Date(Date.UTC(2024, 5, 16)); // 2024-06-16 (相恋)
  const meetDays = Math.floor((now.getTime() - meetDate.getTime()) / (1000 * 60 * 60 * 24));
  const loveDays = Math.floor((now.getTime() - loveDate.getTime()) / (1000 * 60 * 60 * 24));

  let allCheckins = [todayKey];
  let camuraM = 0;
  let yarnstaM = 0;

  if (kvUrl && kvToken) {
    try {
      const [checkinRes, durCamuraRes, durYarnstaRes, oldDurRes] = await Promise.all([
        fetch(`${kvUrl}/smembers/pcl_checkin_set_${curYear}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json()),
        fetch(`${kvUrl}/get/pcl_duration_camura_${todayKey}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json()),
        fetch(`${kvUrl}/get/pcl_duration_yarnsta_${todayKey}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json()),
        fetch(`${kvUrl}/get/pcl_duration_${todayKey}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json())
      ]);
      if (checkinRes && Array.isArray(checkinRes.result)) {
        allCheckins = checkinRes.result;
      }
      if (!allCheckins.includes(todayKey)) {
        allCheckins.push(todayKey);
        fetch(`${kvUrl}/sadd/pcl_checkin_set_${curYear}/${todayKey}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` }
        }).catch(() => {});
      }

      if (durCamuraRes && durCamuraRes.result) {
        camuraM = parseInt(durCamuraRes.result, 10) || 0;
      } else if (oldDurRes && oldDurRes.result) {
        camuraM = parseInt(oldDurRes.result, 10) || 0;
      }

      if (durYarnstaRes && durYarnstaRes.result) {
        yarnstaM = parseInt(durYarnstaRes.result, 10) || 0;
      }
    } catch (e) {}
  }

  function formatDuration(mins) {
    if (mins < 60) return `${mins} 分钟`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分钟`;
  }

  const checkinsJson = JSON.stringify(allCheckins);

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌸 恋爱打卡与历年回忆管理</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: linear-gradient(135deg, #FFF0F5 0%, #FFDEE9 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    .card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-radius: 24px;
      box-shadow: 0 12px 36px rgba(233, 30, 99, 0.18);
      border: 1.5px solid #FFCCD5;
      padding: 24px;
      max-width: 440px;
      width: 100%;
      text-align: center;
    }
    h1 { font-size: 20px; color: #D81B60; margin-bottom: 4px; }
    .badge { display: inline-block; background: #FFF0F5; border: 1px solid #FFCCD5; border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #D81B60; font-weight: bold; margin-bottom: 8px; }
    .duration-box {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .duration-pill {
      background: #FFFFFF;
      border: 1px solid #FFCCD5;
      border-radius: 12px;
      padding: 4px 10px;
      font-size: 11.5px;
      font-weight: bold;
      color: #C2185B;
      box-shadow: 0 2px 6px rgba(233, 30, 99, 0.08);
    }
    .nav-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #FFF0F5;
      border: 1px solid #FFCCD5;
      border-radius: 12px;
      padding: 6px 10px;
      margin-bottom: 10px;
    }
    .nav-group { display: flex; align-items: center; gap: 4px; }
    .nav-btn {
      background: #FFFFFF;
      border: 1px solid #FFCCD5;
      color: #D81B60;
      font-size: 13px;
      font-weight: bold;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .nav-btn:hover { background: #FF4081; color: white; border-color: #E91E63; }
    .nav-title { font-size: 14px; font-weight: bold; color: #D81B60; min-width: 70px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      margin-bottom: 16px;
    }
    .w-head { font-size: 12px; font-weight: bold; color: #888; padding: 4px; }
    .w-head.weekend { color: #E91E63; }
    .day-btn {
      aspect-ratio: 1;
      border: 1px solid #FFCCD5;
      background: #FFFFFF;
      border-radius: 10px;
      font-size: 13px;
      font-weight: bold;
      color: #555;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }
    .day-btn:hover { transform: scale(1.08); border-color: #FF4081; }
    .day-btn.checked {
      background: linear-gradient(135deg, #FF4081 0%, #E91E63 100%);
      border-color: #D81B60;
      color: white;
      box-shadow: 0 4px 10px rgba(233, 30, 99, 0.25);
    }
    .day-btn.today {
      border: 2px solid #FFD700;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
    }
    .day-btn.empty {
      background: transparent;
      border: none;
      box-shadow: none;
      cursor: default;
    }
    .stat-box {
      background: #FFF0F5;
      border: 1px solid #FFCCD5;
      border-radius: 12px;
      padding: 10px;
      font-size: 13px;
      color: #C2185B;
      font-weight: bold;
      margin-bottom: 12px;
    }
    .tip {
      font-size: 12px;
      color: #888;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🌸 camura &amp; Yarnsta 的打卡空间</h1>
    <div class="badge">🌱 相识第 ${meetDays} 天 · 💖 相恋第 ${loveDays} 天</div>
    <div class="duration-box">
      <div class="duration-pill">👦 camura 今日：${formatDuration(camuraM)}</div>
      <div class="duration-pill">👧 Yarnsta 今日：${formatDuration(yarnstaM)}</div>
    </div>
    <div class="nav-bar">
      <div class="nav-group">
        <button class="nav-btn" onclick="changeYear(-1)">◀</button>
        <span class="nav-title" id="yearTitle">${curYear} 年</span>
        <button class="nav-btn" onclick="changeYear(1)">▶</button>
      </div>
      <div class="nav-group">
        <button class="nav-btn" onclick="changeMonth(-1)">◀</button>
        <span class="nav-title" id="monthTitle">${curMonth} 月</span>
        <button class="nav-btn" onclick="changeMonth(1)">▶</button>
      </div>
    </div>
    <div class="grid" id="grid"></div>
    <div class="stat-box" id="statText">统计加载中...</div>
    <div class="tip">💡 提示：修改后数据已秒级存入云端<br>切回 PCL 点击日历下方的 <b>【🔄同步】</b> 即可刷新！✨</div>
  </div>
  <script>
    const checkins = new Set(${checkinsJson});
    const loadedYears = new Set([${curYear}]);
    const realYear = ${curYear};
    const realMonth = ${curMonth};
    const realDay = ${curDay};
    let viewYear = realYear;
    let viewMonth = realMonth;
    const weeks = ['一', '二', '三', '四', '五', '六', '日'];
    function getDaysInMonth(year, month) {
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      const days = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      return days[month - 1];
    }
    function getFirstDayCol(year, month) {
      const d = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
      return (d === 0) ? 6 : d - 1;
    }
    async function ensureYearLoaded(y) {
      if (loadedYears.has(y)) return;
      try {
        const res = await fetch('/api/manage?year=' + y + '&format=json');
        const data = await res.json();
        if (data && Array.isArray(data.checkins)) {
          data.checkins.forEach(k => checkins.add(k));
        }
        loadedYears.add(y);
      } catch(e) {
        loadedYears.add(y);
      }
    }
    async function renderCalendar() {
      document.getElementById('yearTitle').innerText = viewYear + ' 年';
      document.getElementById('monthTitle').innerText = viewMonth + ' 月';
      if (!loadedYears.has(viewYear)) {
        document.getElementById('statText').innerText = '⏳ 正在加载 ' + viewYear + ' 年打卡数据...';
        await ensureYearLoaded(viewYear);
      }
      const grid = document.getElementById('grid');
      grid.innerHTML = '';
      weeks.forEach((w, idx) => {
        const div = document.createElement('div');
        div.className = 'w-head' + (idx >= 5 ? ' weekend' : '');
        div.innerText = w;
        grid.appendChild(div);
      });
      const startCol = getFirstDayCol(viewYear, viewMonth);
      for (let i = 0; i < startCol; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'day-btn empty';
        grid.appendChild(emptyDiv);
      }
      const totalDays = getDaysInMonth(viewYear, viewMonth);
      for (let d = 1; d <= totalDays; d++) {
        const mStr = String(viewMonth).length === 1 ? '0' + viewMonth : '' + viewMonth;
        const dStr = String(d).length === 1 ? '0' + d : '' + d;
        const dKey = viewYear + '-' + mStr + '-' + dStr;
        const btn = document.createElement('button');
        btn.className = 'day-btn';
        const isToday = (viewYear === realYear && viewMonth === realMonth && d === realDay);
        if (isToday) btn.classList.add('today');
        if (checkins.has(dKey)) {
          btn.classList.add('checked');
          btn.innerText = isToday ? ('✨' + d) : '💖';
        } else {
          btn.innerText = d;
        }
        btn.onclick = async () => {
          const isAdd = !checkins.has(dKey);
          if (isAdd) {
            checkins.add(dKey);
            btn.classList.add('checked');
            btn.innerText = isToday ? ('✨' + d) : '💖';
          } else {
            checkins.delete(dKey);
            btn.classList.remove('checked');
            btn.innerText = d;
          }
          updateStat();
          try {
            await fetch('/api/toggle?date=' + dKey + '&action=' + (isAdd ? 'add' : 'del'));
          } catch(e) {}
        };
        grid.appendChild(btn);
      }
      updateStat();
    }
    function updateStat() {
      let monthCount = 0;
      const totalDays = getDaysInMonth(viewYear, viewMonth);
      for (let d = 1; d <= totalDays; d++) {
        const mStr = String(viewMonth).length === 1 ? '0' + viewMonth : '' + viewMonth;
        const dStr = String(d).length === 1 ? '0' + d : '' + d;
        const dKey = viewYear + '-' + mStr + '-' + dStr;
        if (checkins.has(dKey)) monthCount++;
      }
      let yearCount = 0;
      checkins.forEach(key => {
        if (key.indexOf(viewYear + '-') === 0) yearCount++;
      });
      document.getElementById('statText').innerText = '🌟 ' + viewYear + '年' + viewMonth + '月已打卡: ' + monthCount + ' 天 | ' + viewYear + '年累计: ' + yearCount + ' 天 💖';
    }
    async function changeMonth(delta) {
      viewMonth += delta;
      if (viewMonth < 1) { viewMonth = 12; viewYear--; }
      if (viewMonth > 12) { viewMonth = 1; viewYear++; }
      await renderCalendar();
    }
    async function changeYear(delta) {
      viewYear += delta;
      await renderCalendar();
    }
    renderCalendar();
  </script>
</body>
</html>`;

  res.status(200).send(html);
};
