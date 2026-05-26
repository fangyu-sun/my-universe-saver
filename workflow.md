# 项目开发与工作规范 / Project Development and Working Specifications

为确保 MyUniverse 屏保项目开发过程的高效性、代码可追溯性以及版本管理的规范性，特制定以下开发规范：
To ensure the efficiency of the project development process, code traceability, and standardized version control, the following development specifications are established:

---

## 1. Git 提交与模块开发规范 / Git Commit and Module Development Guidelines

### 1.1 模块化自动提交 / Modular Automatic Commit
* **中文**：每当**完成一个功能模块**且**测试通过（编译成功且功能运行正常）**后，自动执行 `git add` 和 `git commit`。严禁将多个不同功能模块的大量变更堆积到单次提交中，以确保每次提交的原子性。
* **English**: Whenever a **functional module is completed** and **passes testing (successful compilation and normal functional operation)**, automatically execute `git add` and `git commit`. Stacking large numbers of changes from multiple different functional modules into a single commit is strictly prohibited to ensure the atomicity of each commit.

### 1.2 提交信息要求 / Commit Message Requirements
* **中文**：提交信息（Commit Message）必须简要、清晰地描述本次提交的具体内容和修改范围。
* **English**: The commit message must briefly and clearly describe the specific content and scope of modifications in the current commit.

#### 格式规范示例 / Format Examples:
* `feat(bridge): 完善 WKWebView 与 Swift 原生层的 JSON 配置双向注入 / feat(bridge): Perfect JSON config injection between WKWebView and Swift`
* `fix(ui): 修复多语言切换时主叙事文案溢出屏幕的问题 / fix(ui): Fix main narrative overflow issue during multi-language switch`
* `docs(workflow): 新增项目 Git 提交与自动模块化开发工作规范 / docs(workflow): Add bilingual project Git commit and modular development guidelines`

---

## 2. 产品设计哲学与体验规范 / Product Philosophy & Experience Standards

### 2.1 核心心智：冷峻深空与孤独冥想 (Core Mentality: Cold Deep Space & Solitary Meditation)
* **中文**：本应用不是冷冰冰的天文数据工具，而是一个在孤独时刻提供慰藉的“深空陪伴者”。产品采取极简冷峻的科幻美学，去除了所有多余的UI元素，以纯黑背景、细体文字，营造出一种凝视深空的孤独感与冥想感。将冰冷的物理距离与诗意般的排版文字交替推送到屏幕正中央，让观察者在数字屏幕上体验宇宙光阴流逝的真实感。
* **English**: This application is not a cold astronomical data tool, but a "deep space companion" that provides solace in lonely moments. Adopting a minimalist, cold sci-fi aesthetic, the app removes all redundant UI elements. Using a pure black background and thin typography, it creates a sense of solitude and meditation while gazing into deep space.

### 2.2 绝对零交互与离线优先 (Absolute Zero-Interaction & Offline First)
* **中文**：作为原生 macOS 屏保，主程序启动后 **第 0.1 秒必须直接进入展示界面**。严禁出现任何引导页、网络请求等待、授权弹窗或“开启连接”按钮。所有设置（城市、语言、频率等）必须在 macOS 的 Screen Saver Options 面板中纯离线闭环完成。
* **English**: As a native macOS screen saver, the main program must enter the display interface directly within 0.1 seconds of startup. Onboarding pages, network request waits, authorization pop-ups, or interaction buttons are strictly prohibited. All settings must be completed offline in the Options panel.

### 2.3 交互准则：60° 穹顶雷达与至暗时刻咬合 (Interaction: 60° Dome Radar & Darkest Moment Sync)
* **中文**：天文阈值设定为广袤的 60° 穹顶。UI 动效必须严格遵守在 Options 中设定的慢速生命呼吸节奏（由 Frequency 选项控制）。并且，所有叙事文字的更替，必须在程序底层监听 CSS 的 `animationiteration` 动画迭代事件，强制与呼吸动画的**至暗时刻（Opacity: 0）完美咬合**，实现视觉与心理的极致冥想同步。
* **English**: The astronomical threshold is set to a vast 60° dome. UI animations must strictly adhere to the slow life-breathing cycle set in Options (controlled by the Frequency setting). The swapping of narrative text must perfectly mesh with the darkest moment of the animation (Opacity: 0) by strictly listening to the CSS `animationiteration` event, achieving ultimate meditative synchronization.
