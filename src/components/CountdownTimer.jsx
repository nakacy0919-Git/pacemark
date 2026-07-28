import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ startTime, timerMinutes }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!startTime || !timerMinutes) return;
    const endTime = startTime + timerMinutes * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, timerMinutes]);

  const minutes = Math.floor(timeLeft / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const formatTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isTimeUp = timeLeft === 0;
  const isWarning = timeLeft > 0 && timeLeft < 60000; // 残り1分未満

  return (
    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-mono font-extrabold text-2xl shadow-sm transition-colors ${
      isTimeUp ? 'bg-red-500 text-white animate-pulse' :
      isWarning ? 'bg-red-100 text-red-600 animate-pulse' :
      'bg-slate-800 text-white'
    }`}>
      <Clock size={24} />
      {formatTime}
    </div>
  );
}