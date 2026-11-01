/**
 * bwip-js 无官方类型声明，按 udi-generator 实际用到的 API 手写最小声明。
 * 消除 astro check 里的 ts(2307) 存量报错。
 */
declare module 'bwip-js' {
  interface ToCanvasOptions {
    /** 条码类型，如 qrcode / gs1qrcode / datamatrix / gs1-128 / code128 / code39 */
    bcid: string;
    /** 要编码的文本 */
    text: string;
    /** 模块缩放倍数 */
    scale?: number;
    /** 条码高度（毫米数，条码类生效） */
    height?: number;
    /** 是否在图上渲染可读文本 */
    includetext?: boolean;
    /** 文本水平对齐：left / center / right */
    textxalign?: string;
    /** 背景色，十六进制 */
    backgroundcolor?: string;
    [key: string]: unknown;
  }

  interface BwipJs {
    toCanvas(canvas: HTMLCanvasElement, options: ToCanvasOptions): Promise<unknown>;
  }

  const bwipjs: BwipJs;
  export default bwipjs;
}
