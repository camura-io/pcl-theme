const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const customHandler = require('./api/custom');
const heartbeatHandler = require('./api/heartbeat');
const manageHandler = require('./api/manage');
const toggleHandler = require('./api/toggle');

// 路由分发 (保持与原有路径完全一致)
app.all('/custom.xaml', customHandler);
app.all('/api/custom', customHandler);
app.all('/api/heartbeat', heartbeatHandler);
app.all('/manage', manageHandler);
app.all('/api/manage', manageHandler);
app.all('/api/toggle', toggleHandler);

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('<h2>🌸 PCL 专属恋爱云端服务运行中 (Zeabur / Node.js)</h2><p>服务状态正常，国内直连通道畅通。</p>');
});

app.listen(port, () => {
  console.log(`PCL Theme Server listening on port ${port}`);
});
