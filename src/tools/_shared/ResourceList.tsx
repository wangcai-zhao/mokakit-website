import { useState, useMemo } from 'preact/hooks';
import { goUrl } from '@/utils/outbound';

export interface ResourceItem {
  name: string;
  desc: string;
  cat: string;
  url: string;
  tag?: string;
}

export interface ResourceCat {
  id: string;
  name: string;
}

interface Props {
  items: ResourceItem[];
  cats: ResourceCat[];
  /** 列表项的中文称呼，如「API」「项目」「路线」「案例」 */
  kindLabel: string;
  /** 占位符提示 */
  placeholder?: string;
}

/**
 * 通用「资源导读」筛选列表组件（第③波精选资源导读复用）。
 * 纯前端、零依赖：搜索 + 分类切换，所有外链 rel="nofollow noopener"。
 */
export default function ResourceList({ items, cats, kindLabel, placeholder }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return items.filter(
      (i) =>
        (cat === 'all' || i.cat === cat) &&
        (kw === '' ||
          i.name.toLowerCase().includes(kw) ||
          (i.desc || '').toLowerCase().includes(kw)),
    );
  }, [q, cat, items]);

  return (
    <div>
      <p class="text-xs opacity-60 mb-3">
        本页为外部资源索引，链接多为 GitHub 与英文技术站点等<span class="font-medium">境外站点</span>；若个别链接<span class="font-medium">访问缓慢</span>，可尝试通过 GitHub 镜像站访问，或稍后重试。
      </p>
      <div class="flex flex-wrap gap-2 mb-3">
        <input
          class="input input-bordered input-sm grow min-w-[180px]"
          placeholder={placeholder || `搜索${kindLabel}…`}
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        />
        <button
          class={`btn btn-sm ${cat === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setCat('all')}
        >
          全部
        </button>
        {cats.map((c) => (
          <button
            class={`btn btn-sm ${cat === c.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCat(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p class="text-sm opacity-70 mb-3">
        共 <strong>{filtered.length}</strong> 个{kindLabel}
        {cat !== 'all' && `（已筛选「${cats.find((c) => c.id === cat)?.name}」）`}
      </p>

      <ul class="space-y-2">
        {filtered.map((i) => (
          <li class="card card-compact bg-base-200">
            <div class="card-body">
              <div class="flex items-center gap-2 flex-wrap">
                <a
                  href={goUrl(i.url)}
                  target="_blank"
                  rel="nofollow noopener"
                  class="link link-primary font-medium"
                >
                  {i.name}
                </a>
                {i.tag && <span class="badge badge-sm badge-outline">{i.tag}</span>}
              </div>
              <p class="text-sm opacity-75">{i.desc}</p>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li class="opacity-60 text-sm">没有匹配的结果，换个关键词或分类试试。</li>
        )}
      </ul>
    </div>
  );
}
