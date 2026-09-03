import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';
import { parseYaml, toYaml } from '@/tools/_shared/yaml';

export default function YamlJsonTool() {
  const [mode, setMode] = useState<'yaml2json' | 'json2yaml'>('yaml2json');
  const [input, setInput] = useState(
    'name: 张三\nage: 28\ntags:\n  - 开发\n  - 运维\nmeta:\n  active: true\n  score: 95',
  );

  const result = useMemo(() => {
    if (input.trim() === '') return '';
    try {
      if (mode === 'yaml2json') {
        const obj = parseYaml(input);
        return JSON.stringify(obj, null, 2);
      }
      const obj = JSON.parse(input);
      return toYaml(obj);
    } catch (e) {
      return `错误：${(e as Error).message}`;
    }
  }, [mode, input]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={result}
      placeholder={mode === 'yaml2json' ? '粘贴 YAML…' : '粘贴 JSON…'}
      note="YAML 与 JSON 互转，支持嵌套、数组、行内 [ ] { }。锚点/多文档等高级写法未支持。本地计算。"
    >
      <div class="form-control">
        <select
          class="select select-bordered select-sm w-full"
          value={mode}
          onChange={(e) => setMode((e.target as HTMLSelectElement).value as typeof mode)}
        >
          <option value="yaml2json">YAML → JSON</option>
          <option value="json2yaml">JSON → YAML</option>
        </select>
      </div>
    </DevTool>
  );
}
