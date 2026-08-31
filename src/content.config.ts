import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 博客/文章频道：内容营销引擎（SEO 主线）
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * 技巧专栏：借 WorkBuddy 搜索热度给工具页引流的内容频道。
 *
 * 与 blog 分轨的原因：blog 是工具/技术向 SEO 长文，tips 是「真人场景 + 操作流 + 踩坑」
 * 的技巧文，读者意图不同，混在一个列表里两边都不讨好。
 */
const tips = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tips' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(120),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /**
     * 默认 true（与 blog 相反）：本专栏由 automation 批量产草稿，
     * 默认不发布更安全，人工审核后手动改 false。
     */
    draft: z.boolean().default(true),
    /** 系列名，列表页按 series 分组展示 */
    series: z.string().default('WorkBuddy 使用技巧'),
    /** 系列内序号，同 series 内升序，列表页用它兜底排序 */
    order: z.number().int().optional(),
    difficulty: z.enum(['入门', '进阶', '高手']).default('入门'),
    /**
     * 关联 MokaKit 工具 id（对应 src/tools/<id>/），详情页底部自动渲染内链卡。
     * id 是否有效无法在 schema 期校验（会与工具注册表循环依赖），
     * 改由 scripts/new-tip.mjs 生成时校验。
     */
    relatedTools: z.array(z.string()).default([]),
    /** OG 图路径，相对 public/。留空则用站点默认 /og.png */
    cover: z.string().optional(),
    author: z.string().default('旺财先生'),
    /** 首页专栏卡位只取 featured 的前 3 篇 */
    featured: z.boolean().default(false),
    /** 单篇级邀请位开关：个别敏感话题可单独关掉，不用改代码 */
    showInvite: z.boolean().default(true),
  }),
});

export const collections = { blog, tips };
