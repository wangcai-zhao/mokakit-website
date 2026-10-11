---
title: 把 AI 用起来：MokaKit 工具箱扩容到 260，重点压在智能体与 MCP
description: MokaKit 摩卡工具箱突破 260 个工具，这一批集中补了 AI、智能体（Agent）与 MCP 方向：从系统提示词生成、函数调用 Schema、到 MCP 工具定义与服务器清单。本文讲清这批工具解决什么、怎么串起你的工作流。
publishDate: 2026-10-11
updatedDate: 2026-10-11
tags: [MCP, 智能体, AI, 工具箱, Prompt]
---

大模型越来越强，但多数人卡在「怎么把它用起来」：提示词随手写、工具调用靠手拼 JSON、智能体跑起来才发现人设串戏、想接 MCP 又不知道有哪些 Server 能接。

这一批更新，我们把 MokaKit 工具箱推到 **260 个**，新增的 14 个工具几乎全部压在 **AI / 智能体 / MCP** 这条主线上——不是又堆一堆计算器，而是补齐「从想法到能跑的 AI 工作流」中间那几步。

## 为什么是这条线

过去一年，AI 工具的形态明显从「聊天」走向「能干活」：模型通过 Function Calling 调工具、智能体（Agent）按流程自主跑、MCP 把外部系统统一接进客户端。但配套的工程化工具却很少：

- 提示词还是随手写，质量看心情；
- 给大模型定义「有哪些工具可调用」，得手拼 JSON Schema；
- 多智能体协作时，谁负责什么、边界在哪说不清；
- 想接 MCP，Server 散落 GitHub，盲搜半天。

这批工具就是冲着这些缺口来的。

## 提示词：从「随便问」到「稳定出活」

[系统提示词生成器](/tools/system-prompt-generator/) 把角色、目标、约束、语气、输出格式拆成字段拼成 System Prompt；[提示词优化器](/tools/prompt-optimizer/) 则反过来，把粗糙提示词按 checklist 自动补全缺失项并高亮改了什么。配套的 [提示词注入检测](/tools/prompt-injection-detector/) 在上线智能体前拦一道常见安全风险，[RAG 提示词构建器](/tools/rag-prompt-builder/) 帮你拼出带引用约束的检索增强模板。

## 让模型「调工具」：把 JSON 拼对

想让大模型调用你的接口，先得告诉它参数长什么样。[函数调用 Schema 生成器](/tools/function-calling-generator/) 表单化生成 OpenAI / Anthropic 两种格式的 tool 定义；[上下文窗口计算器](/tools/context-window-calculator/) 帮你算清一轮长对话能吃多少 token、还能聊几轮不超限；[微调数据集生成器](/tools/fine-tune-dataset-generator/) 把问答对整理成 Alpaca / ShareGPT 的 JSONL，直接进 SFT。

## 智能体：把「人设」和「流程」定清楚

多智能体协作翻车，十有八九是角色模糊。[智能体角色设定生成器](/tools/agent-role-designer/) 产出结构化人设卡（目标、边界、被授予的工具）；[智能体工作流生成器](/tools/agent-workflow-generator/) 把步骤画成可落 n8n / Dify / LangGraph 的流程 JSON；[智能体命名生成器](/tools/agent-name-generator/) 和 [智能体评测用例生成器](/tools/agent-eval-generator/) 则分别解决「起名」和「上线前出一套考题防退化」。

## MCP：统一接外部工具

MCP（Model Context Protocol）让 AI 客户端以一套标准调用外部工具。我们同步在[好站导航](/sites/)新增了 **MCP 专属分组**，并补了 [MCP 服务器清单](/tools/mcp-server-directory/) 这个工具——按官方 / 数据库 / 云 / 开发维度整理热门 Server，[MCP 工具定义生成器](/tools/mcp-tool-generator/) 则帮你写出合规的 tool 定义。MokaKit 自己的 MCP Server（[接入指南](/blog/mcp-guide/)）也一直开放，把站上中国本土计算能力直接交给 AI 调。

## 怎么串起一条工作流

一个典型链路：先用角色设定生成器定人设 → 用工作流生成器画出步骤 → 用函数调用 / MCP 工具生成器定义它能调的工具 → 用评测用例生成器出考题回归 → 最后用提示词优化器把每步指令打磨到位。全程浏览器本地完成，不上传你的内容。

工具越来越多，但目标始终一个：让「人用」和「AI 调」走同一套能力。这一批只是开始，MCP 与智能体生态还在飞快膨胀，我们会持续把真正好用的那部分收进工具箱。
