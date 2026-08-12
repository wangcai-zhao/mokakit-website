import DurationConvert from '@/tools/_shared/DurationConvert';

export default function HmsAdd() {
  return (
    <DurationConvert
      mode="hmsAdd"
      title="按 时:分:秒 累加或减去时间，得到累计时长。"
    />
  );
}
