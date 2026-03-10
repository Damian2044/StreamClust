import React, { useState } from 'react';
import { useError } from '../hooks/useError';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

function ErrorNotification() {
  const { errors, removeError } = useError();

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex max-h-[calc(100vh-2rem)] flex-col gap-2 overflow-y-auto pr-1 sm:w-[36rem] max-w-[calc(100vw-2rem)]">
      {errors.map((error) => (
        <ErrorItem key={error.id} error={error} onRemove={removeError} />
      ))}
    </div>
  );
}

function ErrorItem({ error, onRemove }) {
  const [isVisible, setIsVisible] = useState(true);

  const getStyles = () => {
    switch (error.type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          text: 'text-green-800',
          Icon: CheckCircleIcon,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800',
          Icon: ExclamationTriangleIcon,
        };
      default: // error
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800',
          Icon: ExclamationCircleIcon,
        };
    }
  };

  const styles = getStyles();
  const { Icon } = styles;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onRemove(error.id);
    }, 300);
  };

  return (
    <div
      className={`
        w-full overflow-hidden flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${styles.bg} ${styles.border} ${styles.text}
        animate-in fade-in slide-in-from-right-4 duration-300
        ${!isVisible && 'animate-out fade-out slide-out-to-right-4 duration-300'}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium whitespace-pre-wrap break-words leading-5">
          {error.message}
        </div>
        {error.details && (
          <div className="text-xs mt-1 opacity-75 whitespace-pre-wrap break-words leading-5">
            {error.details}
          </div>
        )}
      </div>
      <button
        onClick={handleClose}
        className={`flex-shrink-0 rounded hover:bg-black/10 p-1 transition-colors`}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ErrorNotification;
