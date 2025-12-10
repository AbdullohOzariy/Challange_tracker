import React, { useEffect, useState } from 'react';

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, children, maxWidth = 'max-w-lg' }) => {
  const [show, setShow] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      setTimeout(() => setShow(false), 300);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>
      <div
        className={`bg-slate-900 border border-slate-700 rounded-[2rem] w-full ${maxWidth} shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out text-slate-100 ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;

