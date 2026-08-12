import UtcConvert from '@/tools/_shared/UtcConvert';

export default function UtcToCst() {
  return (
    <UtcConvert
      title="输入 UTC 的小时与分钟，立即换算成中国标准时间（北京时间，UTC+8）。"
      offsetHours={8}
      targetName="中国标准时间（北京时间）"
      targetAbbr="CST"
    />
  );
}
