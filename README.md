<h1 align="center">XK Alpha // 多智能体工作台</h1>

<div align="center">
  <p><strong>面向自治智能体集群的下一代编排环境</strong></p>
</div>

<hr />

## 🪐 概述

**XK Alpha** 是一个高级的多智能体协作集成开发环境（IDE）和可视化工作台。它专为观察、管理和干预复杂的大语言模型（LLM）驱动的工作流而设计，通过动态有向无环图（DAG）结构化任务，同时通过主动反思和记忆机制来保持迭代智能。

与标准的黑盒聊天界面不同，XK Alpha 提供了一个真正的“透明盒子”，让使用者可以直接观察和干涉各个专业智能体的内部思维与执行过程。

## ✨ 核心能力

- **🧬 专属智能体集群**：六个拥有独立定位的 AI 智能体协同工作：
  - **Master Nexus (主控枢纽)**：编排任务队列和宏观项目状态。
  - **Creative Studio (创意工作室)**：构思用户体验和交互对话。
  - **Design Core (设计核心)**：制定架构模式和组件系统。
  - **Dev Node (开发节点)**：编写清晰、模块化的可执行代码。
  - **Reflect Sub-System (反思子系统)**：审计执行轨迹并收敛代码退化。
  - **Data Recorder (数据记录器)**：将交互特征汇总到持久化的 `Core_Experience_Memory.md` 经验库中。
- **🕸️ 动态 DAG 执行**：可视化展现并行机制和任务依赖的执行进度。
- **⚡ 模型提供商解耦**：原生内置支持 **OpenAI** (gpt-4o, o1)、**Google Gemini** (2.5-flash, 2.0-pro)、**Anthropic** (claude-3-5-sonnet) 和 **DeepSeek**。 另外完全支持使用自定义的 API 端点接入任何其他模型。
- **🗃️ 虚拟资源管理器**：内置模拟工作区，支持拖拽读入文件、带上下文的文件修改和状态持久化功能。
- **🌙 赛博深色美学**：极具质感、灵感源于终端黑客界面的 UI 设计。在深灰炭配色背景之上使用动态的 `emerald-500`（翡翠绿）作为强调点亮，将视觉疲劳降到最低并最大化信息及数据密度。

## 🚀 快速开始

几分钟内即可在本地启动您自己的智能体集群。

### 环境要求
- Node.js (v18 及以上版本)
- 准备好您首选大模型提供商的 API 密钥 (如 Gemini, OpenAI, Anthropic 等)

### 安装步骤

1. **克隆与安装**
   ```bash
   git clone <your-repo-url>
   cd xk_alpha
   npm install
   ```

2. **环境配置**
   默认情况下，应用程序的模型配置和密钥直接储存在客户端浏览器本地。由于其纯静态设计架构，如果您后续部署了自己的服务端，可以参考 `.env.example` 在 `.env` 中设置环境变量。

3. **启动引擎**
   ```bash
   npm run dev
   ```
   *工作台将在 `http://localhost:3000` 完成启动。*

<br/>
<hr />
<br/>

<h1 align="center">XK Alpha // Multi-Agent Workbench</h1>

<div align="center">
  <p><strong>A Next-Generation Orchestration Environment for Autonomous Agent Clusters</strong></p>
</div>

<hr />

## 🪐 Overview

**XK Alpha** is an advanced, multi-agent cooperative IDE and visualization workbench. Designed for observing, managing, and intervening in complex LLM-driven workflows, it structures tasks using a dynamic Directed Acyclic Graph (DAG) while preserving iterative intelligence through active reflection and memory.

Unlike standard chat interfaces, XK Alpha provides a literal "glass box" into the minds of Specialized Agents.

## ✨ Key Capabilities

- **🧬 Specialized Agent Swarm**: Six uniquely purposed AI agents operating in concert:
  - **Master Nexus**: Orchestrates task queues and project state.
  - **Creative Studio**: Envisions user experience and interactive dialogue.
  - **Design Core**: Formulates architectural patterns and component systems.
  - **Dev Node**: Writes clean, modular executable code.
  - **Reflect Sub-System**: Audits execution traces and mitigates regressions.
  - **Data Recorder**: Pools interaction data into persistent `Core_Experience_Memory.md`.
- **🕸️ Dynamic DAG Execution**: Visual progression of parallel and dependent sub-tasks.
- **⚡ Provider Agnostic**: Native support for **OpenAI** (gpt-4o, o1), **Google Gemini** (2.5-flash, 2.0-pro), **Anthropic** (claude-3-5-sonnet), and **DeepSeek**. Plus, full extensibility for Custom API Endpoints.
- **🗃️ Virtual File Explorer**: A simulated workspace with drag-and-drop file ingestion, contextual modifications, and state persistence.
- **🌙 Cyber-slate Aesthetics**: A highly polished, terminal-inspired interface utilizing dynamic `emerald-500` accents against deep charcoal to minimize fatigue and maximize data density.

## 🚀 Getting Started

Launch your own cluster in minutes.

### Prerequisites
- Node.js (v18 or higher)
- API Keys for your preferred model providers (Gemini, OpenAI, Anthropic, etc.)

### Installation

1. **Clone & Install**
   ```bash
   git clone <your-repo-url>
   cd xk_alpha
   npm install
   ```

2. **Environment Configuration**
   By default, the application runs client-side config, but you can set up environment variables in `.env` based on `.env.example`.

3. **Ignition**
   ```bash
   npm run dev
   ```
   *The workbench will initialize at `http://localhost:3000`.*

---


