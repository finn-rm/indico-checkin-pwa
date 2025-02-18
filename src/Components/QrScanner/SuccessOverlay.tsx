import {useEffect} from 'react';
import {CheckCircleIcon} from '@heroicons/react/24/outline';
import {Typography} from '../../Components/Tailwind';

export function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface SuccessOverlayProps {
  participant: {
    fullName: string;
  };
  onAnimationComplete: () => void;
}

export default function SuccessOverlay({participant, onAnimationComplete}: SuccessOverlayProps) {
  const currentTime = formatTime(new Date());

  useEffect(() => {
    const timer = setTimeout(onAnimationComplete, 2000);
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <CheckCircleIcon className="h-24 w-24 text-green-500" />
      <Typography variant="h1" className="mt-4 text-center">
        Checked in at {currentTime}
      </Typography>
      <Typography variant="h2" className="mt-2 text-center">
        {participant.fullName}
      </Typography>
    </div>
  );
}
