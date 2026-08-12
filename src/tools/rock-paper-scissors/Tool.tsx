import { useState, useRef } from 'preact/hooks';

type Move = 'rock' | 'scissors' | 'paper';
type Outcome = 'win' | 'lose' | 'draw';

const MOVES: { id: Move; label: string; emoji: string }[] = [
  { id: 'rock', label: '石头', emoji: '✊' },
  { id: 'scissors', label: '剪刀', emoji: '✌️' },
  { id: 'paper', label: '布', emoji: '✋' },
];

const MOVE_MAP: Record<Move, { label: string; emoji: string }> = {
  rock: { label: '石头', emoji: '✊' },
  scissors: { label: '剪刀', emoji: '✌️' },
  paper: { label: '布', emoji: '✋' },
};

/** 石头 > 剪刀 > 布 > 石头 */
const BEATS: Record<Move, Move> = {
  rock: 'scissors',
  scissors: 'paper',
  paper: 'rock',
};

function randomMove(): Move {
  let idx: number;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / 3) * 3;
    let v = 0;
    do {
      crypto.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    idx = v % 3;
  } else {
    idx = Math.floor(Math.random() * 3);
  }
  return (MOVES[idx] as { id: Move }).id;
}

function judge(mine: Move, theirs: Move): Outcome {
  if (mine === theirs) return 'draw';
  return BEATS[mine] === theirs ? 'win' : 'lose';
}

interface Round {
  mine: Move;
  theirs: Move;
  outcome: Outcome;
}

const OUTCOME_TEXT: Record<Outcome, string> = {
  win: '你赢了！',
  lose: '你输了',
  draw: '平局',
};

const OUTCOME_ALERT: Record<Outcome, string> = {
  win: 'alert-success',
  lose: 'alert-error',
  draw: 'alert-info',
};

export default function RockPaperScissors() {
  const [round, setRound] = useState<Round | null>(null);
  const [score, setScore] = useState({ win: 0, lose: 0, draw: 0 });
  const [history, setHistory] = useState<Outcome[]>([]);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const play = (mine: Move) => {
    if (thinking) return;
    setThinking(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const theirs = randomMove();
      const outcome = judge(mine, theirs);
      setRound({ mine, theirs, outcome });
      setScore((s) => ({ ...s, [outcome]: s[outcome] + 1 }));
      setHistory((h) => [outcome, ...h].slice(0, 10));
      setThinking(false);
    }, 320);
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setRound(null);
    setScore({ win: 0, lose: 0, draw: 0 });
    setHistory([]);
    setThinking(false);
  };

  const total = score.win + score.lose + score.draw;
  const winRate = total ? ((score.win / total) * 100).toFixed(1) : '0.0';

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap justify-center gap-3">
        {MOVES.map((m) => (
          <button
            type="button"
            key={m.id}
            class={`btn btn-lg h-auto flex-col gap-1 py-3 ${thinking ? 'btn-disabled' : 'btn-outline'}`}
            onClick={() => play(m.id)}
          >
            <span class="text-3xl leading-none">{m.emoji}</span>
            <span class="text-sm font-medium">{m.label}</span>
          </button>
        ))}
      </div>

      <div class="rounded-2xl bg-base-200 p-4">
        {round === null && !thinking ? (
          <p class="py-6 text-center text-sm opacity-60">选一个出拳，开始和电脑对战</p>
        ) : (
          <div class="flex items-center justify-center gap-6">
            <div class="text-center">
              <div class="text-4xl">{thinking ? '❔' : MOVE_MAP[round!.mine].emoji}</div>
              <div class="mt-1 text-xs opacity-70">
                你{thinking ? '' : `（${MOVE_MAP[round!.mine].label}）`}
              </div>
            </div>
            <div class="text-lg font-bold opacity-40">VS</div>
            <div class="text-center">
              <div class={`text-4xl ${thinking ? 'animate-pulse' : ''}`}>
                {thinking ? '🤖' : MOVE_MAP[round!.theirs].emoji}
              </div>
              <div class="mt-1 text-xs opacity-70">
                电脑{thinking ? '' : `（${MOVE_MAP[round!.theirs].label}）`}
              </div>
            </div>
          </div>
        )}
      </div>

      {round && !thinking && (
        <div class={`alert ${OUTCOME_ALERT[round.outcome]} py-2`}>
          <span class="font-medium">{OUTCOME_TEXT[round.outcome]}</span>
        </div>
      )}

      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-success badge-lg font-mono">胜 {score.win}</span>
        <span class="badge badge-error badge-lg font-mono">负 {score.lose}</span>
        <span class="badge badge-ghost badge-lg font-mono">平 {score.draw}</span>
        <span class="badge badge-outline badge-lg font-mono">
          {total} 局 · 胜率 {winRate}%
        </span>
        <button type="button" class="btn btn-xs btn-outline" onClick={reset}>
          重置战绩
        </button>
      </div>

      {history.length > 0 && (
        <div class="flex flex-wrap items-center gap-1">
          <span class="text-xs opacity-60">最近十局</span>
          {history.map((o, i) => (
            <span
              key={i}
              class={`badge badge-sm ${
                o === 'win' ? 'badge-success' : o === 'lose' ? 'badge-error' : 'badge-ghost'
              }`}
            >
              {o === 'win' ? '胜' : o === 'lose' ? '负' : '平'}
            </span>
          ))}
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        电脑出拳由 crypto.getRandomValues 在你点击的同时独立生成，三种结果概率均等，不会偷看你的选择。
      </p>
    </div>
  );
}
