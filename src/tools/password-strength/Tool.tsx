import { useState } from 'preact/hooks';

const WEAK = new Set([
  'password', '123456', '12345678', '123456789', 'qwerty', 'abc123', 'admin',
  '111111', '000000', 'iloveyou', 'letmein', 'welcome', 'passw0rd', '123123',
  '1q2w3e4r', 'qwerty123', 'password1', 'p@ssw0rd', 'root', 'toor', '666666',
  '88888888', 'abcdef', 'aaaaaa', 'test', 'test123', 'changeme', 'zhang123',
  'wang123', '1234abcd', '5201314', '1314520',
]);

function analyze(pwd: string) {
  if (!pwd) return null;
  const len = pwd.length;
  const lower = /[a-z]/.test(pwd);
  const upper = /[A-Z]/.test(pwd);
  const digit = /[0-9]/.test(pwd);
  const symbol = /[^a-zA-Z0-9]/.test(pwd);
  const classes = [lower, upper, digit, symbol].filter(Boolean).length;
  const charSet = (lower ? 26 : 0) + (upper ? 26 : 0) + (digit ? 10 : 0) + (symbol ? 32 : 0);

  // 熵（bit）
  const entropy = len * (charSet > 0 ? Math.log2(charSet) : 0);

  // 模式检测
  const hasSeq = /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf|zxcv)/i.test(pwd);
  const hasRepeat = /(.)\1{2,}/.test(pwd);
  const isWeakWord = WEAK.has(pwd.toLowerCase());

  // 评分 0-100
  let score = 0;
  score += Math.min(len, 16) * 3; // 长度最多 48
  score += classes * 8; // 字符种类最多 32
  if (entropy > 60) score += 20;
  else if (entropy > 40) score += 10;
  if (hasSeq) score -= 12;
  if (hasRepeat) score -= 8;
  if (isWeakWord) score = Math.min(score, 8);
  score = Math.max(0, Math.min(100, score));

  let level: string, color: string;
  if (score < 25) { level = '弱'; color = 'text-error'; }
  else if (score < 50) { level = '较弱'; color = 'text-warning'; }
  else if (score < 75) { level = '中等'; color = 'text-info'; }
  else if (score < 90) { level = '强'; color = 'text-success'; }
  else { level = '极强'; color = 'text-success'; }

  const tips: string[] = [];
  if (len < 8) tips.push('建议至少 8 位，越长越安全');
  if (classes < 3) tips.push('混合大小写字母、数字、符号更安全');
  if (hasSeq) tips.push('避免连续序列（1234、qwer 等）');
  if (hasRepeat) tips.push('避免重复字符（aaa、111 等）');
  if (isWeakWord) tips.push('这是常见弱口令，极易被破解');
  if (entropy < 40) tips.push('整体随机性偏低，建议增加无规律组合');
  if (tips.length === 0) tips.push('不错！继续保持高随机性即可');

  return { len, lower, upper, digit, symbol, classes, charSet, entropy, score, level, color, tips, isWeakWord, hasSeq, hasRepeat };
}

export default function PasswordStrength() {
  const [pwd, setPwd] = useState('');
  const r = analyze(pwd);

  return (
    <div class="space-y-4">
      <label class="sr-only" for="pwd-input">要分析的密码</label>
      <input
        id="pwd-input"
        type="text"
        class="input input-bordered w-full text-sm"
        placeholder="输入要分析的密码……（仅本地计算，不会上传）"
        value={pwd}
        onInput={(e) => setPwd((e.target as HTMLInputElement).value)}
      />

      {!r && (
        <p class="text-sm opacity-55 text-center py-4">输入密码后，这里会实时显示强度分析与改进建议。</p>
      )}

      {r && (
        <div class="space-y-3">
          <div>
            <div class="flex items-center justify-between text-sm">
              <span class={`font-semibold ${r.color}`}>强度：{r.level}</span>
              <span class="opacity-60">{r.score} / 100</span>
            </div>
            <div class="mt-1 h-2 rounded-full bg-base-200 overflow-hidden">
              <div
                class="h-full transition-all"
                style={`width:${r.score}%;background:${
                  r.score < 25 ? '#ef4444' : r.score < 50 ? '#f59e0b' : r.score < 75 ? '#3b82f6' : '#22c55e'
                }`}
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div class="rounded-lg bg-base-200 p-2 text-center">
              <div class="opacity-55">长度</div>
              <div class="font-semibold">{r.len}</div>
            </div>
            <div class="rounded-lg bg-base-200 p-2 text-center">
              <div class="opacity-55">字符种类</div>
              <div class="font-semibold">{r.classes} / 4</div>
            </div>
            <div class="rounded-lg bg-base-200 p-2 text-center">
              <div class="opacity-55">字符池</div>
              <div class="font-semibold">{r.charSet}</div>
            </div>
            <div class="rounded-lg bg-base-200 p-2 text-center">
              <div class="opacity-55">熵</div>
              <div class="font-semibold">{r.entropy.toFixed(1)} bit</div>
            </div>
          </div>

          <div class="flex flex-wrap gap-1 text-xs">
            <span class={`badge ${r.lower ? 'badge-success' : 'badge-ghost'}`}>小写</span>
            <span class={`badge ${r.upper ? 'badge-success' : 'badge-ghost'}`}>大写</span>
            <span class={`badge ${r.digit ? 'badge-success' : 'badge-ghost'}`}>数字</span>
            <span class={`badge ${r.symbol ? 'badge-success' : 'badge-ghost'}`}>符号</span>
            <span class={`badge ${r.hasSeq ? 'badge-warning' : 'badge-ghost'}`}>连续序列</span>
            <span class={`badge ${r.hasRepeat ? 'badge-warning' : 'badge-ghost'}`}>重复字符</span>
            <span class={`badge ${r.isWeakWord ? 'badge-error' : 'badge-ghost'}`}>弱口令库</span>
          </div>

          <ul class="space-y-1 text-xs opacity-75 list-disc list-inside">
            {r.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        所有分析在浏览器本地完成，不会记录或上传你的输入。评分为启发式估算，仅作参考，不构成绝对安全保证。
      </p>
    </div>
  );
}
