/**
 * 工具结果类型与统一错误处理。
 *
 * 所有新增工具的计算层都返回 ToolResult<T> 判别联合：
 *   - 成功：{ ok: true; data: T }
 *   - 失败：{ ok: false; error: string }
 * Tool.tsx 据此渲染，错误一律用 role="alert" 红字展示，杜绝各工具各写一套报错。
 *
 * parseNumber 提供统一的数值输入校验（空值 / 非数 / 越界），是 20 个工具
 * 共享的输入守门员。
 */

export type ToolOk<T> = { ok: true; data: T };
export type ToolErr = { ok: false; error: string };
export type ToolResult<T> = ToolOk<T> | ToolErr;

export function ok<T>(data: T): ToolOk<T> {
  return { ok: true, data };
}

export function err(error: string): ToolErr {
  return { ok: false, error };
}

export interface NumberOpts {
  /** 最小值（含） */
  min?: number;
  /** 最大值（含） */
  max?: number;
  /** 字段中文名，用于报错文案 */
  name?: string;
  /** 允许为空，空时返回 ok(NaN)，调用方用 Number.isFinite 判断 */
  allowEmpty?: boolean;
}

/**
 * 统一数值校验。返回 ToolResult<number>：
 *   空且不允许空 → err
 *   非数 → err
 *   越界 → err
 *   否则 → ok(number)
 */
export function parseNumber(raw: string, opts: NumberOpts = {}): ToolResult<number> {
  const name = opts.name ?? '数值';
  const t = (raw ?? '').trim();
  if (t === '') {
    if (opts.allowEmpty) return ok(NaN);
    return err(`请输入${name}`);
  }
  const n = Number(t);
  if (!Number.isFinite(n)) return err(`${name}不是有效数字`);
  if (opts.min !== undefined && n < opts.min) return err(`${name}不能小于 ${opts.min}`);
  if (opts.max !== undefined && n > opts.max) return err(`${name}不能大于 ${opts.max}`);
  return ok(n);
}
