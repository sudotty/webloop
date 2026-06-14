<div align="center">

<img src="docs/assets/hero.svg" alt="WebLoop —— 录制一次，永久自动化。无代码、本地优先的浏览器自动化工具。" width="100%" />

# WebLoop —— 无代码、本地优先的浏览器自动化

**把重复的浏览器操作录制一次，随时回放或定时执行。**
面向遗留 ERP、CRM、OA 系统、内网和报表门户的轻量级 RPA 替代方案 —— 无需写代码、无需上云、不依赖大模型。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0-success.svg)](CHANGELOG.md)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg)](manifest.json)
[![Built with React + TS](https://img.shields.io/badge/built%20with-React%20%2B%20TypeScript-3178C6.svg)](#-技术与架构)
[![Local-first](https://img.shields.io/badge/privacy-local--first-07824a.svg)](docs/PERMISSIONS.md)
[![Roadmap](https://img.shields.io/badge/status-active%20roadmap-orange.svg)](ROADMAP.md)

[English](./README.md) · **简体中文** · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md)

</div>

---

## 😩 痛点

大多数企业内部系统 —— ERP、CRM、OA、内网、报表门户 —— **都没有 API**。
于是人就成了那个“API”：每天早上有人打开同一个页面，选好昨天的日期，套用同样的筛选条件，
点击“查询”，等那张很慢的表加载，再点“导出”，最后把文件发邮件出去。日复一日。

重型 RPA 套件（UiPath、Power Automate）价格高、需要培训、还要装客户端。
纯粹的“AI 智能体”会胡乱操作，无法保证确定性。要求“读取你所有网站数据”的云端录制工具，
则会被信息安全部门直接拒绝。

## 💡 解决方案

> **WebLoop 把浏览器 DOM 当作 API。** 只要你能点得到，就能自动化。

这是一个轻量级的 Chrome 扩展，**把你真实的点击录制一次**，然后确定性地回放 ——
按需触发或定时执行，全程**在你自己的电脑上运行**。

<div align="center">
<img src="docs/assets/screens.svg" alt="WebLoop 侧边栏：录制工作流的步骤，以及按站点授权的权限面板。" width="100%" />
<sub><i>WebLoop 侧边栏示意图（录制流程，以及按站点授权的权限面板）。</i></sub>
</div>

---

## ✨ 现已可用的功能

| | 功能 | 说明 |
| :-- | :--- | :--- |
| ✅ | **无代码录制** | 捕获点击、输入、下拉选择、悬浮、双击、勾选、下载等操作。 |
| ✅ | **确定性回放** | 多重定位（CSS、XPath、稳定文本、aria-label）+ 置信度评分 —— 不靠会“幻觉”的智能体。 |
| ✅ | **动态日期变量** | `{{today}}`、`{{yesterday}}`、`{{month_start}}`、`{{date:-7}}` —— 报表始终查询正确的时间区间。 |
| ✅ | **可靠性步骤** | 等待文字／元素／页面稳定；自动整理流程；静态流程检查，提示常见隐患。 |
| ✅ | **定时调度** | 手动、每天、工作日，或每隔 N 分钟。 |
| ✅ | **截图与通知** | 成功、失败，或需要人工介入（2FA／验证码／审批）时提醒你。 |
| ✅ | **本地优先、隐私安全** | 任务、日志、设置都留在浏览器本地。可导出／导入 JSON 备份。 |
| ✅ | **按站点的权限面板** | 逐个站点查看、授权与撤销主机访问权限。 |
| ✅ | **可选的 AI** | 可接入 OpenAI／Anthropic／Gemini／DeepSeek／Ollama／Groq —— 默认关闭，仅作辅助建议。 |

➡️ 查看完整 **[路线图](ROADMAP.md)**，了解已发布与计划中的功能（可靠性适配器、断点续跑、AI 修复、团队同步）。

---

## 🆚 WebLoop 对比重型 RPA

| | WebLoop | 传统 RPA |
| :--- | :--- | :--- |
| **体量** | Chrome 扩展 | 客户端安装／虚拟机 |
| **学习成本** | 点一遍即录制 | 需培训与认证 |
| **价格** | 免费开源（MIT） | 高昂的授权费用 |
| **隐私** | 本地优先、按站点授权 | 多为云端／广泛权限 |
| **网页兼容性** | 专为复杂的企业 DOM 而生 | 在 Web 应用上易崩 |
| **AI** | 可选，核心确定性 | 后期硬加 |

---

## 📖 工作原理

1. **录制** —— 打开目标页面，在侧边栏点击“开始录制”，把任务真实操作一遍。
2. **完善** —— 添加等待步骤、把日期变量化，让流程检查帮你标出薄弱环节。
3. **测试** —— 运行一次（或从任意步骤开始），查看逐步日志。
4. **定时并放手** —— 选择“每天／工作日／周期”；WebLoop 在后台运行并通知你。

完整教程见 **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**。

---

## 🛠 安装

WebLoop 的侧边栏是用 Vite 构建的 React + TypeScript 应用。构建一次，然后加载生成的 `dist/` 目录。

```bash
npm install
npm run build      # 类型检查、构建侧边栏并组装 dist/
```

1. 打开 `chrome://extensions/`
2. 启用 **开发者模式**
3. 点击 **加载已解压的扩展程序** → 选择生成的 **`dist/`** 目录

> 确定性核心（`service_worker.js`、`content_script.js`）是纯 JavaScript，会被**原样**复制到 `dist/` —— 仅 UI 经过打包。

### 🧑‍💻 开发

```bash
npm run dev        # Vite 开发服务器
npm run typecheck  # tsc --noEmit
npm run build      # 生产构建 → dist/
npm run package    # 构建并打包成可上架的压缩包
```

---

## 🔐 权限与隐私

WebLoop 采用**本地优先**设计，绝不预先索取“读取你所有网站数据”这类宽泛权限。
它**逐个站点**请求授权，且只在你于该站点录制或运行时请求，每一次授权都可在应用内的
**权限**标签页随时撤销。每一项基础权限都在 **[docs/PERMISSIONS.md](docs/PERMISSIONS.md)** 中逐条说明。

---

## 🧱 技术与架构

- **侧边栏：** React 18 + TypeScript，由 Vite 打包。
- **自动化核心：** 依赖极少的纯 JavaScript Chrome **Manifest V3** Service Worker + 内容脚本，原样复制进 `dist/` 以便审计。
- **存储：** `chrome.storage.local` —— 没有后端，没有遥测。

详情见 **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · 参与贡献见 **[CONTRIBUTING.md](CONTRIBUTING.md)**。

---

## ❓ 常见问题（同时面向 AI 搜索 / GEO）

**WebLoop 是什么？**
WebLoop 是一个免费、开源、**无代码的浏览器自动化** Chrome 扩展，能录制并回放重复的网页工作流 ——
填表、筛选、点击、下载文件、截图与通知 —— 是面向企业与遗留 Web 应用的**轻量级、本地优先 RPA** 替代方案。

**需要 API 或大模型吗？**
不需要。核心的录制—回放流程完全确定性，纯本地运行，无需任何 API 或大模型。AI 辅助为可选且仅作建议。

**我的数据会被发送到哪里吗？**
默认情况下，任何数据都不会离开你的浏览器。只有当你主动启用可选的 AI 助手时，
才会把脱敏后的片段发送到**你自己配置**的服务商。

**它和 UiPath / Power Automate / Automa / Bardeen 有何不同？**
WebLoop 刻意保持小而专注：本地优先、确定性、按站点授权，并为复杂的企业页面提供一流的可观测性 ——
而不是一个完整的 RPA 开发平台。

**支持哪些站点？**
任何你授权的 `http(s)` 页面 —— ERP/OA/CRM 系统、内网、报表门户，以及其他没有可用 API 的 Web 应用。

---

## 🔍 关键词

无代码浏览器自动化 · Chrome 工作流录制 · 轻量级 RPA 扩展 · 网页自动化工具 · 自动填表 ·
定时浏览器自动化 · Excel/CSV/PDF 下载自动化 · 内网与 ERP 自动化 · 遗留 Web 应用自动化 ·
本地优先浏览器代理 · 录制回放网页任务。

---

## 📄 许可证

[MIT](LICENSE) —— 为现代实务工作者而造，以简单驱动。
