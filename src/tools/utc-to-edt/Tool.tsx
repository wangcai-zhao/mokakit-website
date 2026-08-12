import UtcConvert from '@/tools/_shared/UtcConvert';

export default function UtcToEdt() {
  return (
    <UtcConvert
      title="输入 UTC 的小时与分钟，立即换算成美国东部夏令时间（EDT，UTC−4）。"
      offsetHours={-4}
      targetName="美国东部夏令时"
      targetAbbr="EDT"
    />
  );
}
