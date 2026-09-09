module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const currentHost = req.headers.host || 'camura.dpdns.org';

  // 1. 识别当前访问角色 (camura 男方 / Yarnsta 女方)
  let userRole = (req.query.u || req.query.user || 'camura').toLowerCase();
  if (userRole === 'boy' || userRole === 'he') userRole = 'camura';
  if (userRole === 'girl' || userRole === 'she' || userRole === 'her') userRole = 'yarnsta';
  const isCamura = (userRole !== 'yarnsta');
  const manageUrl = `https://${currentHost}/manage?u=${userRole}`;

  // 2. 获取当前真实北京时间 (UTC+8)
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth() + 1;
  const curDay = now.getUTCDate();
  const todayKey = `${curYear}-${String(curMonth).padStart(2, '0')}-${String(curDay).padStart(2, '0')}`;
  const setKey = `pcl_checkin_set_${curYear}`;

  // 3. 动态精确计算相识与相恋纪念天数
  const meetDate = new Date(Date.UTC(2024, 3, 4)); // 2024-04-04 (相识)
  const loveDate = new Date(Date.UTC(2024, 5, 16)); // 2024-06-16 (相恋)
  const meetDays = Math.floor((now.getTime() - meetDate.getTime()) / (1000 * 60 * 60 * 24));
  const loveDays = Math.floor((now.getTime() - loveDate.getTime()) / (1000 * 60 * 60 * 24));

  // 3.1 宜忌每日运势题库 (每天根据当前日期自动确定性轮换，每天不重样)
  const fortunePool = [
    {
      yi: '用骨粉催熟小麦、去村庄铁匠铺摸奖、驯服粉色美西螈',
      ji: '开箱子不看脚下TNT、在下界倒水、徒手撸仙人掌'
    },
    {
      yi: '用精准采集挖蜂巢、在樱花树下野餐、给心爱狗狗穿狼铠',
      ji: '挖矿垂直往下挖、雷暴天不回基地、惹怒猪灵蛮兵'
    },
    {
      yi: '下矿寻找远古残骸、在山顶看方块日落、给信标放彩光',
      ji: '在下界尝试在床上睡觉、用钻石镐挖泥土、忘带不死图腾'
    },
    {
      yi: '农田全自动收割、钓一把海之眷顾神竿、装点双人城堡',
      ji: '夜间出门不带盾牌、惹怒铁傀儡、末影珍珠乱扔掉虚空'
    },
    {
      yi: '在海底神殿激活潮涌核心、骑炽足兽过岩浆湖、修补神装',
      ji: '看末影人的眼睛、在苦力怕面前发呆、把岩浆当水倒'
    },
    {
      yi: '捕捉发光鱿鱼做水族箱、双人骑乘骆驼探险、搜刮地牢',
      ji: '跳入细雪不穿皮靴、在基地周围玩TNT、忘记记录家坐标'
    },
    {
      yi: '用重锤打出蓄力下砸连招、开试炼密室宝箱、种发光浆果',
      ji: '直面循声守卫咆哮、高空飞行不带烟花、附魔金苹果喂马'
    },
    {
      yi: '合成潜影盒整理大仓库、开全自动刷铁机、采集丛林可可',
      ji: '在末地虚空边缘疾跑、挖矿不插火把、攻击流浪商人羊驼'
    },
    {
      yi: '寻找粉红羊拍照留念、打造全套下界合金神装、给家铺地毯',
      ji: '在木头房子里玩打火石、潜入深海忘记氧气、招惹潜影贝大军'
    },
    {
      yi: '用营火安抚蜜蜂取蜜脾、驯服可爱狐狸、建造冰雪小屋',
      ji: '高处摔落不放水桶、在废弃矿井迷路、徒手拆潜影盒掉虚空'
    },
    {
      yi: '制作自动合成器红石工业、去热带草原抓羊驼、装饰花园',
      ji: '打凋灵不卡天花板、雨天站在大树底下被雷劈、跳入仙人掌丛'
    },
    {
      yi: '给图书管理员村民打折、用青蛙吐出梦幻蛙鸣灯、酿造夜视药水',
      ji: '喝牛奶解掉身上的好Buff、随身带满包石头下矿、招惹凋灵骷髅'
    },
    {
      yi: '在下界要塞刷烈焰棒、用末影箱跨维度互通、在山顶吹响山羊角',
      ji: '在丛林神庙踩压力板、跳进没有水源的深坑、副手忘记放图腾'
    },
    {
      yi: '给武器附魔经验修补、建造浪漫樱花喷泉、用骨粉催熟樱花树',
      ji: '把钻石矿石直接用普通镐挖掉、去末地忘记带鞘翅、惹怒卫道士'
    },
    {
      yi: '用嗅探兽挖掘远古种子、在海底废墟刷可疑沙子、建空中花园',
      ji: '在雪山顶奔跑掉入深雪冻伤、拆箱子不留空位、攻击小铁傀儡'
    },
    {
      yi: '用细雪制作隐形陷阱、用音符盒演奏动听歌曲、制作水下玻璃通道',
      ji: '空手去打远古守卫者、在黑曜石旁边玩岩浆、进末地门不带方块'
    },
    {
      yi: '用漏斗搭建全自动烤肉机、在沼泽寻找可爱青蛙、收集唱片',
      ji: '在雷雨天不用避雷针、穿金头盔进猪灵堡垒却脱下、惹怒远古守卫'
    },
    {
      yi: '给马儿装上钻石马铠、用彩色羊毛做像素画、去林地府邸探险',
      ji: '在岩浆上方搭单格方块桥、跳跃时不看饱食度、忘记给床设置重生点'
    },
    {
      yi: '在蘑菇岛建造绝对安全基地、用炼药锅洗旗帜、打造附魔弓',
      ji: '把神装扔给僵尸穿上、在沙漠神殿踩中橙色陶瓦、惹怒狼群'
    },
    {
      yi: '用风弹实现超级高跳、去雪原村庄做客、制作无限水井',
      ji: '在矿洞里直视苦力怕眼睛、挖掘天花板上的沙砾、被潜影贝击飞摔落'
    },
    {
      yi: '在地下深处挖掘巨大紫水晶洞、用栓绳牵两只美西螈散步、做蛋糕',
      ji: '在下界合金套上附魔消失诅咒、在深海里拆海晶灯溺水、忘拿盾牌'
    },
    {
      yi: '用去皮原木设计现代木屋、在樱花树下许愿、给小猫咪喂鳕鱼',
      ji: '在刷怪笼旁边放TNT、在矿车轨道上挂机被撞、直面劫掠兽'
    },
    {
      yi: '打造一把锋利V钻石剑、用染色玻璃调出渐变信标光柱、烤曲奇',
      ji: '跳入虚空救掉落物、在末影龙喷息区停留、踩中毒箭陷阱'
    },
    {
      yi: '用刷子发掘陶罐碎片、给基地装满温暖壁炉、在竹林里喂熊猫',
      ji: '在下界猪灵面前开箱子、徒手挖黑曜石、忘记随身携带火把'
    },
    {
      yi: '用灵魂沙制作极速上升水电梯、在村庄开联欢会、制作不死图腾展台',
      ji: '在雷雨天骑马出门、把珍贵附魔书当燃料烧掉、不看小地图迷路'
    },
    {
      yi: '给二人秘密基地铺设红石暗门、采摘丛林浆果做甜品、建树屋',
      ji: '在悬崖边向后疾跑、在岩浆湖上方打恶魂、直视掠夺者巡逻队队长'
    },
    {
      yi: '在暖水海洋收集各色珊瑚、建造浪漫双人秋千、用营火烤鱼',
      ji: '在矿洞拐角处被苦力怕偷袭、在末地船上失足滑落、惹怒末影螨'
    },
    {
      yi: '用发光墨囊制作发光告示牌、给宠物狼搭建温馨小窝、收集全套唱片',
      ji: '在岩浆旁边合成珍贵物品、把水桶误放进地狱蒸发、忘记给镐子附魔'
    },
    {
      yi: '在向日葵平原建造向阳小屋、用重锤破除怪物盾牌、骑马兜风',
      ji: '在远古城市里跑步跳跃、在峡谷边缘不按Shift潜行、空手接恶魂火球'
    },
    {
      yi: '在樱花树梢建造观景台、收集远古火炬花种子、给基地四周插满火把',
      ji: '在地牢里不拆刷怪笼乱逛、在深海神殿直视守卫者、拆家忘记备份'
    },
    {
      yi: '与心爱的人在方块城堡看一场日落、下矿满载钻石而归、互赠礼物',
      ji: '一个人孤单单地探险、忘记给彼此说早安和晚安、熬夜不注意休息'
    }
  ];

  const fortuneIndex = (curYear * 372 + curMonth * 31 + curDay) % fortunePool.length;
  const dailyYi = fortunePool[fortuneIndex].yi;
  const dailyJi = fortunePool[fortuneIndex].ji;

  // 4. 从 Redis 并行读取打卡状态与两人的今日独立陪伴时长
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  let checkins = [todayKey];
  let camuraM = 0;
  let yarnstaM = 0;

  if (kvUrl && kvToken) {
    try {
      const [checkinRes, durCamuraRes, durYarnstaRes, oldDurRes] = await Promise.all([
        fetch(`${kvUrl}/smembers/${setKey}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json()),
        fetch(`${kvUrl}/get/pcl_duration_camura_${todayKey}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json()),
        fetch(`${kvUrl}/get/pcl_duration_yarnsta_${todayKey}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json()),
        fetch(`${kvUrl}/get/pcl_duration_${todayKey}`, { headers: { Authorization: `Bearer ${kvToken}` } }).then(r => r.json())
      ]);
      if (checkinRes && Array.isArray(checkinRes.result)) {
        checkins = checkinRes.result;
      }
      if (!checkins.includes(todayKey)) {
        checkins.push(todayKey);
        fetch(`${kvUrl}/sadd/${setKey}/${todayKey}`, {
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
    } catch (e) {
      checkins = [todayKey];
    }
  }
  if (!Array.isArray(checkins)) checkins = [todayKey];

  // 5. 格式化陪伴时间字符串
  function formatDuration(mins) {
    if (mins < 60) return `${mins} 分钟`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分钟`;
  }

  // 5.1 动态生成以女方 (Yarnsta) 陪伴时长为准的专属温馨提醒语
  let timeReminderText = `宝宝不知不觉玩了 ${yarnstaM} 分钟啦，上一次喝水是什么时候？润润喉咙再探险吧~ 🥤🌸`;
  if (yarnstaM === 0) {
    timeReminderText = `今天也要元气满满地开启探险，记得随手放一杯温水润润喉咙哦~ 🥤🌸`;
  } else if (yarnstaM >= 60) {
    timeReminderText = `宝宝今天已经陪伴了 ${formatDuration(yarnstaM)} 啦，起来走动喝口水，休息一下再继续建城堡吧~ 🏰💖`;
  } else if (yarnstaM >= 30) {
    timeReminderText = `宝宝不知不觉玩了 ${yarnstaM} 分钟啦，注意揉揉眼睛活动一下脖子再探险吧~ 🥤🌸`;
  }

  // 6. 动态生成双人独立时长组件 (当前用户本地实时逐分递增，对方显示最新云端同步时长)
  let durationCompanionBlock = `                    <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Center">\n`;

  // 6.1 camura 胶囊
  if (isCamura) {
    durationCompanionBlock += `                        <Border Background="#50FCE4EC" BorderBrush="#50FF80AB" BorderThickness="1" CornerRadius="4" Padding="5,1" Margin="0,0,4,0">\n`;
    durationCompanionBlock += `                            <TextBlock Text="👦 camura：⏱️ ${formatDuration(camuraM)}" FontSize="10" Foreground="#C2185B" FontWeight="Bold">\n`;
    durationCompanionBlock += `                                <TextBlock.Triggers>\n`;
    durationCompanionBlock += `                                    <EventTrigger RoutedEvent="FrameworkElement.Loaded">\n`;
    durationCompanionBlock += `                                        <BeginStoryboard>\n`;
    durationCompanionBlock += `                                            <Storyboard>\n`;
    durationCompanionBlock += `                                                <StringAnimationUsingKeyFrames Storyboard.TargetProperty="Text">\n`;
    for (let step = 1; step <= 180; step++) {
      const totalM = camuraM + step;
      const h = Math.floor(step / 60);
      const m = step % 60;
      const keyTime = `${h}:${m}:0`;
      durationCompanionBlock += `                                                    <DiscreteStringKeyFrame Value="👦 camura：⏱️ ${formatDuration(totalM)}" KeyTime="${keyTime}" />\n`;
    }
    durationCompanionBlock += `                                                </StringAnimationUsingKeyFrames>\n`;
    durationCompanionBlock += `                                            </Storyboard>\n`;
    durationCompanionBlock += `                                        </BeginStoryboard>\n`;
    durationCompanionBlock += `                                    </EventTrigger>\n`;
    durationCompanionBlock += `                                </TextBlock.Triggers>\n`;
    durationCompanionBlock += `                            </TextBlock>\n`;
    durationCompanionBlock += `                        </Border>\n`;
  } else {
    durationCompanionBlock += `                        <Border Background="#50FCE4EC" BorderBrush="#50FF80AB" BorderThickness="1" CornerRadius="4" Padding="5,1" Margin="0,0,4,0">\n`;
    durationCompanionBlock += `                            <TextBlock Text="👦 camura：${formatDuration(camuraM)}" FontSize="10" Foreground="#C2185B" FontWeight="Bold" />\n`;
    durationCompanionBlock += `                        </Border>\n`;
  }

  // 6.2 Yarnsta 胶囊
  if (!isCamura) {
    durationCompanionBlock += `                        <Border Background="#50FCE4EC" BorderBrush="#50FF80AB" BorderThickness="1" CornerRadius="4" Padding="5,1">\n`;
    durationCompanionBlock += `                            <TextBlock Text="👧 Yarnsta：⏱️ ${formatDuration(yarnstaM)}" FontSize="10" Foreground="#C2185B" FontWeight="Bold">\n`;
    durationCompanionBlock += `                                <TextBlock.Triggers>\n`;
    durationCompanionBlock += `                                    <EventTrigger RoutedEvent="FrameworkElement.Loaded">\n`;
    durationCompanionBlock += `                                        <BeginStoryboard>\n`;
    durationCompanionBlock += `                                            <Storyboard>\n`;
    durationCompanionBlock += `                                                <StringAnimationUsingKeyFrames Storyboard.TargetProperty="Text">\n`;
    for (let step = 1; step <= 180; step++) {
      const totalM = yarnstaM + step;
      const h = Math.floor(step / 60);
      const m = step % 60;
      const keyTime = `${h}:${m}:0`;
      durationCompanionBlock += `                                                    <DiscreteStringKeyFrame Value="👧 Yarnsta：⏱️ ${formatDuration(totalM)}" KeyTime="${keyTime}" />\n`;
    }
    durationCompanionBlock += `                                                </StringAnimationUsingKeyFrames>\n`;
    durationCompanionBlock += `                                            </Storyboard>\n`;
    durationCompanionBlock += `                                        </BeginStoryboard>\n`;
    durationCompanionBlock += `                                    </EventTrigger>\n`;
    durationCompanionBlock += `                                </TextBlock.Triggers>\n`;
    durationCompanionBlock += `                            </TextBlock>\n`;
    durationCompanionBlock += `                        </Border>\n`;
  } else {
    durationCompanionBlock += `                        <Border Background="#50FCE4EC" BorderBrush="#50FF80AB" BorderThickness="1" CornerRadius="4" Padding="5,1">\n`;
    durationCompanionBlock += `                            <TextBlock Text="👧 Yarnsta：${formatDuration(yarnstaM)}" FontSize="10" Foreground="#C2185B" FontWeight="Bold" />\n`;
    durationCompanionBlock += `                        </Border>\n`;
  }

  durationCompanionBlock += `                    </StackPanel>`;

  // 7. 动态生成云端陪伴时长心跳同步载体 (当前角色专属上报，每 2 分钟定时同步)
  const myInitialM = isCamura ? camuraM : yarnstaM;
  let heartbeatBlock = `    <!-- ================= 💓 云端陪伴时长心跳同步载体 (${userRole} 专属，每2分钟上报) ================= -->\n`;
  heartbeatBlock += `    <local:MyImage Width="1" Height="1" Opacity="0.001" IsHitTestVisible="False" Source="https://${currentHost}/api/heartbeat?date=${todayKey}&amp;m=${myInitialM}&amp;u=${userRole}">\n`;
  heartbeatBlock += `        <local:MyImage.Triggers>\n`;
  heartbeatBlock += `            <EventTrigger RoutedEvent="FrameworkElement.Loaded">\n`;
  heartbeatBlock += `                <BeginStoryboard>\n`;
  heartbeatBlock += `                    <Storyboard>\n`;
  heartbeatBlock += `                        <StringAnimationUsingKeyFrames Storyboard.TargetProperty="Source">\n`;

  for (let step = 2; step <= 180; step += 2) {
    const totalM = myInitialM + step;
    const h = Math.floor(step / 60);
    const m = step % 60;
    const keyTime = `${h}:${m}:0`;
    heartbeatBlock += `                            <DiscreteStringKeyFrame Value="https://${currentHost}/api/heartbeat?date=${todayKey}&amp;m=${totalM}&amp;u=${userRole}" KeyTime="${keyTime}" />\n`;
  }

  heartbeatBlock += `                        </StringAnimationUsingKeyFrames>\n`;
  heartbeatBlock += `                    </Storyboard>\n`;
  heartbeatBlock += `                </BeginStoryboard>\n`;
  heartbeatBlock += `            </EventTrigger>\n`;
  heartbeatBlock += `        </local:MyImage.Triggers>\n`;
  heartbeatBlock += `    </local:MyImage>\n`;

  // 8. 动态计算日历 (3个月滑动窗口)
  const isLeapYear = (curYear % 4 === 0 && curYear % 100 !== 0) || (curYear % 400 === 0);
  const daysPerMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const weeks = ['一', '二', '三', '四', '五', '六', '日'];

  function getFirstDayCol(y, m) {
    const d = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    return (d === 0) ? 6 : d - 1;
  }

  const startMonth = Math.max(1, Math.min(10, curMonth - 1));
  const targetMonths = [startMonth, startMonth + 1, startMonth + 2];

  let calXaml = '\n                    <!-- 动态当前年份日历容器 (精选3个月滑动窗口) -->\n                    <Grid>\n';

  for (const m of targetMonths) {
    const defaultVis = (m === curMonth) ? 'Visible' : 'Collapsed';
    const hasPrev = (m > targetMonths[0]);
    const hasNext = (m < targetMonths[targetMonths.length - 1]);
    const prevM = m - 1;
    const nextM = m + 1;

    let monthCheckCount = 0;
    const totalDays = daysPerMonth[m - 1];
    for (let d = 1; d <= totalDays; d++) {
      const dKey = `${curYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (checkins.includes(dKey)) monthCheckCount++;
    }

    calXaml += `                        <!-- ================= ${curYear}年 ${m} 月日历 ================= -->\n`;
    calXaml += `                        <Grid x:Name="MonthGrid_${m}" Visibility="${defaultVis}">\n`;
    calXaml += `                            <StackPanel>\n`;
    calXaml += `                                <!-- 月份切换栏 -->\n`;
    calXaml += `                                <Border Background="#40FFFFFF" BorderBrush="#50FFCCD5" BorderThickness="1" CornerRadius="6" Padding="2,2" Margin="0,0,0,4">\n`;
    calXaml += `                                    <Grid><Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /><ColumnDefinition Width="Auto" /></Grid.ColumnDefinitions>\n`;

    // Prev Button
    if (hasPrev) {
      calXaml += `                                        <Border Grid.Column="0" Background="#30FFFFFF" BorderBrush="#40FFCCD5" BorderThickness="1" CornerRadius="4" Padding="6,1">\n`;
      calXaml += `                                            <Border.Triggers><EventTrigger RoutedEvent="Border.MouseLeftButtonDown"><BeginStoryboard><Storyboard>\n`;
      calXaml += `                                                <ObjectAnimationUsingKeyFrames Storyboard.TargetName="MonthGrid_${m}" Storyboard.TargetProperty="Visibility"><DiscreteObjectKeyFrame KeyTime="0:0:0" Value="{x:Static Visibility.Collapsed}" /></ObjectAnimationUsingKeyFrames>\n`;
      calXaml += `                                                <ObjectAnimationUsingKeyFrames Storyboard.TargetName="MonthGrid_${prevM}" Storyboard.TargetProperty="Visibility"><DiscreteObjectKeyFrame KeyTime="0:0:0" Value="{x:Static Visibility.Visible}" /></ObjectAnimationUsingKeyFrames>\n`;
      calXaml += `                                            </Storyboard></BeginStoryboard></EventTrigger></Border.Triggers>\n`;
      calXaml += `                                            <TextBlock Text=" ◀ " FontSize="10" Foreground="#D81B60" HorizontalAlignment="Center" VerticalAlignment="Center" />\n`;
      calXaml += `                                        </Border>\n`;
    } else {
      calXaml += `                                        <Border Grid.Column="0" Background="#15FFFFFF" BorderBrush="#20FFCCD5" BorderThickness="1" CornerRadius="4" Padding="6,1" Opacity="0.35">\n`;
      calXaml += `                                            <TextBlock Text=" ◀ " FontSize="10" Foreground="#888888" HorizontalAlignment="Center" VerticalAlignment="Center" />\n`;
      calXaml += `                                        </Border>\n`;
    }

    // Title
    calXaml += `                                        <TextBlock Grid.Column="1" Text="🌸 ${curYear} 年 ${m} 月 🌸" FontSize="12" Foreground="#D81B60" FontWeight="Bold" HorizontalAlignment="Center" />\n`;

    // Next Button
    if (hasNext) {
      calXaml += `                                        <Border Grid.Column="2" Background="#30FFFFFF" BorderBrush="#40FFCCD5" BorderThickness="1" CornerRadius="4" Padding="6,1">\n`;
      calXaml += `                                            <Border.Triggers><EventTrigger RoutedEvent="Border.MouseLeftButtonDown"><BeginStoryboard><Storyboard>\n`;
      calXaml += `                                                <ObjectAnimationUsingKeyFrames Storyboard.TargetName="MonthGrid_${m}" Storyboard.TargetProperty="Visibility"><DiscreteObjectKeyFrame KeyTime="0:0:0" Value="{x:Static Visibility.Collapsed}" /></ObjectAnimationUsingKeyFrames>\n`;
      calXaml += `                                                <ObjectAnimationUsingKeyFrames Storyboard.TargetName="MonthGrid_${nextM}" Storyboard.TargetProperty="Visibility"><DiscreteObjectKeyFrame KeyTime="0:0:0" Value="{x:Static Visibility.Visible}" /></ObjectAnimationUsingKeyFrames>\n`;
      calXaml += `                                            </Storyboard></BeginStoryboard></EventTrigger></Border.Triggers>\n`;
      calXaml += `                                            <TextBlock Text=" ▶ " FontSize="10" Foreground="#D81B60" HorizontalAlignment="Center" VerticalAlignment="Center" />\n`;
      calXaml += `                                        </Border>\n`;
    } else {
      calXaml += `                                        <Border Grid.Column="2" Background="#15FFFFFF" BorderBrush="#20FFCCD5" BorderThickness="1" CornerRadius="4" Padding="6,1" Opacity="0.35">\n`;
      calXaml += `                                            <TextBlock Text=" ▶ " FontSize="10" Foreground="#888888" HorizontalAlignment="Center" VerticalAlignment="Center" />\n`;
      calXaml += `                                        </Border>\n`;
    }
    calXaml += `                                    </Grid>\n`;
    calXaml += `                                </Border>\n`;

    // Week Header
    calXaml += `                                <Grid Margin="0,1,0,4"><Grid.ColumnDefinitions>`;
    for (let c = 0; c < 7; c++) calXaml += `<ColumnDefinition Width="*" />`;
    calXaml += `</Grid.ColumnDefinitions>\n`;
    for (let c = 0; c < 7; c++) {
      const color = (c >= 5) ? '#E91E63' : (c === 2 ? '#FF4081' : '#888888');
      const text = (c === 2) ? '🌸三' : weeks[c];
      calXaml += `                                    <TextBlock Grid.Column="${c}" Text="${text}" FontSize="10" Foreground="${color}" FontWeight="Bold" HorizontalAlignment="Center" />\n`;
    }
    calXaml += `                                </Grid>\n`;

    // Days Grid
    calXaml += `                                <Grid><Grid.ColumnDefinitions>`;
    for (let c = 0; c < 7; c++) calXaml += `<ColumnDefinition Width="*" />`;
    calXaml += `</Grid.ColumnDefinitions><Grid.RowDefinitions>`;
    for (let r = 0; r < 6; r++) calXaml += `<RowDefinition Height="Auto" />`;
    calXaml += `</Grid.RowDefinitions>\n`;

    const startCol = getFirstDayCol(curYear, m);
    let dCount = 1;

    for (let cell = 0; cell < 42; cell++) {
      if (cell >= startCol && dCount <= totalDays) {
        const r = Math.floor(cell / 7);
        const c = cell % 7;
        const d = dCount;
        const cellKey = `${curYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isCheckedInDb = checkins.includes(cellKey);

        if (m === curMonth && d === curDay) {
          calXaml += `                                    <Grid Grid.Row="${r}" Grid.Column="${c}" Margin="1">\n`;
          calXaml += `                                        <Border Height="23" Background="#FFFF1744" BorderBrush="#FFFFD700" BorderThickness="1.5" CornerRadius="4">\n`;
          calXaml += `                                            <TextBlock Text="✨${d}" Foreground="White" FontWeight="Bold" FontSize="10" HorizontalAlignment="Center" VerticalAlignment="Center" />\n`;
          calXaml += `                                        </Border>\n`;
          calXaml += `                                    </Grid>\n`;
        } else if (isCheckedInDb) {
          calXaml += `                                    <Grid Grid.Row="${r}" Grid.Column="${c}" Margin="1">\n`;
          calXaml += `                                        <Border Height="23" Background="#FFFF4081" BorderBrush="#FFE91E63" BorderThickness="1" CornerRadius="4">\n`;
          calXaml += `                                            <TextBlock Text="💖" Foreground="White" FontSize="10" HorizontalAlignment="Center" VerticalAlignment="Center" />\n`;
          calXaml += `                                        </Border>\n`;
          calXaml += `                                    </Grid>\n`;
        } else {
          calXaml += `                                    <Grid Grid.Row="${r}" Grid.Column="${c}" Margin="1">\n`;
          calXaml += `                                        <Border Height="23" Background="#30FFFFFF" BorderBrush="#30FFCCD5" BorderThickness="1" CornerRadius="4">\n`;
          calXaml += `                                            <TextBlock Text="${d}" Foreground="#444444" FontSize="10" HorizontalAlignment="Center" VerticalAlignment="Center" />\n`;
          calXaml += `                                        </Border>\n`;
          calXaml += `                                    </Grid>\n`;
        }
        dCount++;
      }
    }
    calXaml += `                                </Grid>\n`;

    // 底部统计栏 (打卡天数 + 补签 + 刷新)
    const footerText = (m === curMonth)
      ? `🌸 本月已打卡: ${monthCheckCount} 天`
      : `🌸 ${curYear}年${m}月 (已打卡: ${monthCheckCount}天)`;
    calXaml += `                                <Border Background="#40FFFFFF" CornerRadius="4" Padding="5,3" Margin="0,3,0,0">\n`;
    calXaml += `                                    <Grid>\n`;
    calXaml += `                                        <Grid.ColumnDefinitions><ColumnDefinition Width="*" /><ColumnDefinition Width="Auto" /><ColumnDefinition Width="Auto" /></Grid.ColumnDefinitions>\n`;
    calXaml += `                                        <TextBlock Grid.Column="0" Text="${footerText}" FontSize="10" Foreground="#C2185B" FontWeight="Bold" VerticalAlignment="Center" />\n`;
    calXaml += `                                        <!-- 🌸补签管理 (自适应当前域名的网页面板) -->\n`;
    calXaml += `                                        <Border Grid.Column="1" Background="#30FFFFFF" BorderBrush="#40FFCCD5" BorderThickness="1" CornerRadius="3" Padding="4,1" Margin="0,0,3,0">\n`;
    calXaml += `                                            <Grid>\n`;
    calXaml += `                                                <TextBlock Text="🌸补签" FontSize="9" Foreground="#D81B60" FontWeight="Bold" />\n`;
    calXaml += `                                                <local:MyTextButton Height="16" Padding="0" Margin="0" Text="  " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">\n`;
    calXaml += `                                                    <local:CustomEventService.Events><local:CustomEventCollection>\n`;
    calXaml += `                                                        <local:CustomEvent Type="打开网页" Data="${manageUrl}" />\n`;
    calXaml += `                                                    </local:CustomEventCollection></local:CustomEventService.Events>\n`;
    calXaml += `                                                </local:MyTextButton>\n`;
    calXaml += `                                            </Grid>\n`;
    calXaml += `                                        </Border>\n`;
    calXaml += `                                        <!-- 🔄同步 (一键刷新拉取最新打卡状态) -->\n`;
    calXaml += `                                        <Border Grid.Column="2" Background="#30FFFFFF" BorderBrush="#40FFCCD5" BorderThickness="1" CornerRadius="3" Padding="4,1">\n`;
    calXaml += `                                            <Grid>\n`;
    calXaml += `                                                <TextBlock Text="🔄同步" FontSize="9" Foreground="#C2185B" FontWeight="Bold" />\n`;
    calXaml += `                                                <local:MyTextButton Height="16" Padding="0" Margin="0" Text="  " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">\n`;
    calXaml += `                                                    <local:CustomEventService.Events><local:CustomEventCollection>\n`;
    calXaml += `                                                        <local:CustomEvent Type="刷新页面" Data="-" />\n`;
    calXaml += `                                                    </local:CustomEventCollection></local:CustomEventService.Events>\n`;
    calXaml += `                                                </local:MyTextButton>\n`;
    calXaml += `                                            </Grid>\n`;
    calXaml += `                                        </Border>\n`;
    calXaml += `                                    </Grid>\n`;
    calXaml += `                                </Border>\n`;

    // 纪念日专属徽章 (相识第 X 天 + 相恋第 Y 天，字号大一号为 10.5)
    calXaml += `                                <Border Background="#40FFFFFF" BorderBrush="#40FFCCD5" BorderThickness="1" CornerRadius="4" Padding="4,3" Margin="0,3,0,0">\n`;
    calXaml += `                                    <TextBlock Text="🌱 相识第 ${meetDays} 天  |  💖 相恋第 ${loveDays} 天" FontSize="10.5" Foreground="#D81B60" FontWeight="Bold" HorizontalAlignment="Center" VerticalAlignment="Center" />\n`;
    calXaml += `                                </Border>\n`;

    // 宜忌每日运势 (内嵌日历底部，字号大一号为 10.5，每天自动轮换)
    calXaml += `                                <Border Background="#40FFFFFF" BorderBrush="#40FFCCD5" BorderThickness="1" CornerRadius="4" Padding="6,4" Margin="0,3,0,0">\n`;
    calXaml += `                                    <StackPanel>\n`;
    calXaml += `                                        <!-- 宜 -->\n`;
    calXaml += `                                        <StackPanel Orientation="Horizontal" Margin="0,1,0,3">\n`;
    calXaml += `                                            <Border Background="#254CAF50" BorderBrush="#504CAF50" BorderThickness="1" CornerRadius="3" Padding="4,1" Margin="0,0,6,0">\n`;
    calXaml += `                                                <TextBlock Text="【宜】" FontSize="10.5" FontWeight="Bold" Foreground="#2E7D32" VerticalAlignment="Center" />\n`;
    calXaml += `                                            </Border>\n`;
    calXaml += `                                            <TextBlock Text="${dailyYi}" FontSize="10.5" Foreground="#333333" VerticalAlignment="Center" />\n`;
    calXaml += `                                        </StackPanel>\n`;
    calXaml += `                                        <!-- 忌 -->\n`;
    calXaml += `                                        <StackPanel Orientation="Horizontal" Margin="0,1,0,1">\n`;
    calXaml += `                                            <Border Background="#25F44336" BorderBrush="#50F44336" BorderThickness="1" CornerRadius="3" Padding="4,1" Margin="0,0,6,0">\n`;
    calXaml += `                                                <TextBlock Text="【忌】" FontSize="10.5" FontWeight="Bold" Foreground="#C62828" VerticalAlignment="Center" />\n`;
    calXaml += `                                            </Border>\n`;
    calXaml += `                                            <TextBlock Text="${dailyJi}" FontSize="10.5" Foreground="#333333" VerticalAlignment="Center" />\n`;
    calXaml += `                                        </StackPanel>\n`;
    calXaml += `                                    </StackPanel>\n`;
    calXaml += `                                </Border>\n`;

    calXaml += `                            </StackPanel>\n`;
    calXaml += `                        </Grid>\n`;
  }
  calXaml += '                    </Grid>\n                </StackPanel>\n            </Border>\n        </Grid>\n';

  // 9. 原始完美顶部漫游猫咪与首屏结构 (左侧照片高度设为 298 以严格对齐加大字号后的日历底部)
  const headPart = `<StackPanel xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
            xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
            xmlns:local="clr-namespace:PCL;assembly=Plain Craft Launcher 2"
            Margin="0,0,0,10">
    <!-- ================= 🌸 全屏顶层漫游桌宠 (巡游 + 悬浮粉心 + 同作用域绝对长按定身抓取生气挣扎 + 松开/移出完美复原) ================= -->
    <Canvas Height="0" Width="0" VerticalAlignment="Top" HorizontalAlignment="Left" Panel.ZIndex="999" ClipToBounds="False">
        <Grid Canvas.Left="15" Canvas.Top="40" Width="75" Height="85" Opacity="0.95" RenderTransformOrigin="0.5,0.5" ClipToBounds="False">
            <Grid.RenderTransform>
                <TransformGroup>
                    <ScaleTransform ScaleX="1" ScaleY="1" />
                    <TranslateTransform X="0" Y="0" />
                </TransformGroup>
            </Grid.RenderTransform>
            <Grid.Triggers>
                <EventTrigger RoutedEvent="FrameworkElement.Loaded">
                    <BeginStoryboard x:Name="RoamAction">
                        <Storyboard RepeatBehavior="Forever">
                            <DoubleAnimationUsingKeyFrames Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.X)">
                                <LinearDoubleKeyFrame Value="0" KeyTime="0:0:0" />
                                <LinearDoubleKeyFrame Value="350" KeyTime="0:0:8" />
                                <LinearDoubleKeyFrame Value="640" KeyTime="0:0:15" />
                                <LinearDoubleKeyFrame Value="640" KeyTime="0:0:17" />
                                <LinearDoubleKeyFrame Value="610" KeyTime="0:0:23" />
                                <LinearDoubleKeyFrame Value="460" KeyTime="0:0:29" />
                                <LinearDoubleKeyFrame Value="650" KeyTime="0:0:35" />
                                <LinearDoubleKeyFrame Value="650" KeyTime="0:0:39" />
                                <LinearDoubleKeyFrame Value="650" KeyTime="0:0:41" />
                                <LinearDoubleKeyFrame Value="320" KeyTime="0:0:47" />
                                <LinearDoubleKeyFrame Value="15" KeyTime="0:0:52" />
                                <LinearDoubleKeyFrame Value="15" KeyTime="0:0:54" />
                                <LinearDoubleKeyFrame Value="10" KeyTime="0:0:57" />
                                <LinearDoubleKeyFrame Value="0" KeyTime="0:1:0" />
                            </DoubleAnimationUsingKeyFrames>
                            <DoubleAnimationUsingKeyFrames Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.Y)">
                                <LinearDoubleKeyFrame Value="0" KeyTime="0:0:0" />
                                <LinearDoubleKeyFrame Value="15" KeyTime="0:0:8" />
                                <LinearDoubleKeyFrame Value="10" KeyTime="0:0:15" />
                                <LinearDoubleKeyFrame Value="10" KeyTime="0:0:17" />
                                <LinearDoubleKeyFrame Value="180" KeyTime="0:0:23" />
                                <LinearDoubleKeyFrame Value="340" KeyTime="0:0:29" />
                                <LinearDoubleKeyFrame Value="440" KeyTime="0:0:35" />
                                <LinearDoubleKeyFrame Value="560" KeyTime="0:0:39" />
                                <LinearDoubleKeyFrame Value="560" KeyTime="0:0:41" />
                                <LinearDoubleKeyFrame Value="570" KeyTime="0:0:47" />
                                <LinearDoubleKeyFrame Value="500" KeyTime="0:0:52" />
                                <LinearDoubleKeyFrame Value="500" KeyTime="0:0:54" />
                                <LinearDoubleKeyFrame Value="240" KeyTime="0:0:57" />
                                <LinearDoubleKeyFrame Value="0" KeyTime="0:1:0" />
                            </DoubleAnimationUsingKeyFrames>
                            <DoubleAnimationUsingKeyFrames Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleX)">
                                <DiscreteDoubleKeyFrame Value="1" KeyTime="0:0:0" />
                                <DiscreteDoubleKeyFrame Value="1" KeyTime="0:0:17" />
                                <DiscreteDoubleKeyFrame Value="-1" KeyTime="0:0:17.1" />
                                <DiscreteDoubleKeyFrame Value="-1" KeyTime="0:0:29.5" />
                                <DiscreteDoubleKeyFrame Value="1" KeyTime="0:0:29.6" />
                                <DiscreteDoubleKeyFrame Value="1" KeyTime="0:0:41" />
                                <DiscreteDoubleKeyFrame Value="-1" KeyTime="0:0:41.1" />
                                <DiscreteDoubleKeyFrame Value="-1" KeyTime="0:0:54" />
                                <DiscreteDoubleKeyFrame Value="1" KeyTime="0:0:54.1" />
                                <DiscreteDoubleKeyFrame Value="1" KeyTime="0:1:0" />
                            </DoubleAnimationUsingKeyFrames>
                        </Storyboard>
                    </BeginStoryboard>
                </EventTrigger>
                <EventTrigger RoutedEvent="UIElement.MouseEnter">
                    <BeginStoryboard>
                        <Storyboard>
                            <DoubleAnimationUsingKeyFrames Storyboard.TargetName="PetBody" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[2].(TranslateTransform.Y)">
                                <LinearDoubleKeyFrame Value="0" KeyTime="0:0:0" />
                                <LinearDoubleKeyFrame Value="-6" KeyTime="0:0:0.12" />
                                <LinearDoubleKeyFrame Value="0" KeyTime="0:0:0.24" />
                                <LinearDoubleKeyFrame Value="-3" KeyTime="0:0:0.32" />
                                <LinearDoubleKeyFrame Value="0" KeyTime="0:0:0.4" />
                            </DoubleAnimationUsingKeyFrames>
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="Opacity" To="1" BeginTime="0:0:0.08" Duration="0:0:0.2" />
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleX)" To="1.35" BeginTime="0:0:0.08" Duration="0:0:0.25" />
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleY)" To="1.35" BeginTime="0:0:0.08" Duration="0:0:0.25" />
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.Y)" To="-14" BeginTime="0:0:0.08" Duration="0:0:0.5" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="Opacity" To="0.95" BeginTime="0:0:0.16" Duration="0:0:0.2" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleX)" To="1.1" BeginTime="0:0:0.16" Duration="0:0:0.25" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleY)" To="1.1" BeginTime="0:0:0.16" Duration="0:0:0.25" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.X)" To="14" BeginTime="0:0:0.16" Duration="0:0:0.45" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.Y)" To="-18" BeginTime="0:0:0.16" Duration="0:0:0.45" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="Opacity" To="1" BeginTime="0:0:0.22" Duration="0:0:0.18" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleX)" To="1.2" BeginTime="0:0:0.22" Duration="0:0:0.25" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleY)" To="1.2" BeginTime="0:0:0.22" Duration="0:0:0.25" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.X)" To="-14" BeginTime="0:0:0.22" Duration="0:0:0.45" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.Y)" To="-16" BeginTime="0:0:0.22" Duration="0:0:0.45" />
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="Opacity" To="0" BeginTime="0:0:2.5" Duration="0:0:0.4" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="Opacity" To="0" BeginTime="0:0:2.5" Duration="0:0:0.4" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="Opacity" To="0" BeginTime="0:0:2.5" Duration="0:0:0.4" />
                        </Storyboard>
                    </BeginStoryboard>
                </EventTrigger>
                <EventTrigger RoutedEvent="UIElement.MouseLeave">
                    <ResumeStoryboard BeginStoryboardName="RoamAction" />
                    <BeginStoryboard>
                        <Storyboard>
                            <DoubleAnimation Storyboard.TargetName="NormalPet" Storyboard.TargetProperty="Opacity" To="1" Duration="0:0:0.1" />
                            <DoubleAnimation Storyboard.TargetName="AngryPet" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.1" />
                            <DoubleAnimation Storyboard.TargetName="PetBody" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[2].(TranslateTransform.Y)" To="0" Duration="0:0:0.1" />
                            <DoubleAnimation Storyboard.TargetName="PetBody" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(RotateTransform.Angle)" To="0" Duration="0:0:0.1" />
                            <DoubleAnimation Storyboard.TargetName="AngerMark" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.1" />
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.15" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.15" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.15" />
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleX)" To="0.3" Duration="0:0:0.15" />
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleY)" To="0.3" Duration="0:0:0.15" />
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.Y)" To="0" Duration="0:0:0.15" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.X)" To="0" Duration="0:0:0.15" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.Y)" To="0" Duration="0:0:0.15" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.X)" To="0" Duration="0:0:0.15" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(TranslateTransform.Y)" To="0" Duration="0:0:0.15" />
                        </Storyboard>
                    </BeginStoryboard>
                </EventTrigger>
                <EventTrigger RoutedEvent="UIElement.PreviewMouseDown">
                    <PauseStoryboard BeginStoryboardName="RoamAction" />
                    <BeginStoryboard>
                        <Storyboard>
                            <DoubleAnimation Storyboard.TargetName="NormalPet" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.04" />
                            <DoubleAnimation Storyboard.TargetName="AngryPet" Storyboard.TargetProperty="Opacity" To="1" Duration="0:0:0.04" />
                            <DoubleAnimation Storyboard.TargetName="PetBody" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[2].(TranslateTransform.Y)" To="-14" Duration="0:0:0.08" />
                            <DoubleAnimationUsingKeyFrames Storyboard.TargetName="PetBody" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(RotateTransform.Angle)" RepeatBehavior="Forever">
                                <LinearDoubleKeyFrame Value="0" KeyTime="0:0:0" />
                                <LinearDoubleKeyFrame Value="-12" KeyTime="0:0:0.08" />
                                <LinearDoubleKeyFrame Value="12" KeyTime="0:0:0.22" />
                                <LinearDoubleKeyFrame Value="-10" KeyTime="0:0:0.35" />
                                <LinearDoubleKeyFrame Value="10" KeyTime="0:0:0.48" />
                                <LinearDoubleKeyFrame Value="0" KeyTime="0:0:0.60" />
                            </DoubleAnimationUsingKeyFrames>
                            <DoubleAnimation Storyboard.TargetName="AngerMark" Storyboard.TargetProperty="Opacity" To="1" Duration="0:0:0.08" />
                            <DoubleAnimation Storyboard.TargetName="MainHeart" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.04" />
                            <DoubleAnimation Storyboard.TargetName="SubHeart" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.04" />
                            <DoubleAnimation Storyboard.TargetName="StarSparkle" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.04" />
                        </Storyboard>
                    </BeginStoryboard>
                </EventTrigger>
                <EventTrigger RoutedEvent="UIElement.PreviewMouseUp">
                    <ResumeStoryboard BeginStoryboardName="RoamAction" />
                    <BeginStoryboard>
                        <Storyboard>
                            <DoubleAnimation Storyboard.TargetName="NormalPet" Storyboard.TargetProperty="Opacity" To="1" Duration="0:0:0.12" />
                            <DoubleAnimation Storyboard.TargetName="AngryPet" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.12" />
                            <DoubleAnimation Storyboard.TargetName="PetBody" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[2].(TranslateTransform.Y)" To="0" Duration="0:0:0.12" />
                            <DoubleAnimation Storyboard.TargetName="PetBody" Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[1].(RotateTransform.Angle)" To="0" Duration="0:0:0.08" />
                            <DoubleAnimation Storyboard.TargetName="AngerMark" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.12" />
                        </Storyboard>
                    </BeginStoryboard>
                </EventTrigger>
            </Grid.Triggers>
            <Grid x:Name="PetBody" Width="55" Height="46" HorizontalAlignment="Center" VerticalAlignment="Bottom" RenderTransformOrigin="0.5,0.5">
                <Grid.RenderTransform>
                    <TransformGroup>
                        <ScaleTransform ScaleX="1" ScaleY="1" />
                        <RotateTransform Angle="0" />
                        <TranslateTransform Y="0" />
                    </TransformGroup>
                </Grid.RenderTransform>
                <local:MyImage x:Name="NormalPet" Width="55" Height="46" Stretch="Uniform" Source="PCL/Assets/pet.png" Opacity="1" />
                <local:MyImage x:Name="AngryPet" Width="55" Height="46" Stretch="Uniform" Source="PCL/Assets/pet_angry.png" Opacity="0" />
            </Grid>
            <Border Width="75" Height="85" Background="#01FFFFFF" HorizontalAlignment="Center" VerticalAlignment="Stretch" ClipToBounds="False" />
            <Grid Height="38" VerticalAlignment="Top" HorizontalAlignment="Center" IsHitTestVisible="False" ClipToBounds="False">
                <Grid x:Name="MainHeart" Opacity="0" RenderTransformOrigin="0.5,0.5" Margin="-2,10,0,0">
                    <Grid.RenderTransform>
                        <TransformGroup>
                            <ScaleTransform ScaleX="0.3" ScaleY="0.3" />
                            <TranslateTransform Y="0" />
                        </TransformGroup>
                    </Grid.RenderTransform>
                    <Path Data="M 12 21.35 C 11.4 20.8 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 C 9.24 3 10.91 3.81 12 5.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 C 22 12.28 12.6 20.8 12 21.35 Z"
                          Fill="#FFFF2A7A" Stroke="#FFFF80AB" StrokeThickness="0.6" Width="22" Height="22" Stretch="Uniform" />
                </Grid>
                <Grid x:Name="SubHeart" Opacity="0" RenderTransformOrigin="0.5,0.5" Margin="0,10,0,0">
                    <Grid.RenderTransform>
                        <TransformGroup>
                            <ScaleTransform ScaleX="0.4" ScaleY="0.4" />
                            <TranslateTransform X="0" Y="0" />
                        </TransformGroup>
                    </Grid.RenderTransform>
                    <Path Data="M 12 21.35 C 11.4 20.8 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 C 9.24 3 10.91 3.81 12 5.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 C 22 12.28 12.6 20.8 12 21.35 Z"
                          Fill="#FFFF75A0" Width="14" Height="14" Stretch="Uniform" Margin="8,-2,0,0" />
                </Grid>
                <Grid x:Name="StarSparkle" Opacity="0" RenderTransformOrigin="0.5,0.5" Margin="0,10,0,0">
                    <Grid.RenderTransform>
                        <TransformGroup>
                            <ScaleTransform ScaleX="0.3" ScaleY="0.3" />
                            <TranslateTransform X="0" Y="0" />
                        </TransformGroup>
                    </Grid.RenderTransform>
                    <Path Data="M 6 0 L 7.5 4.5 L 12 6 L 7.5 7.5 L 6 12 L 4.5 7.5 L 0 6 L 4.5 4.5 Z"
                          Fill="#FFFFD54F" Stroke="#FFFFF59D" StrokeThickness="0.5" Width="13" Height="13" Stretch="Uniform" Margin="-8,-2,0,0" />
                </Grid>
                <Grid x:Name="AngerMark" Opacity="0" RenderTransformOrigin="0.5,0.5" Margin="14,2,0,0">
                    <TextBlock Text="💢" FontSize="20" Foreground="#FFE53935" FontWeight="Bold" />
                </Grid>
            </Grid>
        </Grid>
    </Canvas>

    <!-- ================= 第一行：首屏黄金双列布局 (WPF 2行2列网格，引擎级绝对底部共线) ================= -->
    <Grid Margin="0,0,0,10">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="1.1*" />
            <ColumnDefinition Width="1.0*" />
        </Grid.ColumnDefinitions>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="Auto" />
        </Grid.RowDefinitions>

        <!-- Row 0, Col 0: 🐾 萌宠日常 (6 图本地无缝循环轮播，高度 298 与加长日历严格等底) -->
        <Grid Grid.Row="0" Grid.Column="0" Margin="0,0,6,6">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto" />
                <RowDefinition Height="*" />
            </Grid.RowDefinitions>
            <TextBlock Grid.Row="0" Text="🐾 萌宠日常" FontSize="13" FontWeight="Bold" Foreground="#D81B60" Margin="4,0,0,4" />
            <Border Grid.Row="1" CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="6" VerticalAlignment="Stretch">
                <Border CornerRadius="8" Background="#40FFFFFF" BorderBrush="#50FFCCD5" BorderThickness="1" ClipToBounds="True" VerticalAlignment="Stretch">
                    <Grid VerticalAlignment="Stretch">
                        <Grid Visibility="{variable:Photo_0_V:Visible}" VerticalAlignment="Stretch">
                            <local:MyImage Height="298" HorizontalAlignment="Stretch" VerticalAlignment="Stretch" Stretch="Fill" Source="PCL/Assets/photo/1.jpg" />
                        </Grid>
                        <Grid Visibility="{variable:Photo_1_V:Collapsed}" VerticalAlignment="Stretch">
                            <local:MyImage Height="298" HorizontalAlignment="Stretch" VerticalAlignment="Stretch" Stretch="Fill" Source="PCL/Assets/photo/2.jpg" />
                        </Grid>
                        <Grid Visibility="{variable:Photo_2_V:Collapsed}" VerticalAlignment="Stretch">
                            <local:MyImage Height="298" HorizontalAlignment="Stretch" VerticalAlignment="Stretch" Stretch="Fill" Source="PCL/Assets/photo/3.jpg" />
                        </Grid>
                        <Grid Visibility="{variable:Photo_3_V:Collapsed}" VerticalAlignment="Stretch">
                            <local:MyImage Height="298" HorizontalAlignment="Stretch" VerticalAlignment="Stretch" Stretch="Fill" Source="PCL/Assets/photo/4.jpg" />
                        </Grid>
                        <Grid Visibility="{variable:Photo_4_V:Collapsed}" VerticalAlignment="Stretch">
                            <local:MyImage Height="298" HorizontalAlignment="Stretch" VerticalAlignment="Stretch" Stretch="Fill" Source="PCL/Assets/photo/5.jpg" />
                        </Grid>
                        <Grid Visibility="{variable:Photo_5_V:Collapsed}" VerticalAlignment="Stretch">
                            <local:MyImage Height="298" HorizontalAlignment="Stretch" VerticalAlignment="Stretch" Stretch="Fill" Source="PCL/Assets/photo/6.jpg" />
                        </Grid>
                    </Grid>
                </Border>
            </Border>
        </Grid>

        <!-- Row 0, Col 1: 📅 冒险打卡日历 -->
        <Grid Grid.Row="0" Grid.Column="1" Margin="6,0,0,6">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto" />
                <RowDefinition Height="*" />
            </Grid.RowDefinitions>
            <TextBlock Grid.Row="0" Text="📅 冒险打卡日历" FontSize="13" FontWeight="Bold" Foreground="#D81B60" Margin="4,0,0,4" />
            <Border Grid.Row="1" CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="10,8" VerticalAlignment="Stretch">
                <StackPanel>`;

  // 10. 原始完美尾部模板
  const tailPart = `<!-- Row 1, Col 0: 💡 冒险生存贴士 -->
        <Grid Grid.Row="1" Grid.Column="0" Margin="0,0,6,0">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto" />
                <RowDefinition Height="*" />
            </Grid.RowDefinitions>
            <TextBlock Grid.Row="0" Text="💡 冒险生存小贴士" FontSize="13" FontWeight="Bold" Foreground="#D81B60" Margin="4,2,0,4" />
            <Border Grid.Row="1" CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="12,8" VerticalAlignment="Stretch">
                <Border.Triggers>
                    <EventTrigger RoutedEvent="FrameworkElement.Loaded">
                        <BeginStoryboard>
                            <Storyboard RepeatBehavior="Forever">
                                <DoubleAnimationUsingKeyFrames Storyboard.TargetProperty="Opacity">
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:1" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:7" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:0:8" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:9" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:15" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:0:16" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:17" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:23" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:0:24" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:25" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:31" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:0:32" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:33" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:39" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:0:40" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:41" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:47" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:0:48" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:49" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:55" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:0:56" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:0:57" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:3" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:1:4" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:5" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:11" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:1:12" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:13" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:19" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:1:20" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:21" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:27" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:1:28" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:29" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:35" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:1:36" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:37" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:43" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:1:44" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:45" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:51" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:1:52" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:53" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:1:59" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:2:0" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:1" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:7" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:2:8" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:9" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:15" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:2:16" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:17" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:23" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:2:24" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:25" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:31" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:2:32" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:33" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:39" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:2:40" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:41" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:47" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:2:48" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:49" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:55" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:2:56" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:2:57" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:3:3" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:3:4" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:3:5" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:3:11" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:3:12" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:3:13" />
                                    <LinearDoubleKeyFrame Value="1" KeyTime="0:3:19" />
                                    <LinearDoubleKeyFrame Value="0.3" KeyTime="0:3:20" />
                                </DoubleAnimationUsingKeyFrames>
                            </Storyboard>
                        </BeginStoryboard>
                    </EventTrigger>
                </Border.Triggers>
                <StackPanel Height="58" VerticalAlignment="Center" ClipToBounds="True">
                    <TextBlock Text="【猫与苦力怕】" FontWeight="Bold" FontSize="11.5" Foreground="#D81B60" Margin="0,0,0,2">
                        <TextBlock.Triggers>
                            <EventTrigger RoutedEvent="FrameworkElement.Loaded">
                                <BeginStoryboard>
                                    <Storyboard RepeatBehavior="Forever">
                                        <StringAnimationUsingKeyFrames Storyboard.TargetProperty="Text">
                                            <DiscreteStringKeyFrame Value="【猫与苦力怕】" KeyTime="0:0:0" />
                                            <DiscreteStringKeyFrame Value="【无限水与水源】" KeyTime="0:0:8" />
                                            <DiscreteStringKeyFrame Value="【下矿必备水桶】" KeyTime="0:0:16" />
                                            <DiscreteStringKeyFrame Value="【床与下界防炸】" KeyTime="0:0:24" />
                                            <DiscreteStringKeyFrame Value="【火把防刷怪机制】" KeyTime="0:0:32" />
                                            <DiscreteStringKeyFrame Value="【精准采集镐】" KeyTime="0:0:40" />
                                            <DiscreteStringKeyFrame Value="【附魔书与铁砧】" KeyTime="0:0:48" />
                                            <DiscreteStringKeyFrame Value="【村民打折大法】" KeyTime="0:0:56" />
                                            <DiscreteStringKeyFrame Value="【鞘翅与烟花火箭】" KeyTime="0:1:4" />
                                            <DiscreteStringKeyFrame Value="【末影珍珠保命】" KeyTime="0:1:12" />
                                            <DiscreteStringKeyFrame Value="【不死图腾副手】" KeyTime="0:1:20" />
                                            <DiscreteStringKeyFrame Value="【钻石矿最佳层数】" KeyTime="0:1:28" />
                                            <DiscreteStringKeyFrame Value="【下界合金搜寻】" KeyTime="0:1:36" />
                                            <DiscreteStringKeyFrame Value="【经验修补神级附魔】" KeyTime="0:1:44" />
                                            <DiscreteStringKeyFrame Value="【潜影盒整理神器】" KeyTime="0:1:52" />
                                            <DiscreteStringKeyFrame Value="【信标金字塔增益】" KeyTime="0:2:0" />
                                            <DiscreteStringKeyFrame Value="【潮涌核心水下呼吸】" KeyTime="0:2:8" />
                                            <DiscreteStringKeyFrame Value="【三叉戟与引雷穿刺】" KeyTime="0:2:16" />
                                            <DiscreteStringKeyFrame Value="【高压苦力怕与头颅】" KeyTime="0:2:24" />
                                            <DiscreteStringKeyFrame Value="【雪傀儡自动刷雪】" KeyTime="0:2:32" />
                                            <DiscreteStringKeyFrame Value="【铁傀儡玫瑰与防御】" KeyTime="0:2:40" />
                                            <DiscreteStringKeyFrame Value="【狐狸叼刀高伤战神】" KeyTime="0:2:48" />
                                            <DiscreteStringKeyFrame Value="【美西螈装桶与战斗】" KeyTime="0:2:56" />
                                            <DiscreteStringKeyFrame Value="【青蛙与蛙鸣灯】" KeyTime="0:3:4" />
                                            <DiscreteStringKeyFrame Value="【山羊角吹奏与掉落】" KeyTime="0:3:12" />
                                            <DiscreteStringKeyFrame Value="【蜜蜂与蜂巢剪蜜】" KeyTime="0:3:20" />
                                            <DiscreteStringKeyFrame Value="【流浪商人隐身机制】" KeyTime="0:3:28" />
                                            <DiscreteStringKeyFrame Value="【鹦鹉雷达警报】" KeyTime="0:3:36" />
                                            <DiscreteStringKeyFrame Value="【去皮原木建筑】" KeyTime="0:3:44" />
                                            <DiscreteStringKeyFrame Value="【堆肥桶骨粉制造】" KeyTime="0:3:52" />
                                            <DiscreteStringKeyFrame Value="【炼药锅洗色技巧】" KeyTime="0:4:0" />
                                            <DiscreteStringKeyFrame Value="【避雷针防火防巫】" KeyTime="0:4:8" />
                                            <DiscreteStringKeyFrame Value="【末地水晶超强威力】" KeyTime="0:4:16" />
                                            <DiscreteStringKeyFrame Value="【潜声守卫潜行避战】" KeyTime="0:4:24" />
                                            <DiscreteStringKeyFrame Value="【潜声传感器无线红石】" KeyTime="0:4:32" />
                                            <DiscreteStringKeyFrame Value="【铜块氧化与蜜脾打蜡】" KeyTime="0:4:40" />
                                            <DiscreteStringKeyFrame Value="【村民恐慌刷铁机】" KeyTime="0:4:48" />
                                            <DiscreteStringKeyFrame Value="【细雪与皮革靴子】" KeyTime="0:4:56" />
                                            <DiscreteStringKeyFrame Value="【干草块粘液块减伤】" KeyTime="0:5:4" />
                                            <DiscreteStringKeyFrame Value="【漏斗熔炉全自动烧炼】" KeyTime="0:5:12" />
                                            <DiscreteStringKeyFrame Value="【炽足兽岩浆骑行】" KeyTime="0:5:20" />
                                            <DiscreteStringKeyFrame Value="【全自动钓鱼机】" KeyTime="0:5:28" />
                                            <DiscreteStringKeyFrame Value="【锋利与亡灵杀手区别】" KeyTime="0:5:36" />
                                            <DiscreteStringKeyFrame Value="【水下门呼吸大法】" KeyTime="0:5:44" />
                                            <DiscreteStringKeyFrame Value="【气泡柱极速水电梯】" KeyTime="0:5:52" />
                                            <DiscreteStringKeyFrame Value="【末影箱跨维度互通】" KeyTime="0:6:0" />
                                            <DiscreteStringKeyFrame Value="【音符盒垫层乐器变化】" KeyTime="0:6:8" />
                                            <DiscreteStringKeyFrame Value="【地图插旗标记点】" KeyTime="0:6:16" />
                                            <DiscreteStringKeyFrame Value="【龙蛋安全采集法】" KeyTime="0:6:24" />
                                            <DiscreteStringKeyFrame Value="【彩色玻璃信标光柱】" KeyTime="0:6:32" />
                                            <DiscreteStringKeyFrame Value="【新版骆驼双人骑乘】" KeyTime="0:6:40" />
                                            <DiscreteStringKeyFrame Value="【犰狳鳞甲与狼铠】" KeyTime="0:6:48" />
                                            <DiscreteStringKeyFrame Value="【试炼密室与重锤】" KeyTime="0:6:56" />
                                            <DiscreteStringKeyFrame Value="【重锤下落蓄力秒杀】" KeyTime="0:7:4" />
                                            <DiscreteStringKeyFrame Value="【自动合成器红石工业】" KeyTime="0:7:12" />
                                            <DiscreteStringKeyFrame Value="【发光浆果洞穴照明】" KeyTime="0:7:20" />
                                            <DiscreteStringKeyFrame Value="【凋灵卡基岩天花板】" KeyTime="0:7:28" />
                                            <DiscreteStringKeyFrame Value="【樱花林浪漫花瓣地毯】" KeyTime="0:7:36" />
                                            <DiscreteStringKeyFrame Value="【嗅探兽挖掘远古种子】" KeyTime="0:7:44" />
                                            <DiscreteStringKeyFrame Value="【风弹弹射起跳连招】" KeyTime="0:7:52" />
                                            <DiscreteStringKeyFrame Value="【虚弱药水金苹果治村民】" KeyTime="0:8:0" />
                                            <DiscreteStringKeyFrame Value="【羊毛拆解四根线】" KeyTime="0:8:8" />
                                            <DiscreteStringKeyFrame Value="【仙人掌天然垃圾桶】" KeyTime="0:8:16" />
                                            <DiscreteStringKeyFrame Value="【夜视药水深海透视】" KeyTime="0:8:24" />
                                            <DiscreteStringKeyFrame Value="【潜影贝漂浮飞末地船】" KeyTime="0:8:32" />
                                            <DiscreteStringKeyFrame Value="【45度角起飞与纯烟花】" KeyTime="0:8:40" />
                                        </StringAnimationUsingKeyFrames>
                                    </Storyboard>
                                </BeginStoryboard>
                            </EventTrigger>
                        </TextBlock.Triggers>
                    </TextBlock>
                    <TextBlock FontSize="11" Foreground="#333333" TextWrapping="Wrap" LineHeight="16"
                               Text="苦力怕非常恐惧猫和豹猫！当苦力怕靠近猫时会立刻停止自爆并转身逃跑。在基地周围养猫是最好的移动护盾。">
                        <TextBlock.Triggers>
                            <EventTrigger RoutedEvent="FrameworkElement.Loaded">
                                <BeginStoryboard>
                                    <Storyboard RepeatBehavior="Forever">
                                        <StringAnimationUsingKeyFrames Storyboard.TargetProperty="Text">
                                            <DiscreteStringKeyFrame Value="苦力怕非常恐惧猫和豹猫！当苦力怕靠近猫时会立刻停止自爆并转身逃跑。在基地周围养猫是最好的移动护盾。" KeyTime="0:0:0" />
                                            <DiscreteStringKeyFrame Value="挖一个 2x2 的坑，在对角线两端各倒一桶水，就能创造出无限取水的水源！" KeyTime="0:0:8" />
                                            <DiscreteStringKeyFrame Value="一桶水是矿工最全能的生存神器！它可以瞬间将致命岩浆湖变成黑曜石安全通道、万丈悬崖落地缓降免除摔伤、冲散僵尸群。" KeyTime="0:0:16" />
                                            <DiscreteStringKeyFrame Value="千万不要在下界（地狱）和末地尝试在床上睡觉！床会产生比 TNT 还要巨大的毁天灭地大爆炸。" KeyTime="0:0:24" />
                                            <DiscreteStringKeyFrame Value="主世界的敌对怪物（僵尸、骷髅、苦力怕）只会在方块内部方块光照等级为 0 时刷新。多插火把把基地彻底照亮，就能绝对安全！" KeyTime="0:0:32" />
                                            <DiscreteStringKeyFrame Value="给钻石镐附魔【精准采集】，可以直接把脆弱的玻璃、蜂巢、菌光体甚至海晶灯原样完整挖下来带回家！" KeyTime="0:0:40" />
                                            <DiscreteStringKeyFrame Value="通过钓鱼或探险地牢找到的附魔书，可以在铁砧上直接敲到你的装备和武器上，打造出超越普通附魔台的顶级神装。" KeyTime="0:0:48" />
                                            <DiscreteStringKeyFrame Value="治愈僵尸村民后，他会为你提供永久极低折扣！配合图书管理员村民，1 颗绿宝石就能兑换顶级经验修补附魔书。" KeyTime="0:0:56" />
                                            <DiscreteStringKeyFrame Value="击败末影龙拿到鞘翅后，按两次空格键张开翅膀滑翔，副手手持烟花火箭右键即可超音速冲刺冲上云霄！" KeyTime="0:1:4" />
                                            <DiscreteStringKeyFrame Value="外出探险时不慎掉入虚空或悬崖？在坠落瞬间将末影珍珠用力甩向安全地面，就能瞬间传送脱离险境！" KeyTime="0:1:12" />
                                            <DiscreteStringKeyFrame Value="在副手装备不死图腾，受到任何致命伤害时会触发图腾复活，免除死亡并提供生命恢复和伤害吸收护盾。" KeyTime="0:1:20" />
                                            <DiscreteStringKeyFrame Value="在 1.18+ 新版本中，主世界的钻石矿脉越往深处生成越多，推荐在 Y = -53 至 -58 层挖掘，钻石分布密度最高！" KeyTime="0:1:28" />
                                            <DiscreteStringKeyFrame Value="在下界 Y = 15 层附近使用床或 TNT 进行链式定点爆破，是搜寻远古残骸（制作下界合金装备核心材料）最快的方法。" KeyTime="0:1:36" />
                                            <DiscreteStringKeyFrame Value="【经验修补】能将拾取的经验球自动转化为装备的耐久度。只要打怪或挖矿收获经验，神装永不破损！" KeyTime="0:1:44" />
                                            <DiscreteStringKeyFrame Value="用末影贝壳合成潜影盒，即使被破坏装在背包里，里面的物品也不会掉落，相当于随身携带无数个大容量移动仓库！" KeyTime="0:1:52" />
                                            <DiscreteStringKeyFrame Value="用铁块、金块或下界合金块搭建金字塔基座激活信标，能为范围内所有玩家提供无限急迫II、力量、速度等强大 Buff！" KeyTime="0:2:0" />
                                            <DiscreteStringKeyFrame Value="在水下用海晶石搭建框架激活潮涌核心，周围一定范围内的玩家将获得无限水下呼吸、水下夜视和水下极速挖掘效果！" KeyTime="0:2:8" />
                                            <DiscreteStringKeyFrame Value="附魔【引雷】的三叉戟在雷暴天气掷向生物会召唤真实雷击；配合【忠诚】附魔，投掷出去的三叉戟会自动飞回你的手中。" KeyTime="0:2:16" />
                                            <DiscreteStringKeyFrame Value="雷暴天被雷劈中的苦力怕会变成闪烁蓝光的高压苦力怕，引爆它炸死僵尸或骷髅，必掉落稀有的生物头颅！" KeyTime="0:2:24" />
                                            <DiscreteStringKeyFrame Value="用两个雪块和一个雕刻南瓜可以搭建雪傀儡，它走过的地方会留下无限雪层，用铁锹铲地即可全自动刷雪球。" KeyTime="0:2:32" />
                                            <DiscreteStringKeyFrame Value="四个铁块和一个雕刻南瓜可以召唤身强体壮的铁傀儡，他不仅会主动攻击周围的僵尸怪物，还会温柔地向小村民送上一朵红玫瑰。" KeyTime="0:2:40" />
                                            <DiscreteStringKeyFrame Value="用嘴叼起附魔钻石剑的驯服狐狸不仅会继承剑上的【锋利】与【火焰附加】属性，攻击力惊人，还会誓死保卫主人！" KeyTime="0:2:48" />
                                            <DiscreteStringKeyFrame Value="用铁桶可以把可爱的美西螈装进水桶随身携带；在水下战斗时放出美西螈大军，它们会主动帮你围攻溺尸和守卫者并为你疗伤！" KeyTime="0:2:56" />
                                            <DiscreteStringKeyFrame Value="青蛙吃下小史莱姆会产出粘液球；当青蛙吃下小岩浆怪时，会吐出极其梦幻且会发光的【蛙鸣灯】建筑方块！" KeyTime="0:3:4" />
                                            <DiscreteStringKeyFrame Value="让尖叫山羊撞击坚硬的岩石或矿石，会掉落山羊角。右键吹奏山羊角可以发出震撼悠扬的战歌号角声！" KeyTime="0:3:12" />
                                            <DiscreteStringKeyFrame Value="在蜂巢下方放置点燃的营火产生烟雾，可以安抚蜜蜂。此时用剪刀剪取蜜脾或用玻璃瓶装蜂蜜，蜜蜂绝对不会发怒蛰人！" KeyTime="0:3:20" />
                                            <DiscreteStringKeyFrame Value="流浪商人每到黄昏榜晚就会主动喝下【隐身药水】隐藏自己躲避怪物，只有牵着羊驼的栓绳会暴露他隐匿的踪迹。" KeyTime="0:3:28" />
                                            <DiscreteStringKeyFrame Value="鹦鹉会模仿周围 20 格内敌对怪物的特殊音效（如苦力怕滋滋声、僵尸低吼），在家养一只鹦鹉就是最好的活体雷达警报器！" KeyTime="0:3:36" />
                                            <DiscreteStringKeyFrame Value="手持斧头右键点击原木可以剥去树皮制作【去皮原木】，原木不仅纹理干净高级，还是现代建筑与室内装潢的核心建材。" KeyTime="0:3:44" />
                                            <DiscreteStringKeyFrame Value="将多余的小麦种子、树叶、甜浆果或花朵投入【堆肥桶（Composter）】，填满 7 层即可产出 1 袋纯天然骨粉，农田自循环必备！" KeyTime="0:3:52" />
                                            <DiscreteStringKeyFrame Value="炼药锅里装满水后，手持染过色的皮革护甲、旗帜或潜影盒右键点击炼药锅，可以洗掉颜色还原为纯净的原始状态。" KeyTime="0:4:0" />
                                            <DiscreteStringKeyFrame Value="在屋顶安装【避雷针（Lightning Rod）】可以将雷暴天气的雷击引至金属针尖，防止雷电劈中木屋引发火灾或把村民劈成女巫！" KeyTime="0:4:8" />
                                            <DiscreteStringKeyFrame Value="末地水晶不仅是复活末影龙的道具，其瞬间爆炸威力远超 TNT 与高压苦力怕，PVP 高手常利用末地水晶打出秒杀级穿透伤害！" KeyTime="0:4:16" />
                                            <DiscreteStringKeyFrame Value="远古城市里的循声守卫拥有高达 500 点生命值与穿透护甲的声波咆哮！遇到它时务必按住 Shift 潜行，利用雪球投掷引开注意力。" KeyTime="0:4:24" />
                                            <DiscreteStringKeyFrame Value="潜声传感器可以侦测震动并输出红石信号，配合校准传感器可以精准过滤特定频率（如走动、开箱），实现纯无线红石暗门！" KeyTime="0:4:32" />
                                            <DiscreteStringKeyFrame Value="暴露在空气中的铜块会随着时间逐渐氧化由橙变绿；手持【蜜脾】右键铜块可以为其打蜡，永久锁定当前最喜欢的氧化阶段！" KeyTime="0:4:40" />
                                            <DiscreteStringKeyFrame Value="村民在感到生命危险（如周围有僵尸注视）且成功入睡过的情况下，会高频召唤出铁傀磊保护自己，这就是全自动刷铁机原理。" KeyTime="0:4:48" />
                                            <DiscreteStringKeyFrame Value="进入细雪（Powder Snow）方块中会陷入并持续受到冻伤伤害；但只要穿上任意一双【皮革靴子】，就可以踩在细雪表面如履平地！" KeyTime="0:4:56" />
                                            <DiscreteStringKeyFrame Value="从几百格高空坠落时，若落在【干草块】上可减少 80% 摔落伤害；落在【粘液块（Slime Block）】上则会无伤反弹弹起！" KeyTime="0:5:4" />
                                            <DiscreteStringKeyFrame Value="在熔炉上方放漏斗连箱子投原料、侧面放漏斗连燃料箱、下方放漏斗连成品箱，即可轻松组装出无需值守的全自动烧炼工作站！" KeyTime="0:5:12" />
                                            <DiscreteStringKeyFrame Value="在下界岩浆湖上，给【炽足兽（Strider）】装上鞍，手持【诡异菌钓竿】，即可在无边无际的沸腾岩浆湖上自由平稳骑行！" KeyTime="0:5:20" />
                                            <DiscreteStringKeyFrame Value="利用音符盒、绊线钩与铁活板门配合【海之眷顾III】与【饵钓III】附魔鱼竿，可以持续稳定获取经验、附魔书、鞍与命名牌！" KeyTime="0:5:28" />
                                            <DiscreteStringKeyFrame Value="一把武器无法同时附魔这三者。【锋利】对所有生物增伤；而【亡灵杀手V】对僵尸、骨骼、凋灵有高达 12.5 点极其恐怖的特攻加成！" KeyTime="0:5:36" />
                                            <DiscreteStringKeyFrame Value="在水下放置一扇门并打开，门所在的格子不会被水流充满，可以形成一个临时的【水下空气室】供矿工无限补充水下呼吸！" KeyTime="0:5:44" />
                                            <DiscreteStringKeyFrame Value="水槽底部放置【灵魂沙】会产生将生物高速喷向水面的上升气泡柱；放置【岩浆块】则会产生向下拉扯的下沉气泡柱，用于制作极速电梯！" KeyTime="0:5:52" />
                                            <DiscreteStringKeyFrame Value="所有末影箱共享同一个玩家私有空间，即使末影箱被破碎，里面的物品也绝对安全储存在虚空中，外出挖矿必备！" KeyTime="0:6:0" />
                                            <DiscreteStringKeyFrame Value="音符盒下方垫不同的方块可以发出完全不同的乐器声：垫木头是低音吉他、垫沙子是小军鼓、垫玻璃是击弦声、垫金块是铃铛！" KeyTime="0:6:8" />
                                            <DiscreteStringKeyFrame Value="在手持的【地图】上右键点击一面插在地上的【旗帜】，地图上就会永久记录下一个专属的颜色标记点与自定义名称，探险路标神器！" KeyTime="0:6:16" />
                                            <DiscreteStringKeyFrame Value="龙蛋受击会随机瞬移。采集龙蛋的方法是：在龙蛋下方两格挖空插上一根火把，然后敲掉龙蛋正下方的方块，龙蛋掉落碰火把即变成掉落物！" KeyTime="0:6:24" />
                                            <DiscreteStringKeyFrame Value="将不同颜色的染色玻璃放置在信标光柱的正上方，光柱会瞬间染成对应颜色；叠加多层不同颜色玻璃还可以调制出梦幻渐变光柱！" KeyTime="0:6:32" />
                                            <DiscreteStringKeyFrame Value="新版骆驼不仅可以双人骑乘，还能横向大跨步冲刺越过 1.5 格障碍物，且因为身高极高，普通僵尸在地面完全够不到骑在骆驼上的玩家！" KeyTime="0:6:40" />
                                            <DiscreteStringKeyFrame Value="用刷子刷刷【犰狳（Armadillo）】可以收集犰狳鳞甲，用来为心爱的驯服狼制作坚固的【狼铠】，大幅提升狗狗的生存防御力！" KeyTime="0:6:48" />
                                            <DiscreteStringKeyFrame Value="探索地下的【试炼密室（Trial Chambers）】会遇到跳跃发射风弹的【旋风人（Breeze）】，击败它可获得风弹与制作【重锤（Mace）】的核心材料！" KeyTime="0:6:56" />
                                            <DiscreteStringKeyFrame Value="从高处下落攻击敌人时，重锤会根据下落高度产生无上限的恐怖蓄力动能伤害，且只要命中目标即可完全抵消自身的全部摔落伤害！" KeyTime="0:7:4" />
                                            <DiscreteStringKeyFrame Value="红石驱动的【自动合成器】能够根据漏斗输入的物品全自动完成工作台配方合成，是 Minecraft 全自动化工业革命的核心方块！" KeyTime="0:7:12" />
                                            <DiscreteStringKeyFrame Value="在洞穴天花板种植【发光浆果（Glow Berries）】会长出垂落的发光藤蔓，不仅天然提供 14 级亮光防止刷怪，还是极具森林氛围的装饰！" KeyTime="0:7:20" />
                                            <DiscreteStringKeyFrame Value="在地狱基岩天花板下方构造特定的 3x3 空间召唤凋灵，凋灵的头部会被卡在不可破坏的基岩中无法移动，老手常用此法安全刷下界之星！" KeyTime="0:7:28" />
                                            <DiscreteStringKeyFrame Value="樱花树林是主世界最浪漫的生物群系！这里不仅能采集到粉白色的樱花木材，地面的粉色花瓣还能像地毯一样层层叠放装饰你的花园！" KeyTime="0:7:36" />
                                            <DiscreteStringKeyFrame Value="在海底废墟用刷子刷可疑砂砾可以发掘嗅探兽蛋，它会在地面嗅探挖掘出火炬花与猫笼草等远古植物种子！" KeyTime="0:7:44" />
                                            <DiscreteStringKeyFrame Value="右键向脚下投掷【风弹（Wind Charge）】可以将自己高高弹射至空中，搭配重锤可实现完美的空中下砸连招！" KeyTime="0:7:52" />
                                            <DiscreteStringKeyFrame Value="向僵尸村民投掷【虚弱药水】并喂食一颗【金苹果】，等待几分钟后他就会变回普通村民，并为你提供永久 1 绿宝石折扣！" KeyTime="0:8:0" />
                                            <DiscreteStringKeyFrame Value="在急需线（String）却找不到蜘蛛时，把 1 个羊毛放入工作台可以直接分解成 4 根线，用来制作弓箭或牵绳！" KeyTime="0:8:8" />
                                            <DiscreteStringKeyFrame Value="任何掉落物投掷到【仙人掌】上都会瞬间被彻底破坏消失，是基地里最简单且不会引起火灾的安全垃圾筒！" KeyTime="0:8:16" />
                                            <DiscreteStringKeyFrame Value="在海洋深处或海底神殿探险时，喝一瓶【夜视药水】不仅能看清深海，还能完全穿透水清度迷雾，视野如白昼般透亮！" KeyTime="0:8:24" />
                                            <DiscreteStringKeyFrame Value="被潜影贝的子弹命中会获得【漂浮】效果向上升空；在末地城外探险时，可以借助漂浮效果直接飞上末地船顶端！" KeyTime="0:8:32" />
                                            <DiscreteStringKeyFrame Value="飞行时手持烟花火箭朝向天空 45 度角，加速效率最高；并且在烟花爆炸时不要携带具有烟火之星的火箭，否则会对自身造成爆炸伤害！" KeyTime="0:8:40" />
                                        </StringAnimationUsingKeyFrames>
                                    </Storyboard>
                                </BeginStoryboard>
                            </EventTrigger>
                        </TextBlock.Triggers>
                    </TextBlock>
                </StackPanel>
            </Border>
        </Grid>

        <!-- Row 1, Col 1: 💬 每日问候 -->
        <Grid Grid.Row="1" Grid.Column="1" Margin="6,0,0,0">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto" />
                <RowDefinition Height="*" />
            </Grid.RowDefinitions>
            <TextBlock Grid.Row="0" Text="💬 每日问候" FontSize="13" FontWeight="Bold" Foreground="#D81B60" Margin="4,2,0,4" />
            <Border Grid.Row="1" CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="12,8" VerticalAlignment="Stretch">
                <Border.Triggers>
                    <EventTrigger RoutedEvent="FrameworkElement.Loaded">
                        <BeginStoryboard>
                            <Storyboard>
                                <DoubleAnimation Storyboard.TargetProperty="Opacity" From="0.3" To="1" Duration="0:0:0.4" />
                            </Storyboard>
                        </BeginStoryboard>
                    </EventTrigger>
                </Border.Triggers>
                <Grid Height="58" VerticalAlignment="Center">
                    <TextBlock VerticalAlignment="Center" FontSize="11.5" Foreground="#333333" TextWrapping="Wrap" LineHeight="17"
                               Text="(≧▽≦)/ 欢迎回来！今天打算扩建基地城堡，还是去探险远古城市？" />
                </Grid>
            </Border>
        </Grid>
    </Grid>

    <!-- ================= 第二行：常用资源导航 (单行精选：MC百科 + LittleSkin) ================= -->
    <StackPanel Margin="0,2,0,8">
        <TextBlock Text="🌐 常用资源导航" FontSize="13" FontWeight="Bold" Foreground="#D81B60" Margin="4,0,0,4" />
        <Border CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="12,4">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="1*" />
                    <ColumnDefinition Width="1*" />
                </Grid.ColumnDefinitions>
                <!-- 左侧：MC 百科 -->
                <StackPanel Grid.Column="0" Margin="0,0,5,0">
                    <local:MyListItem Margin="-5,1,-5,1" Type="Clickable"
                                      Logo="PCL/Assets/MC.jpg"
                                      Title="MCMOD 百科" Info="中文 Minecraft 模组百科全书"
                                      EventType="打开网页" EventData="https://www.mcmod.cn" />
                </StackPanel>
                <!-- 右侧：LittleSkin 皮肤站 -->
                <StackPanel Grid.Column="1" Margin="5,0,0,0">
                    <local:MyListItem Margin="-5,1,-5,1" Type="Clickable"
                                      Logo="PCL/Assets/little skin.jpg"
                                      Title="LittleSkin 皮肤站" Info="自由、可靠的 Minecraft 皮肤站"
                                      EventType="打开网页" EventData="https://littleskin.cn" />
                </StackPanel>
            </Grid>
        </Border>
    </StackPanel>

    <!-- ================= 第三行：💖 专属浪漫签名与双人伴玩时长 ================= -->
    <StackPanel Margin="0,2,0,8">
        <Border CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="12,8">
            <StackPanel>
                <!-- 顶部专属定制标识与双人陪伴胶囊 -->
                <Grid Margin="0,0,0,4">
                    <Grid.ColumnDefinitions><ColumnDefinition Width="*" /><ColumnDefinition Width="Auto" /></Grid.ColumnDefinitions>
                    <TextBlock Grid.Column="0" Text="💖 Crafted with love · For My Baby 专属定制 🌸" FontSize="12" FontWeight="Bold" Foreground="#D81B60" VerticalAlignment="Center" />
                    ${durationCompanionBlock}
                </Grid>
                <!-- 悄悄话信笺展示区 (单一 TextBlock 架构，伴玩阶段与甜言蜜语持续轮播) -->
                <Border CornerRadius="8" Background="#40FFFFFF" BorderBrush="#50FFCCD5" BorderThickness="1" Padding="10,6">
                    <Border.Triggers>
                        <EventTrigger RoutedEvent="FrameworkElement.Loaded">
                            <BeginStoryboard>
                                <Storyboard RepeatBehavior="Forever">
                                    <DoubleAnimationUsingKeyFrames Storyboard.TargetProperty="Opacity" Duration="0:0:9">
                                        <LinearDoubleKeyFrame Value="0.15" KeyTime="0:0:0.0" />
                                        <LinearDoubleKeyFrame Value="1.0" KeyTime="0:0:0.6" />
                                        <LinearDoubleKeyFrame Value="1.0" KeyTime="0:0:8.4" />
                                        <LinearDoubleKeyFrame Value="0.15" KeyTime="0:0:9.0" />
                                    </DoubleAnimationUsingKeyFrames>
                                </Storyboard>
                            </BeginStoryboard>
                        </EventTrigger>
                    </Border.Triggers>
                    <Grid Height="20">
                        <TextBlock Text="无论在方块世界走多远，我永远是你最坚固的避难所与指路火把 🕯️💖" FontSize="11.5" Foreground="#333333" TextWrapping="Wrap" HorizontalAlignment="Center" VerticalAlignment="Center">
                            <TextBlock.Triggers>
                                <EventTrigger RoutedEvent="FrameworkElement.Loaded">
                                    <BeginStoryboard>
                                        <Storyboard RepeatBehavior="Forever">
                                            <StringAnimationUsingKeyFrames Storyboard.TargetProperty="Text">
                                                <DiscreteStringKeyFrame Value="无论在方块世界走多远，我永远是你最坚固的避难所与指路火把 🕯️💖" KeyTime="0:0:0" />
                                                <DiscreteStringKeyFrame Value="今天也想陪你一起去下矿挖钻石、看一场方块日落、盖属于我们的大城堡~ 🏰🌸" KeyTime="0:0:9" />
                                                <DiscreteStringKeyFrame Value="${timeReminderText}" KeyTime="0:0:18" />
                                                <DiscreteStringKeyFrame Value="遇到苦力怕别害怕，我拿着盾牌和不死图腾挡在你的前面！🛡️✨" KeyTime="0:0:27" />
                                                <DiscreteStringKeyFrame Value="在主世界所有的生物群系与风景里，你就是我最心动的一朵专属樱花 🌸💍" KeyTime="0:0:36" />
                                                <DiscreteStringKeyFrame Value="愿你的每一次冒险都有幸运附魔，现实里的每一天都被满满的爱包围~ ( ˶˘ ³˘)♥" KeyTime="0:0:45" />
                                                <DiscreteStringKeyFrame Value="今天也是元气满满的一天，记得要开心快乐，做自己喜欢的事情~ 🌸💖" KeyTime="0:0:54" />
                                            </StringAnimationUsingKeyFrames>
                                        </Storyboard>
                                    </BeginStoryboard>
                                </EventTrigger>
                            </TextBlock.Triggers>
                        </TextBlock>
                    </Grid>
                </Border>
            </StackPanel>
        </Border>
    </StackPanel>

    <!-- ================= 第四行（最底部）：🛠️ 主题定制与管理 (相册本地秒读 · 网页端管理) ================= -->
    <StackPanel Margin="0,2,0,0">
        <TextBlock Text="🛠️ 主题定制与管理" FontSize="13" FontWeight="Bold" Foreground="#D81B60" Margin="4,0,0,4" />
        <Border CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="8,6">
            <Grid>
                <Grid.ColumnDefinitions><ColumnDefinition Width="*" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                <Grid.RowDefinitions><RowDefinition Height="Auto" /><RowDefinition Height="Auto" /><RowDefinition Height="Auto" /></Grid.RowDefinitions>
                <!-- 1. 每日问候 (打开云端后台) -->
                <Border Grid.Row="0" Grid.Column="0" Margin="2,3,4,3" CornerRadius="6" BorderThickness="1" Padding="6,4">
                    <Border.Background><SolidColorBrush Color="#40FFFFFF" /></Border.Background>
                    <Border.BorderBrush><SolidColorBrush Color="#50FFCCD5" /></Border.BorderBrush>
                    <Border.Triggers>
                        <EventTrigger RoutedEvent="UIElement.MouseEnter"><BeginStoryboard><Storyboard>
                            <ColorAnimation Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)" To="#EBF3FB" Duration="0:0:0.12" />
                            <ColorAnimation Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)" To="#C6DCF4" Duration="0:0:0.12" />
                        </Storyboard></BeginStoryboard></EventTrigger>
                        <EventTrigger RoutedEvent="UIElement.MouseLeave"><BeginStoryboard><Storyboard>
                            <ColorAnimation Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)" To="#40FFFFFF" Duration="0:0:0.12" />
                            <ColorAnimation Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)" To="#50FFCCD5" Duration="0:0:0.12" />
                        </Storyboard></BeginStoryboard></EventTrigger>
                    </Border.Triggers>
                    <Grid Height="32">
                        <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                        <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                            <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/daily_greeting.jpg" />
                        </Border>
                        <StackPanel Grid.Column="1" VerticalAlignment="Center">
                            <TextBlock Text="每日问候" FontSize="12" FontWeight="Bold" Foreground="#333333" />
                            <TextBlock Text="查看并管理每日问候语" FontSize="10" Foreground="#777777" Margin="0,1,0,0" />
                        </StackPanel>
                        <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                            <local:CustomEventService.Events><local:CustomEventCollection>
                                <local:CustomEvent Type="打开网页" Data="${manageUrl}" />
                            </local:CustomEventCollection></local:CustomEventService.Events>
                        </local:MyTextButton>
                    </Grid>
                </Border>
                <!-- 2. 生存贴士 (打开云端后台) -->
                <Border Grid.Row="0" Grid.Column="1" Margin="4,3,2,3" CornerRadius="6" BorderThickness="1" Padding="6,4">
                    <Border.Background><SolidColorBrush Color="#40FFFFFF" /></Border.Background>
                    <Border.BorderBrush><SolidColorBrush Color="#50FFCCD5" /></Border.BorderBrush>
                    <Border.Triggers>
                        <EventTrigger RoutedEvent="UIElement.MouseEnter"><BeginStoryboard><Storyboard>
                            <ColorAnimation Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)" To="#EBF3FB" Duration="0:0:0.12" />
                            <ColorAnimation Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)" To="#C6DCF4" Duration="0:0:0.12" />
                        </Storyboard></BeginStoryboard></EventTrigger>
                        <EventTrigger RoutedEvent="UIElement.MouseLeave"><BeginStoryboard><Storyboard>
                            <ColorAnimation Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)" To="#40FFFFFF" Duration="0:0:0.12" />
                            <ColorAnimation Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)" To="#50FFCCD5" Duration="0:0:0.12" />
                        </Storyboard></BeginStoryboard></EventTrigger>
                    </Border.Triggers>
                    <Grid Height="32">
                        <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                        <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                            <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/tips.jpg" />
                        </Border>
                        <StackPanel Grid.Column="1" VerticalAlignment="Center">
                            <TextBlock Text="生存贴士" FontSize="12" FontWeight="Bold" Foreground="#333333" />
                            <TextBlock Text="查看并学习实用游戏技巧" FontSize="10" Foreground="#777777" Margin="0,1,0,0" />
                        </StackPanel>
                        <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                            <local:CustomEventService.Events><local:CustomEventCollection>
                                <local:CustomEvent Type="打开网页" Data="${manageUrl}" />
                            </local:CustomEventCollection></local:CustomEventService.Events>
                        </local:MyTextButton>
                    </Grid>
                </Border>
                <!-- 3. 萌宠相册 (一键打开本地文件夹 PCL/Assets/photo) -->
                <Border Grid.Row="1" Grid.Column="0" Margin="2,3,4,3" CornerRadius="6" BorderThickness="1" Padding="6,4">
                    <Border.Background><SolidColorBrush Color="#40FFFFFF" /></Border.Background>
                    <Border.BorderBrush><SolidColorBrush Color="#50FFCCD5" /></Border.BorderBrush>
                    <Border.Triggers>
                        <EventTrigger RoutedEvent="UIElement.MouseEnter"><BeginStoryboard><Storyboard>
                            <ColorAnimation Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)" To="#EBF3FB" Duration="0:0:0.12" />
                            <ColorAnimation Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)" To="#C6DCF4" Duration="0:0:0.12" />
                        </Storyboard></BeginStoryboard></EventTrigger>
                        <EventTrigger RoutedEvent="UIElement.MouseLeave"><BeginStoryboard><Storyboard>
                            <ColorAnimation Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)" To="#40FFFFFF" Duration="0:0:0.12" />
                            <ColorAnimation Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)" To="#50FFCCD5" Duration="0:0:0.12" />
                        </Storyboard></BeginStoryboard></EventTrigger>
                    </Border.Triggers>
                    <Grid Height="32">
                        <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                        <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                            <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/photo.jpg" />
                        </Border>
                        <StackPanel Grid.Column="1" VerticalAlignment="Center">
                            <TextBlock Text="萌宠相册" FontSize="12" FontWeight="Bold" Foreground="#333333" />
                            <TextBlock Text="打开日常照片存放文件夹" FontSize="10" Foreground="#777777" Margin="0,1,0,0" />
                        </StackPanel>
                        <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                            <local:CustomEventService.Events><local:CustomEventCollection>
                                <local:CustomEvent Type="打开文件" Data="打开相册.exe" />
                            </local:CustomEventCollection></local:CustomEventService.Events>
                        </local:MyTextButton>
                    </Grid>
                </Border>
                <!-- 4. 切换图片 (多图循环切换 1~6 循环) -->
                <Grid Grid.Row="1" Grid.Column="1" Margin="4,3,2,3">
                    <!-- 1/6 -->
                    <Border Visibility="{variable:Photo_0_V:Visible}" CornerRadius="6" BorderThickness="1" Padding="6,4" Background="#40FFFFFF" BorderBrush="#50FFCCD5">
                        <Grid Height="32">
                            <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                            <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                                <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/switch.jpg" />
                            </Border>
                            <StackPanel Grid.Column="1" VerticalAlignment="Center">
                                <TextBlock Text="切换图片" FontSize="12" FontWeight="Bold" Foreground="#333333" />
                                <TextBlock Text="切换下一张日常照片 (1/6)" FontSize="10" Foreground="#777777" Margin="0,1,0,0" />
                            </StackPanel>
                            <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                                <local:CustomEventService.Events><local:CustomEventCollection>
                                    <local:CustomEvent Type="修改变量" Data="Photo_0_V|Collapsed" />
                                    <local:CustomEvent Type="修改变量" Data="Photo_1_V|Visible" />
                                    <local:CustomEvent Type="刷新页面" Data="-" />
                                </local:CustomEventCollection></local:CustomEventService.Events>
                            </local:MyTextButton>
                        </Grid>
                    </Border>
                    <!-- 2/6 -->
                    <Border Visibility="{variable:Photo_1_V:Collapsed}" CornerRadius="6" BorderThickness="1" Padding="6,4" Background="#40FFFFFF" BorderBrush="#50FFCCD5">
                        <Grid Height="32">
                            <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                            <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                                <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/switch.jpg" />
                            </Border>
                            <StackPanel Grid.Column="1" VerticalAlignment="Center">
                                <TextBlock Text="切换图片" FontSize="12" FontWeight="Bold" Foreground="#333333" />
                                <TextBlock Text="切换下一张日常照片 (2/6)" FontSize="10" Foreground="#777777" Margin="0,1,0,0" />
                            </StackPanel>
                            <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                                <local:CustomEventService.Events><local:CustomEventCollection>
                                    <local:CustomEvent Type="修改变量" Data="Photo_1_V|Collapsed" />
                                    <local:CustomEvent Type="修改变量" Data="Photo_2_V|Visible" />
                                    <local:CustomEvent Type="刷新页面" Data="-" />
                                </local:CustomEventCollection></local:CustomEventService.Events>
                            </local:MyTextButton>
                        </Grid>
                    </Border>
                    <!-- 3/6 -->
                    <Border Visibility="{variable:Photo_2_V:Collapsed}" CornerRadius="6" BorderThickness="1" Padding="6,4" Background="#40FFFFFF" BorderBrush="#50FFCCD5">
                        <Grid Height="32">
                            <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                            <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                                <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/switch.jpg" />
                            </Border>
                            <StackPanel Grid.Column="1" VerticalAlignment="Center">
                                <TextBlock Text="切换图片" FontSize="12" FontWeight="Bold" Foreground="#333333" />
                                <TextBlock Text="切换下一张日常照片 (3/6)" FontSize="10" Foreground="#777777" Margin="0,1,0,0" />
                            </StackPanel>
                            <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                                <local:CustomEventService.Events><local:CustomEventCollection>
                                    <local:CustomEvent Type="修改变量" Data="Photo_2_V|Collapsed" />
                                    <local:CustomEvent Type="修改变量" Data="Photo_3_V|Visible" />
                                    <local:CustomEvent Type="刷新页面" Data="-" />
                                </local:CustomEventCollection></local:CustomEventService.Events>
                            </local:MyTextButton>
                        </Grid>
                    </Border>
                    <!-- 4/6 -->
                    <Border Visibility="{variable:Photo_3_V:Collapsed}" CornerRadius="6" BorderThickness="1" Padding="6,4" Background="#40FFFFFF" BorderBrush="#50FFCCD5">
                        <Grid Height="32">
                            <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                            <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                                <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/switch.jpg" />
                            </Border>
                            <StackPanel Grid.Column="1" VerticalAlignment="Center">
                                <TextBlock Text="切换图片" FontSize="12" FontWeight="Bold" Foreground="#333333" />
                                <TextBlock Text="切换下一张日常照片 (4/6)" FontSize="10" Foreground="#777777" Margin="0,1,0,0" />
                            </StackPanel>
                            <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                                <local:CustomEventService.Events><local:CustomEventCollection>
                                    <local:CustomEvent Type="修改变量" Data="Photo_3_V|Collapsed" />
                                    <local:CustomEvent Type="修改变量" Data="Photo_4_V|Visible" />
                                    <local:CustomEvent Type="刷新页面" Data="-" />
                                </local:CustomEventCollection></local:CustomEventService.Events>
                            </local:MyTextButton>
                        </Grid>
                    </Border>
                    <!-- 5/6 -->
                    <Border Visibility="{variable:Photo_4_V:Collapsed}" CornerRadius="6" BorderThickness="1" Padding="6,4" Background="#40FFFFFF" BorderBrush="#50FFCCD5">
                        <Grid Height="32">
                            <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                            <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                                <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/switch.jpg" />
                            </Border>
                            <StackPanel Grid.Column="1" VerticalAlignment="Center">
                                <TextBlock Text="切换图片" FontSize="12" FontWeight="Bold" Foreground="#333333" />
                                <TextBlock Text="切换下一张日常照片 (5/6)" FontSize="10" Foreground="#777777" Margin="0,1,0,0" />
                            </StackPanel>
                            <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                                <local:CustomEventService.Events><local:CustomEventCollection>
                                    <local:CustomEvent Type="修改变量" Data="Photo_4_V|Collapsed" />
                                    <local:CustomEvent Type="修改变量" Data="Photo_5_V|Visible" />
                                    <local:CustomEvent Type="刷新页面" Data="-" />
                                </local:CustomEventCollection></local:CustomEventService.Events>
                            </local:MyTextButton>
                        </Grid>
                    </Border>
                    <!-- 6/6 (切回第一张) -->
                    <Border Visibility="{variable:Photo_5_V:Collapsed}" CornerRadius="6" BorderThickness="1" Padding="6,4" Background="#40FFFFFF" BorderBrush="#50FFCCD5">
                        <Grid Height="32">
                            <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                            <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                                <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/switch.jpg" />
                            </Border>
                            <StackPanel Grid.Column="1" VerticalAlignment="Center">
                                <TextBlock Text="切换图片" FontSize="12" FontWeight="Bold" Foreground="#333333" />
                                <TextBlock Text="切换下一张日常照片 (6/6)" FontSize="10" Foreground="#777777" Margin="0,1,0,0" />
                            </StackPanel>
                            <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                                <local:CustomEventService.Events><local:CustomEventCollection>
                                    <local:CustomEvent Type="修改变量" Data="Photo_5_V|Collapsed" />
                                    <local:CustomEvent Type="修改变量" Data="Photo_0_V|Visible" />
                                    <local:CustomEvent Type="刷新页面" Data="-" />
                                </local:CustomEventCollection></local:CustomEventService.Events>
                            </local:MyTextButton>
                        </Grid>
                    </Border>
                </Grid>
                <!-- 5. 一键同步 (一键刷新主页并同步最新打卡与本地相册) -->
                <Border Grid.Row="2" Grid.Column="0" Grid.ColumnSpan="2" Margin="2,4,2,2" CornerRadius="6" BorderThickness="1" Padding="6,4">
                    <Border.Background><SolidColorBrush Color="#55FFEBEE" /></Border.Background>
                    <Border.BorderBrush><SolidColorBrush Color="#60F48FB1" /></Border.BorderBrush>
                    <Border.Triggers>
                        <EventTrigger RoutedEvent="UIElement.MouseEnter"><BeginStoryboard><Storyboard>
                            <ColorAnimation Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)" To="#EBF3FB" Duration="0:0:0.12" />
                            <ColorAnimation Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)" To="#C6DCF4" Duration="0:0:0.12" />
                        </Storyboard></BeginStoryboard></EventTrigger>
                        <EventTrigger RoutedEvent="UIElement.MouseLeave"><BeginStoryboard><Storyboard>
                            <ColorAnimation Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)" To="#55FFEBEE" Duration="0:0:0.12" />
                            <ColorAnimation Storyboard.TargetProperty="(Border.BorderBrush).(SolidColorBrush.Color)" To="#60F48FB1" Duration="0:0:0.12" />
                        </Storyboard></BeginStoryboard></EventTrigger>
                    </Border.Triggers>
                    <Grid Height="32">
                        <Grid.ColumnDefinitions><ColumnDefinition Width="Auto" /><ColumnDefinition Width="*" /></Grid.ColumnDefinitions>
                        <Border Grid.Column="0" Width="28" Height="28" CornerRadius="4" Margin="0,0,8,0" ClipToBounds="True" VerticalAlignment="Center">
                            <local:MyImage Width="28" Height="28" Stretch="UniformToFill" Source="PCL/Assets/update.jpg" />
                        </Border>
                        <StackPanel Grid.Column="1" VerticalAlignment="Center">
                            <TextBlock Text="一键同步" FontSize="12" FontWeight="Bold" Foreground="#D81B60" />
                            <TextBlock Text="刷新并同步云端打卡数据与本地相册" FontSize="10" Foreground="#888888" Margin="0,1,0,0" />
                        </StackPanel>
                        <local:MyTextButton Grid.ColumnSpan="2" Height="32" Padding="0" Margin="0" Text=" " Foreground="Transparent" HorizontalAlignment="Stretch" VerticalAlignment="Stretch">
                            <local:CustomEventService.Events><local:CustomEventCollection>
                                <local:CustomEvent Type="刷新页面" Data="-" />
                            </local:CustomEventCollection></local:CustomEventService.Events>
                        </local:MyTextButton>
                    </Grid>
                </Border>
            </Grid>
        </Border>
    </StackPanel>`;

  // 11. 组装完整 XAML 并注入心跳节点至根 StackPanel 尾部
  const fullXaml = headPart + calXaml + tailPart + '\n' + heartbeatBlock + '</StackPanel>\n';

  res.status(200).send(fullXaml);
};
