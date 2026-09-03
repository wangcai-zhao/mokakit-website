import LinearConvert, { type LinUnit } from '@/tools/_shared/linear-convert';

const UNITS: LinUnit[] = [
  { id: 'bit', name: '比特', symbol: 'bit', factor: 0.125 },
  { id: 'b', name: '字节', symbol: 'B', factor: 1 },
  { id: 'kb', name: '千字节(SI)', symbol: 'KB', factor: 1000 },
  { id: 'kib', name: '二进制千字节', symbol: 'KiB', factor: 1024 },
  { id: 'mb', name: '兆字节(SI)', symbol: 'MB', factor: 1e6 },
  { id: 'mib', name: '二进制兆字节', symbol: 'MiB', factor: 1048576 },
  { id: 'gb', name: '吉字节(SI)', symbol: 'GB', factor: 1e9 },
  { id: 'gib', name: '二进制吉字节', symbol: 'GiB', factor: 1073741824 },
  { id: 'tb', name: '太字节(SI)', symbol: 'TB', factor: 1e12 },
  { id: 'tib', name: '二进制太字节', symbol: 'TiB', factor: 1099511627776 },
  { id: 'pb', name: '拍字节(SI)', symbol: 'PB', factor: 1e15 },
  { id: 'pib', name: '二进制拍字节', symbol: 'PiB', factor: 1125899906842624 },
];

export default function DataBinaryConvert() {
  return (
    <LinearConvert
      units={UNITS}
      note="同时列出十进制（SI，KB=1000B）与二进制（IEC，KiB=1024B）两套体系：1 KiB 比 1 KB 大约 2.4%，1 GiB 比 1 GB 大约 7.4%。硬盘标称 1TB 在系统里显示约 931 GiB 正是此口径差异。全部计算均在浏览器本地完成，不会上传任何数据。"
    />
  );
}
