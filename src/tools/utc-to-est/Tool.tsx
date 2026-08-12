import UtcConvert from '@/tools/_shared/UtcConvert';

export default function UtcToEst() {
  return (
    <UtcConvert
      title="输入 UTC 的小时与分钟，立即换算成美国东部标准时间（EST，UTC−5）。"
      offsetHours={-5}
      targetName="美国东部标准时间"
      targetAbbr="EST"
    />
  );
}
