import EventCountdown from '@/tools/_shared/EventCountdown';

export default function GovShutdownCountdown() {
  return (
    <EventCountdown
      title="设置任意目标日期与时间，实时查看距离该时刻的倒计时。"
      intro="可设为项目截止日、节日、活动开启时刻等。"
      defaultTarget="2026-12-31T00:00"
    />
  );
}
