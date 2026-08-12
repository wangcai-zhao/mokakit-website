import { useState, useRef, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface EmojiItem {
  /** 表情本身 */
  e: string;
  /** 中英文关键词，空格分隔 */
  k: string;
  /** 分组 */
  g: string;
}

const EMOJIS: EmojiItem[] = [
  // 笑脸与情绪
  { e: '😀', k: '笑 开心 高兴 smile', g: '表情' },
  { e: '😃', k: '大笑 开心 兴奋 grin', g: '表情' },
  { e: '😄', k: '笑 眯眼 快乐 happy', g: '表情' },
  { e: '😁', k: '咧嘴笑 露齿 开心', g: '表情' },
  { e: '😆', k: '大笑 哈哈 眯眼 laugh', g: '表情' },
  { e: '😅', k: '苦笑 冷汗 尴尬 sweat', g: '表情' },
  { e: '🤣', k: '笑翻 打滚 爆笑 rofl', g: '表情' },
  { e: '😂', k: '笑哭 喜极而泣 lol', g: '表情' },
  { e: '🙂', k: '微笑 轻笑 还行', g: '表情' },
  { e: '🙃', k: '倒脸 无语 反讽 翻转', g: '表情' },
  { e: '😉', k: '眨眼 调皮 wink', g: '表情' },
  { e: '😊', k: '微笑 害羞 温柔 blush', g: '表情' },
  { e: '😇', k: '天使 无辜 光环 angel', g: '表情' },
  { e: '🥰', k: '爱心 喜欢 幸福 love', g: '表情' },
  { e: '😍', k: '花痴 爱心眼 喜欢', g: '表情' },
  { e: '🤩', k: '星星眼 崇拜 惊艳 star', g: '表情' },
  { e: '😘', k: '飞吻 亲亲 爱 kiss', g: '表情' },
  { e: '😗', k: '亲 嘟嘴 吹口哨', g: '表情' },
  { e: '😋', k: '好吃 舔嘴 美味 yum', g: '表情' },
  { e: '😛', k: '吐舌 调皮 tongue', g: '表情' },
  { e: '😜', k: '挤眼吐舌 皮 调皮', g: '表情' },
  { e: '🤪', k: '疯狂 搞怪 抽风 crazy', g: '表情' },
  { e: '🤨', k: '挑眉 怀疑 质疑', g: '表情' },
  { e: '🧐', k: '单片眼镜 审视 研究', g: '表情' },
  { e: '🤓', k: '书呆子 学霸 眼镜 nerd', g: '表情' },
  { e: '😎', k: '墨镜 酷 帅 cool', g: '表情' },
  { e: '🥳', k: '派对 庆祝 生日 party', g: '表情' },
  { e: '😏', k: '得意 坏笑 你懂的', g: '表情' },
  { e: '😒', k: '无语 不屑 白眼', g: '表情' },
  { e: '😞', k: '失望 难过 沮丧', g: '表情' },
  { e: '😔', k: '郁闷 低落 反思', g: '表情' },
  { e: '😢', k: '哭 伤心 流泪 cry', g: '表情' },
  { e: '😭', k: '大哭 崩溃 泪奔', g: '表情' },
  { e: '😤', k: '生气 哼 不服 傲娇', g: '表情' },
  { e: '😡', k: '愤怒 生气 火大 angry', g: '表情' },
  { e: '🤬', k: '骂人 爆粗 抓狂', g: '表情' },
  { e: '🤯', k: '震惊 爆炸头 崩溃', g: '表情' },
  { e: '😱', k: '尖叫 惊恐 害怕 scream', g: '表情' },
  { e: '😳', k: '脸红 害羞 震惊 呆', g: '表情' },
  { e: '🥺', k: '可怜 求求 委屈 卖萌', g: '表情' },
  { e: '😴', k: '睡觉 困 打呼 sleep', g: '表情' },
  { e: '🤔', k: '思考 想 疑惑 think', g: '表情' },
  { e: '🤗', k: '拥抱 抱抱 hug', g: '表情' },
  { e: '🤫', k: '嘘 安静 保密 quiet', g: '表情' },
  { e: '😷', k: '口罩 生病 防护 mask', g: '表情' },
  { e: '🤒', k: '发烧 生病 体温计', g: '表情' },
  { e: '🤮', k: '呕吐 恶心 吐了', g: '表情' },
  { e: '🥱', k: '打哈欠 困 无聊', g: '表情' },
  { e: '😵', k: '晕 昏 眼冒金星', g: '表情' },
  { e: '🤠', k: '牛仔 帽子 潇洒', g: '表情' },
  { e: '👻', k: '鬼 幽灵 万圣节 ghost', g: '表情' },
  { e: '💀', k: '骷髅 死 无语', g: '表情' },
  { e: '🤡', k: '小丑 滑稽 clown', g: '表情' },
  { e: '👽', k: '外星人 alien', g: '表情' },
  { e: '🤖', k: '机器人 AI robot', g: '表情' },

  // 手势
  { e: '👍', k: '赞 点赞 好 棒 thumbsup', g: '手势' },
  { e: '👎', k: '差评 不好 反对', g: '手势' },
  { e: '👌', k: 'OK 好的 完美 没问题', g: '手势' },
  { e: '✌️', k: '耶 胜利 剪刀手 victory', g: '手势' },
  { e: '🤞', k: '祈祷 好运 交叉手指', g: '手势' },
  { e: '🤝', k: '握手 合作 成交 deal', g: '手势' },
  { e: '👏', k: '鼓掌 厉害 棒 clap', g: '手势' },
  { e: '🙏', k: '拜托 感谢 祈祷 求 please', g: '手势' },
  { e: '💪', k: '加油 肌肉 强壮 muscle', g: '手势' },
  { e: '👋', k: '挥手 你好 再见 hello', g: '手势' },
  { e: '🤙', k: '打电话 六 call me', g: '手势' },
  { e: '✊', k: '拳头 加油 打气', g: '手势' },
  { e: '👊', k: '碰拳 出拳 punch', g: '手势' },
  { e: '🖐️', k: '手掌 五 停 hand', g: '手势' },
  { e: '👀', k: '眼睛 看 围观 eyes', g: '手势' },
  { e: '🫶', k: '比心 爱心手 喜欢', g: '手势' },

  // 心与符号
  { e: '❤️', k: '红心 爱 喜欢 heart', g: '符号' },
  { e: '🧡', k: '橙心 橘色爱心', g: '符号' },
  { e: '💛', k: '黄心 黄色爱心', g: '符号' },
  { e: '💚', k: '绿心 绿色爱心', g: '符号' },
  { e: '💙', k: '蓝心 蓝色爱心', g: '符号' },
  { e: '💜', k: '紫心 紫色爱心', g: '符号' },
  { e: '🖤', k: '黑心 黑色爱心', g: '符号' },
  { e: '💔', k: '心碎 失恋 伤心 broken', g: '符号' },
  { e: '💕', k: '两颗心 爱情 甜蜜', g: '符号' },
  { e: '💖', k: '闪亮心 喜欢 心动', g: '符号' },
  { e: '✨', k: '闪光 星星 亮 sparkle', g: '符号' },
  { e: '⭐', k: '星星 收藏 star', g: '符号' },
  { e: '🌟', k: '闪耀星 明星 出彩', g: '符号' },
  { e: '💫', k: '眩晕 流星 星', g: '符号' },
  { e: '🔥', k: '火 热门 燃 火爆 fire', g: '符号' },
  { e: '💯', k: '满分 100 完全同意', g: '符号' },
  { e: '💥', k: '爆炸 碰撞 冲击 boom', g: '符号' },
  { e: '💤', k: '睡觉 zzz 困', g: '符号' },
  { e: '✅', k: '对勾 完成 通过 check', g: '符号' },
  { e: '❌', k: '错 叉 取消 错误 wrong', g: '符号' },
  { e: '⚠️', k: '警告 注意 危险 warning', g: '符号' },
  { e: '❓', k: '问号 疑问 question', g: '符号' },
  { e: '❗', k: '感叹号 重要 注意', g: '符号' },
  { e: '🚫', k: '禁止 不许 no', g: '符号' },
  { e: '🔞', k: '未成年禁止 十八禁', g: '符号' },

  // 动物
  { e: '🐶', k: '狗 小狗 汪 dog', g: '动物' },
  { e: '🐱', k: '猫 咪咪 喵 cat', g: '动物' },
  { e: '🐭', k: '老鼠 鼠 mouse', g: '动物' },
  { e: '🐰', k: '兔子 兔 rabbit', g: '动物' },
  { e: '🦊', k: '狐狸 fox', g: '动物' },
  { e: '🐻', k: '熊 bear', g: '动物' },
  { e: '🐼', k: '熊猫 国宝 panda', g: '动物' },
  { e: '🐨', k: '考拉 树袋熊 koala', g: '动物' },
  { e: '🐯', k: '老虎 虎 tiger', g: '动物' },
  { e: '🦁', k: '狮子 lion', g: '动物' },
  { e: '🐮', k: '牛 奶牛 cow', g: '动物' },
  { e: '🐷', k: '猪 小猪 pig', g: '动物' },
  { e: '🐔', k: '鸡 chicken', g: '动物' },
  { e: '🐧', k: '企鹅 penguin', g: '动物' },
  { e: '🦄', k: '独角兽 unicorn', g: '动物' },
  { e: '🐝', k: '蜜蜂 勤劳 bee', g: '动物' },
  { e: '🐳', k: '鲸鱼 whale', g: '动物' },
  { e: '🐟', k: '鱼 fish', g: '动物' },

  // 食物
  { e: '🍎', k: '苹果 apple', g: '食物' },
  { e: '🍊', k: '橘子 橙子 orange', g: '食物' },
  { e: '🍌', k: '香蕉 banana', g: '食物' },
  { e: '🍉', k: '西瓜 吃瓜 watermelon', g: '食物' },
  { e: '🍇', k: '葡萄 提子 grape', g: '食物' },
  { e: '🍓', k: '草莓 strawberry', g: '食物' },
  { e: '🍕', k: '披萨 比萨 pizza', g: '食物' },
  { e: '🍔', k: '汉堡 快餐 burger', g: '食物' },
  { e: '🍟', k: '薯条 fries', g: '食物' },
  { e: '🍜', k: '面条 拉面 泡面 noodle', g: '食物' },
  { e: '🍚', k: '米饭 白饭 rice', g: '食物' },
  { e: '🍰', k: '蛋糕 甜点 cake', g: '食物' },
  { e: '🎂', k: '生日蛋糕 生日快乐', g: '食物' },
  { e: '🍺', k: '啤酒 干杯 beer', g: '食物' },
  { e: '☕', k: '咖啡 提神 coffee', g: '食物' },
  { e: '🍵', k: '茶 绿茶 tea', g: '食物' },
  { e: '🍦', k: '冰淇淋 甜筒 雪糕', g: '食物' },

  // 物品与场景
  { e: '🎉', k: '庆祝 派对 撒花 恭喜', g: '物品' },
  { e: '🎊', k: '彩带 庆祝 礼花', g: '物品' },
  { e: '🎁', k: '礼物 送礼 gift', g: '物品' },
  { e: '🏆', k: '奖杯 冠军 第一 trophy', g: '物品' },
  { e: '🥇', k: '金牌 第一名 gold', g: '物品' },
  { e: '🚀', k: '火箭 起飞 冲 rocket', g: '物品' },
  { e: '💰', k: '钱 钱袋 发财 money', g: '物品' },
  { e: '💡', k: '灯泡 想法 灵感 idea', g: '物品' },
  { e: '📌', k: '图钉 置顶 标记 pin', g: '物品' },
  { e: '🔔', k: '铃铛 提醒 通知 bell', g: '物品' },
  { e: '📱', k: '手机 移动端 phone', g: '物品' },
  { e: '💻', k: '电脑 笔记本 办公 laptop', g: '物品' },
  { e: '⌛', k: '沙漏 等待 时间', g: '物品' },
  { e: '⏰', k: '闹钟 时间 提醒 alarm', g: '物品' },
  { e: '🎵', k: '音乐 音符 歌 music', g: '物品' },
  { e: '📷', k: '相机 拍照 camera', g: '物品' },
  { e: '🔍', k: '放大镜 搜索 查找 search', g: '物品' },
  { e: '🔒', k: '锁 加密 安全 lock', g: '物品' },
  { e: '🌈', k: '彩虹 rainbow', g: '物品' },
  { e: '☀️', k: '太阳 晴天 sun', g: '物品' },
  { e: '🌙', k: '月亮 晚安 夜 moon', g: '物品' },
  { e: '⛄', k: '雪人 冬天 下雪 snow', g: '物品' },
  { e: '🌸', k: '樱花 花 春天 flower', g: '物品' },
  { e: '🍀', k: '四叶草 幸运 lucky', g: '物品' },
  { e: '🌍', k: '地球 世界 earth', g: '物品' },
];

const GROUPS = ['全部', '表情', '手势', '符号', '动物', '食物', '物品'];

export default function EmojiSearch() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('全部');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EMOJIS.filter((item) => {
      if (group !== '全部' && item.g !== group) return false;
      if (!q) return true;
      return item.k.toLowerCase().includes(q) || item.e === q;
    });
  }, [query, group]);

  const copy = async (text: string) => {
      await copyText(text);
    setCopied(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div class="space-y-4">
      <label class="sr-only" for="emoji-q">搜索表情</label>
      <input
        id="emoji-q"
        type="search"
        class="input input-bordered w-full"
        aria-label="搜索表情"
        placeholder="搜索表情，如：开心、生气、点赞、猫、火"
        value={query}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
      />

      <div class="flex flex-wrap gap-1">
        {GROUPS.map((g) => (
          <button
            type="button"
            key={g}
            class={`btn btn-xs ${group === g ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <div class="flex items-center gap-2 text-xs opacity-60">
        <span>共 {list.length} 个表情</span>
        {copied && <span class="badge badge-success badge-sm">已复制 {copied}</span>}
      </div>

      {list.length === 0 ? (
        <div class="rounded-xl bg-base-200 py-10 text-center text-sm opacity-60">
          没找到匹配的表情，换个关键词试试
        </div>
      ) : (
        <div class="grid grid-cols-6 gap-1 sm:grid-cols-10 md:grid-cols-12">
          {list.map((item) => (
            <button
              type="button"
              key={item.e}
              title={item.k}
              aria-label={item.k}
              class={`flex aspect-square items-center justify-center rounded-lg text-2xl transition-colors hover:bg-base-300 ${
                copied === item.e ? 'bg-success/25' : 'bg-base-200'
              }`}
              onClick={() => copy(item.e)}
            >
              {item.e}
            </button>
          ))}
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        点击表情即可复制到剪贴板。表情在不同系统与 App 中的显示样式由对方设备字体决定，属正常现象。
      </p>
    </div>
  );
}
