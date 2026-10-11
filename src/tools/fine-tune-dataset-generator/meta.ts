import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'fine-tune-dataset-generator',
  name: '微调数据集生成器',
  tagline: '把问答对整理成训练 JSONL',
  description:
    '免费在线微调数据集生成器：粘贴「问题 / 回答」成对的文本，一键转换成 Alpaca 或 ShareGPT 格式的 JSONL 训练集，自动去空行、校验字段，方便直接喂给 LoRA / SFT 微调流程，全程本地处理不上传你的数据。',
  keywords: ["微调数据集","SFT","JSONL","LoRA","训练数据"],
  category: 'ai',
  tags: ["ai","微调","数据集","jsonl","大模型"],
  icon: 'table',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 7,
  faq: [
    {
      q: '支持多轮对话吗？',
      a: 'ShareGPT 格式支持多轮；用「轮次」分隔符标出同一会话的多条消息即可。',
    },
    {
      q: '数据量有上限吗？',
      a: '无硬上限，但数据越大浏览器处理越慢，建议单批几千条以内。',
    },
    {
      q: '会保存我的数据吗？',
      a: '不会，解析在本地完成。',
    },
  ],
});
