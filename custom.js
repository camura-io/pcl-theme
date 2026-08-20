module.exports = async (req, res) => {
  // 1. 设置跨域与纯文本响应头
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // 2. 动态真实时间与纪念日计算 (UTC+8 北京时间)
  const now = new Date(Date.now() + 8 * 3600 * 1000)
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const currentDay = now.getUTCDate()
  const todayKey = `${year}-${String(month).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`

  // 💖 恋爱纪念日起始日 (可自定义修改: 年, 月-1, 日)
  const startDate = new Date(Date.UTC(2023, 4, 20)) // 示例: 2023-05-20
  const diffTime = Math.abs(now.getTime() - startDate.getTime())
  const loveDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const dateStr = `${year}年${month}月${currentDay}日`

  // 3. 计算当月天数与 1 号星期几
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const firstDayWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const startCol = (firstDayWeek + 6) % 7 // 转换为周一为第 0 列

  // GitCode 图片公网直链
  const rawBase = "https://gitcode.com/api/v5/repos/weixin_49353132/pcl-theme/raw/"
  const refQuery = "?ref=main"

  // 4. 动态生成当月日历 (今日高亮打卡，历史爱心)
  let daysGridXaml = ""
  let dayCounter = 1

  for (let cell = 0; cell < 42; cell++) {
    if (cell >= startCol && dayCounter <= daysInMonth) {
      const r = Math.floor(cell / 7)
      const c = cell % 7
      const day = dayCounter

      if (day === currentDay) {
        // 今日 (高亮金色边框 + 爱心)
        daysGridXaml += `
                        <Border Grid.Row="${r}" Grid.Column="${c}" Height="22" Margin="1" Background="#FFFF1744" BorderBrush="#FFFFD700" BorderThickness="1.5" CornerRadius="4">
                            <TextBlock Text="✨${day}" FontSize="10" FontWeight="Bold" Foreground="White" HorizontalAlignment="Center" VerticalAlignment="Center" />
                        </Border>`
      } else if (day < currentDay) {
        // 历史打卡 (粉色爱心)
        daysGridXaml += `
                        <Border Grid.Row="${r}" Grid.Column="${c}" Height="22" Margin="1" Background="#FFFF4081" BorderBrush="#FFE91E63" BorderThickness="1" CornerRadius="4">
                            <TextBlock Text="💖" FontSize="10" Foreground="White" HorizontalAlignment="Center" VerticalAlignment="Center" />
                        </Border>`
      } else {
        // 未来日期 (半透明待打卡)
        daysGridXaml += `
                        <Border Grid.Row="${r}" Grid.Column="${c}" Height="22" Margin="1" Background="#30FFFFFF" BorderBrush="#30FFCCD5" BorderThickness="1" CornerRadius="4">
                            <TextBlock Text="${day}" FontSize="10" Foreground="#666666" HorizontalAlignment="Center" VerticalAlignment="Center" />
                        </Border>`
      }
      dayCounter++
    }
  }

  // 5. 逐分高精度计时器帧 (180 分钟连续逐分跳动)
  let timerFrames = ""
  for (let min = 1; min <= 180; min++) {
    const hr = Math.floor(min / 60)
    const remMin = min % 60
    const timeStr = (hr === 0) ? `${min} 分钟` : (remMin === 0 ? `${hr} 小时` : `${hr} 小时 ${remMin} 分钟`)
    timerFrames += `\n                                    <DiscreteStringKeyFrame Value="⏳ 本次已陪伴: ${timeStr}" KeyTime="${hr}:${remMin}:0" />`
  }

  // 6. 组装极速轻量 XAML 字符串 (约 35KB)
  const xaml = `<StackPanel xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
            xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
            xmlns:local="clr-namespace:PCL;assembly=PCL"
            Margin="15,8,15,10">

    <!-- ================= 第一行：首屏萌宠与真实打卡日历 ================= -->
    <Grid Margin="0,0,0,10">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="1.1*" />
            <ColumnDefinition Width="1.0*" />
        </Grid.ColumnDefinitions>

        <!-- 左列：🐾 萌宠日常 (全套漫游桌宠与抓取生气交互) -->
        <Grid Grid.Column="0" Margin="0,0,6,6">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto" />
                <RowDefinition Height="*" />
            </Grid.RowDefinitions>
            <TextBlock Grid.Row="0" Text="🐾 萌宠日常" FontSize="13" FontWeight="Bold" Foreground="#D81B60" Margin="4,0,0,4" />
            <Border Grid.Row="1" CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="6">
                <Border CornerRadius="8" Background="#40FFFFFF" BorderBrush="#50FFCCD5" BorderThickness="1" ClipToBounds="True">
                    <Grid Height="210">
                        <Canvas>
                            <Grid x:Name="PetContainer" Canvas.Left="20" Canvas.Top="130" Width="55" Height="46">
                                <local:MyImage x:Name="NormalPet" Width="55" Height="46" Stretch="Uniform" Source="${rawBase}pet.png${refQuery}" Opacity="1" />
                                <local:MyImage x:Name="AngryPet" Width="55" Height="46" Stretch="Uniform" Source="${rawBase}pet_angry.png${refQuery}" Opacity="0" />
                            </Grid>
                        </Canvas>
                    </Grid>
                </Border>
            </Border>
        </Grid>

        <!-- 右列：📅 动态打卡日历 (当月自动高亮，仅 30 个格子，0 延迟秒开) -->
        <Grid Grid.Column="1" Margin="6,0,0,6">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto" />
                <RowDefinition Height="*" />
            </Grid.RowDefinitions>
            <TextBlock Grid.Row="0" Text="📅 冒险打卡 · 自动同步" FontSize="13" FontWeight="Bold" Foreground="#D81B60" Margin="4,0,0,4" />
            <Border Grid.Row="1" CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="8,6">
                <StackPanel>
                    <!-- 月份标题与自动签到状态 -->
                    <Grid Margin="0,2,0,6">
                        <Grid.ColumnDefinitions><ColumnDefinition Width="*" /><ColumnDefinition Width="Auto" /></Grid.ColumnDefinitions>
                        <TextBlock Grid.Column="0" Text="🌸 ${year} 年 ${month} 月" FontSize="12" Foreground="#D81B60" FontWeight="Bold" VerticalAlignment="Center" />
                        <Border Grid.Column="1" Background="#304CAF50" BorderBrush="#604CAF50" BorderThickness="1" CornerRadius="4" Padding="5,1">
                            <TextBlock Text="✔ 今日已开机签到" FontSize="9.5" Foreground="#2E7D32" FontWeight="Bold" />
                        </Border>
                    </Grid>

                    <!-- 星期表头 -->
                    <Grid Margin="0,0,0,3">
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" />
                        </Grid.ColumnDefinitions>
                        <TextBlock Grid.Column="0" Text="一" FontSize="9.5" Foreground="#888888" FontWeight="Bold" HorizontalAlignment="Center" />
                        <TextBlock Grid.Column="1" Text="二" FontSize="9.5" Foreground="#888888" FontWeight="Bold" HorizontalAlignment="Center" />
                        <TextBlock Grid.Column="2" Text="三" FontSize="9.5" Foreground="#888888" FontWeight="Bold" HorizontalAlignment="Center" />
                        <TextBlock Grid.Column="3" Text="四" FontSize="9.5" Foreground="#888888" FontWeight="Bold" HorizontalAlignment="Center" />
                        <TextBlock Grid.Column="4" Text="五" FontSize="9.5" Foreground="#888888" FontWeight="Bold" HorizontalAlignment="Center" />
                        <TextBlock Grid.Column="5" Text="六" FontSize="9.5" Foreground="#E91E63" FontWeight="Bold" HorizontalAlignment="Center" />
                        <TextBlock Grid.Column="6" Text="日" FontSize="9.5" Foreground="#E91E63" FontWeight="Bold" HorizontalAlignment="Center" />
                    </Grid>

                    <!-- 动态日期网格 -->
                    <Grid Margin="0,1,0,3">
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" /><ColumnDefinition Width="*" />
                        </Grid.ColumnDefinitions>
                        <Grid.RowDefinitions>
                            <RowDefinition Height="Auto" /><RowDefinition Height="Auto" /><RowDefinition Height="Auto" /><RowDefinition Height="Auto" /><RowDefinition Height="Auto" /><RowDefinition Height="Auto" />
                        </Grid.RowDefinitions>
                        ${daysGridXaml}
                    </Grid>

                    <!-- 统计数据 -->
                    <Border Background="#40FFFFFF" CornerRadius="4" Padding="6,3" Margin="0,2,0,0">
                        <TextBlock Text="🌟 本月打卡: ${currentDay} 天 | 今日已连线 💖" FontSize="9.5" Foreground="#C2185B" FontWeight="Bold" HorizontalAlignment="Center" />
                    </Border>
                </StackPanel>
            </Border>
        </Grid>
    </Grid>

    <!-- ================= 第二行：常用资源 ================= -->
    <Grid Margin="0,0,0,8">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="*" />
            <ColumnDefinition Width="*" />
        </Grid.ColumnDefinitions>
        <Border Grid.Column="0" Margin="0,0,4,0" CornerRadius="8" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="8,4">
            <local:MyListItem Margin="-5,1,-5,1" Type="Clickable"
                              Logo="${rawBase}MC.jpg${refQuery}"
                              Title="MCMOD 百科" Info="最大的 Minecraft 中文 MOD 百科"
                              EventType="打开网页" EventData="https://www.mcmod.cn/" />
        </Border>
        <Border Grid.Column="1" Margin="4,0,0,0" CornerRadius="8" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="8,4">
            <local:MyListItem Margin="-5,1,-5,1" Type="Clickable"
                              Logo="${rawBase}photo.jpg${refQuery}"
                              Title="LittleSkin 皮肤站" Info="快速、可靠的 Minecraft 皮肤站"
                              EventType="打开网页" EventData="https://littleskin.cn/?LANG=ZH_CN&amp;lang=zh_CN" />
        </Border>
    </Grid>

    <!-- ================= 第三行：💖 专属浪漫签名与动态伴玩悄悄话 ================= -->
    <StackPanel Margin="0,2,0,8">
        <Border CornerRadius="10" Background="#75FFF0F5" BorderBrush="#60F8BBD0" BorderThickness="1.5" Padding="12,8">
            <StackPanel>
                <!-- 顶部真实相恋天数与逐分计时器 -->
                <Grid Margin="0,0,0,4">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*" />
                        <ColumnDefinition Width="Auto" />
                    </Grid.ColumnDefinitions>
                    <TextBlock Grid.Column="0" Text="💖 和宝贝相恋的第 ${loveDays} 天 · ${dateStr}" FontSize="12" FontWeight="Bold" Foreground="#D81B60" VerticalAlignment="Center" />
                    <Border Grid.Column="1" Background="#50FCE4EC" BorderBrush="#50FF80AB" BorderThickness="1" CornerRadius="4" Padding="6,1">
                        <TextBlock Text="⏳ 本次已陪伴: 0 分钟" FontSize="10" Foreground="#C2185B" FontWeight="Bold">
                            <TextBlock.Triggers>
                                <EventTrigger RoutedEvent="FrameworkElement.Loaded">
                                    <BeginStoryboard>
                                        <Storyboard>
                                            <StringAnimationUsingKeyFrames Storyboard.TargetProperty="Text">
                                                ${timerFrames}
                                            </StringAnimationUsingKeyFrames>
                                        </Storyboard>
                                    </BeginStoryboard>
                                </EventTrigger>
                            </TextBlock.Triggers>
                        </TextBlock>
                    </Border>
                </Grid>

                <!-- 悄悄话信笺展示区 (9 秒呼吸式淡入淡出轮播) -->
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
                                        <Storyboard>
                                            <StringAnimationUsingKeyFrames Storyboard.TargetProperty="Text">
                                                <DiscreteStringKeyFrame Value="无论在方块世界走多远，我永远是你最坚固的避难所与指路火把 🕯️💖" KeyTime="0:0:0" />
                                                <DiscreteStringKeyFrame Value="今天也想陪你一起去下矿挖钻石、看一场方块日落、盖属于我们的大城堡~ 🏰🌸" KeyTime="0:0:9" />
                                                <DiscreteStringKeyFrame Value="遇到苦力怕别害怕，我拿着盾牌和不死图腾挡在你的前面！🛡️✨" KeyTime="0:0:18" />
                                                <DiscreteStringKeyFrame Value="在主世界所有的生物群系与风景里，你就是我最心动的一朵专属樱花 🌸💍" KeyTime="0:0:27" />
                                                <DiscreteStringKeyFrame Value="愿你的每一次冒险都有幸运附魔，现实里的每一天都被满满的爱包围~ ( ˶˘ ³˘)♥" KeyTime="0:0:36" />
                                                <DiscreteStringKeyFrame Value="今天也是元气满满的一天，记得多喝水、保持好心情哦~ 🌸✨" KeyTime="0:0:45" />
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
</StackPanel>`

  res.status(200).send(xaml)
}
