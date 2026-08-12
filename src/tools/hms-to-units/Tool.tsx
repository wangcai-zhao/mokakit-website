import DurationConvert from '@/tools/_shared/DurationConvert';

export default function HmsToUnits() {
  return (
    <DurationConvert
      mode="hms2units"
      title="输入 时:分:秒，立即换算成总小时/分钟/秒。"
    />
  );
}
