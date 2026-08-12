import DateShift from '@/tools/_shared/DateShift';

export default function NinetyDay() {
  return (
    <DateShift
      title="输入起始日期，立即算出 90 天后是哪一天及对应星期几。"
      defaultOffset={90}
      presets={[30, 90, 180, 365]}
      unit="day"
      unitLabel="天"
    />
  );
}
