import { useEffect, useState } from 'react';

export function TopBar({ centerText }: { centerText: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const localDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const localTime = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const utcDate = time.toISOString().slice(0, 10);
  const utcTime = time.toISOString().slice(11, 19) + ' UTC';

  return (
    <div
      className="grid grid-cols-[2fr_1fr_2fr] bg-[#333] text-white overflow-hidden relative w-auto"
      style={{ padding: '1vh', border: '0px none' }}
    >
      <div
        className="relative grid rounded-[5px] text-left pl-[7px]"
        style={{
          border: '1px solid hsl(210deg 8% 50%)',
          background: 'hsl(210deg 15% 20%)',
          color: 'blanchedalmond',
          padding: '0.5vh',
          fontFamily: '"Victor Mono", sans-serif',
          fontSize: '1.4vw',
        }}
      >
        {localDate} - {localTime}
      </div>
      <div
        className="relative grid rounded-[5px] text-center"
        style={{
          border: '1px solid hsl(210deg 8% 50%)',
          background: 'hsl(210deg 15% 20%)',
          color: 'rgb(0, 119, 255)',
          padding: '0.5vh',
          fontFamily: '"Victor Mono", sans-serif',
          fontSize: '1.4vw',
        }}
      >
        {centerText}
      </div>
      <div
        className="relative grid rounded-[5px] text-right pr-[5px]"
        style={{
          border: '1px solid hsl(210deg 8% 50%)',
          background: 'hsl(210deg 15% 20%)',
          color: 'aquamarine',
          padding: '0.5vh',
          fontFamily: '"Victor Mono", sans-serif',
          fontSize: '1.4vw',
        }}
      >
        {utcDate} {utcTime}
      </div>
    </div>
  );
}
