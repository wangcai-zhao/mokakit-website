import TimeOfDayCalc from '@/tools/_shared/TimeOfDayCalc';

export default function HoursFromNow() {
  return (
    <TimeOfDayCalc
      title="输入起始时间与小时数，立即算出几小时后是几点。"
      defaultHours={3}
    />
  );
}
