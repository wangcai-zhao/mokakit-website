import DateShift from '@/tools/_shared/DateShift';

export default function DaysAgo() {
  return (
    <DateShift
      title="输入天数，立即得出 N 天前是几月几号、星期几。"
      defaultOffset={-30}
      presets={[-7, -30, -90, -365]}
      unit="day"
      unitLabel="天"
    />
  );
}
