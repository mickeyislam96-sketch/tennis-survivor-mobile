import { useState, useEffect, useRef } from 'react';
import { formatCountdown } from '../utils/formatters';

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  display: string;
  isExpired: boolean;
  isUrgent: boolean; // < 1 hour remaining
}

export function useCountdown(targetDate: string | null): CountdownState {
  const [state, setState] = useState<CountdownState>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    display: '--',
    isExpired: false,
    isUrgent: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setState({ hours: 0, minutes: 0, seconds: 0, display: '--', isExpired: true, isUrgent: false });
      return;
    }

    const update = () => {
      const ms = new Date(targetDate).getTime() - Date.now();
      if (ms <= 0) {
        setState({ hours: 0, minutes: 0, seconds: 0, display: 'Locked', isExpired: true, isUrgent: false });
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      const { hours, minutes, seconds, display } = formatCountdown(ms);
      setState({
        hours,
        minutes,
        seconds,
        display,
        isExpired: false,
        isUrgent: ms < 3600000,
      });
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetDate]);

  return state;
}
