import { NonaryClockState } from '../types/dragon';

export function calculateNonaryTime(date: Date = new Date()): NonaryClockState {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const millis = date.getMilliseconds();

  // Total elapsed minutes in the 1440-minute solar day
  const totalMinutes = hours * 60 + minutes + (seconds + millis / 1000) / 60;
  
  // Dragon 9 Hour: each Dragon Hour = exactly 54 solar minutes
  // 1440 / 54 = 26.6666... total Dragon hours per day
  const dragonHour = totalMinutes / 54;
  
  // Current Dragon Minute within the current Dragon hour (0 to 53.999...)
  const currentDragonMinuteFloat = (totalMinutes % 54);
  const currentDragonMinute = Math.floor(currentDragonMinuteFloat);
  const currentDragonSecond = Math.floor((currentDragonMinuteFloat - currentDragonMinute) * 54);

  // Cycle division: two 13.33-hour halves
  // Cycle Alpha: 00:00 - 12:00 (0 to 720 solar minutes)
  // Cycle Beta: 12:00 - 24:00 (720 to 1440 solar minutes)
  const isAlpha = totalMinutes < 720;
  const currentCycle = isAlpha 
    ? 'Cycle Alpha (00:00 - 12:00)' 
    : 'Cycle Beta (12:00 - 24:00)';

  // Apex alignment periods:
  // Apex Alpha: 11:51 to 12:09 (solar minutes 711 to 729)
  // Apex Beta: 23:51 to 00:09 (solar minutes 1431 to 1440 and 0 to 9)
  const solarMinuteOfDay = hours * 60 + minutes + seconds / 60;
  
  const isApexAlpha = solarMinuteOfDay >= 711 && solarMinuteOfDay <= 729;
  const isApexBeta = solarMinuteOfDay >= 1431 || solarMinuteOfDay <= 9;
  const isApexActive = isApexAlpha || isApexBeta;

  let apexWindowName = 'Nominal Flow';
  let apexProgressPct = 0;
  if (isApexAlpha) {
    apexWindowName = 'Apex Alpha Alignment (Midday Harmonic Pivot)';
    apexProgressPct = Math.min(100, Math.max(0, ((solarMinuteOfDay - 711) / 18) * 100));
  } else if (isApexBeta) {
    apexWindowName = 'Apex Beta Alignment (Midnight Nonary Genesis)';
    const offset = solarMinuteOfDay >= 1431 ? solarMinuteOfDay - 1431 : solarMinuteOfDay + 9;
    apexProgressPct = Math.min(100, Math.max(0, (offset / 18) * 100));
  }

  // Calculate time remaining to next Apex in solar minutes
  let timeToNextApexMin = 0;
  if (isApexActive) {
    timeToNextApexMin = 0;
  } else if (solarMinuteOfDay < 711) {
    timeToNextApexMin = 711 - solarMinuteOfDay;
  } else if (solarMinuteOfDay < 1431) {
    timeToNextApexMin = 1431 - solarMinuteOfDay;
  } else {
    timeToNextApexMin = (1440 - solarMinuteOfDay) + 711;
  }

  // Cathie Harmonic second = (solar second * 9/8)
  const totalSolarSeconds = hours * 3600 + minutes * 60 + seconds;
  const harmonicSecond = (totalSolarSeconds * (9 / 8)) % 97200;

  const dragonHourInt = Math.floor(dragonHour);
  const dragonHourDisplay = `D9·${dragonHourInt.toString().padStart(2, '0')}:${currentDragonMinute.toString().padStart(2, '0')}:${currentDragonSecond.toString().padStart(2, '0')}`;

  return {
    solarTime: date.toLocaleTimeString('en-US', { hour12: false }),
    utcTime: date.toUTCString().slice(17, 25) + ' UTC',
    dragonHour,
    dragonHourDisplay,
    dragonMinute: currentDragonMinute,
    dragonSecond: currentDragonSecond,
    totalMinutes,
    currentCycle,
    isApexActive,
    apexWindowName,
    timeToNextApexMin: Math.round(timeToNextApexMin * 10) / 10,
    apexProgressPct: Math.round(apexProgressPct),
    harmonicSecond: Math.round(harmonicSecond)
  };
}
