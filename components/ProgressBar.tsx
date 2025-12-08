import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = "bg-indigo-500", className = "" }) => {
  return (
    <div className={`w-full bg-slate-700 rounded-full h-2.5 ${className}`}>
      <div 
        className={`${color} h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg shadow-current/50`} 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;