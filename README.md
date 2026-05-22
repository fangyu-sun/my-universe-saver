# 🌌 My Universe Saver / 宇宙天顶播报器屏保

<p align="center">
  <strong>一款唯美、深邃且实时的宇宙呼吸雷达 macOS 屏幕保护程序与 Web 应用。通过物理轨道推算，在一个 60° 穹顶下循环为您播报正陪伴您的那颗星星。即使孤独，至少有一颗星星陪着你。</strong><br>
  <em>A beautiful, deep, and real-time cosmic breathing radar macOS screensaver and web app. It cycles through celestial bodies in a 60° dome above you, proving that even in solitude, at least one star keeps you company.</em>
</p>

---

## ✨ 核心亮点 / Key Features

### 1. 🖥️ macOS 原生屏幕保护程序体验
* **纯本地断网可用**：应用集成了 15 万+ 全球城市的离线地理坐标数据库 (`cities.json`)，支持在 macOS 系统设置的“屏幕保护程序选项”中直接搜索并设置您的常驻城市，**完全不依赖系统定位权限与外部网络请求**。
* **秒级无感启动**：基于 WKWebView 注入 `WKUserScript` 技术，实现配置参数无缝穿透。屏保触发瞬间，直接越过所有的授权与介绍页面，0 延迟展现浩瀚星空。
* **自动化打包与部署**：提供 `./deploy.sh` 一键构建脚本，自动完成前端 Vite 编译、Swift 原生编译、资源合并、签名提权与系统缓存刷新，实现极速迭代。

### 2. 🚀 人造卫星与天体实时轨推算
* **SGP4 轨道模型**：引入經典的 `satellite.js` 物理轨道库，结合 TLE 两行轨道要素，实时解算出人造卫星在您顶心坐标系（Topocentric）的高度角、方位角与斜距（Range）。
* **八大行星与 2800 颗亮星**：集成视星等 5.5 以内的 HYG 亮星星表以及八大行星轨道计算。系统不仅能捕捉微弱的暗星，甚至可能告诉您，此时木星或火星恰好位于您的夜空最高点。
* **动态 TLE 拉取 + 离线容灾**：(Web模式下) 启动时自动拉取最热门卫星与最新星链数据；若网络不可用，自动降级至内置经典空间站和哈勃太空望远镜的离线轨道要素。

### 3. 🌌 60° 穹顶雷达与深空陪伴
* **60° 广袤穹顶与 8秒呼吸轮播**：我们将观测阈值设定为高度角 $\ge 60^\circ$。符合条件的行星、航天器或恒星将被收入穹顶雷达池中。每隔 8 秒，系统会以极具生命力的慢速呼吸动效，在您眼前循环更替这一刻头顶星空的守望者。
* **诗意宇宙解说**：为不同天体定制的沉浸式多语言解说词（支持中/英/日）。通过诸如 *“此刻，一颗 517.7 光年外的恒星，正高悬于你的天顶。”* 等语句，建立起属于你与宇宙的私人浪漫。
* **高精度自转时针**：高度角与天顶偏离角的计算精度精确至小数点后三位 (`.toFixed(3)`)，肉眼可见地球自转带来的小数点匀速跳动。

---

## 📂 项目结构映射 / Project Directory Map

本仓库采用 Monorepo 范式，融合了 Web 前端与 macOS 原生插件开发环境：

* **前端核心 (Web/JS)**:
  * [`index.html`](./index.html) - 简约高级感的暗色系单页应用容器（包含 `#fallback` 与 `#broadcaster` 视图）。
  * [`style.css`](./style.css) - 精美极简主义设计，包含夜空粒子与呼吸动画。
  * [`src/main.js`](./src/main.js) - 控制前端生命周期、解析 macOS 注入的参数字典，并负责视图调度。
  * [`src/astronomy.js`](./src/astronomy.js) - 融合行星、恒星（HYG库）与人造卫星的权重计算引擎。
  * [`src/copywriter.js`](./src/copywriter.js) - 沉浸式多语言文案生成器。
* **macOS 屏保壳层 (Swift)**:
  * [`Sources/MyUniverseView.swift`](./Sources/MyUniverseView.swift) - 继承自 `ScreenSaverView`，内嵌 `WKWebView` 并在加载前通过 UserScript 注入本地选项参数。
  * [`Sources/ConfigureSheetController.swift`](./Sources/ConfigureSheetController.swift) - 控制 macOS 原生的选项设置面板（Options），包含 `NSComboBox` 离线城市搜索框。
  * [`cities.json`](./cities.json) - 由脚本提炼的全球 15万+ 城市离线数据库，用于 Options 中的本地检索。
* **工程化**:
  * [`deploy.sh`](./deploy.sh) - 一键自动编译、合成 Universal Binary 并在本地安装测试的 Shell 脚本。
  * [`project.yml`](./project.yml) - XcodeGen 配置，用于定义 macOS Bundle Target。

---

## 🛠️ 安装与开发构建 / Installation & Development

### 1. 安装开发环境依赖
请确保系统已安装 **Node.js** 和 **Xcode Command Line Tools** (或完整 Xcode)，以及用于生成 Xcode 工程的 `xcodegen`。
```bash
# 安装前端依赖
npm install

# 如果需要手动生成 Xcode 工程结构 (调试 Swift)
xcodegen generate
```

### 2. 纯前端 Web 开发调试
如果您只想调试星空算法与 Web UI：
```bash
npm run dev
```
启动后在浏览器中打开，Web 端将采用默认的 Geolocation 获取授权并运行（可通过 `/?mode=screensaver` 测试屏保视图）。

### 3. 一键编译并安装 macOS 屏幕保护程序
本仓库提供了一体化的部署脚本，它会自动执行前端打包（Vite）、Swift 编译构建并自动将最终资源放进系统目录。
```bash
chmod +x deploy.sh
./deploy.sh
```
部署完成后：
1. 打开 macOS 的 **系统设置 (System Settings)** -> **屏幕保护程序 (Screen Saver)**。
2. 找到并选中 **MyUniverse**。
3. 点击 **选项 (Options)**，在弹出的搜索框中输入您所在的城市（如 `Shanghai`, `Tokyo`）并保存。
4. 点击预览，享受星空。

---

## 🌟 工作规范说明 / Version Control Guidelines
本仓库严格遵守代码工作范式，`deploy.sh` 在成功构建后会自动触发 `git commit`，保持持续迭代原子性。对于重大架构变动，需提交独立的 Commit。
