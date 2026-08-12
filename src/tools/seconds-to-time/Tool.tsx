import DurationConvert from '@/tools/_shared/DurationConvert';

export default function SecondsToTime() {
  return (
    <DurationConvert
      mode="sec2hms"
      title="输入秒数，立即换算成 时:分:秒 与完整拆解。"
    />
  );
}
