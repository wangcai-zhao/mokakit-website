import UtcConvert from '@/tools/_shared/UtcConvert';

export default function UtcToPst() {
  return (
    <UtcConvert
      title="输入 UTC 的小时与分钟，立即换算成太平洋标准时间（PST，UTC−8）。"
      offsetHours={-8}
      targetName="太平洋标准时间"
      targetAbbr="PST"
    />
  );
}
