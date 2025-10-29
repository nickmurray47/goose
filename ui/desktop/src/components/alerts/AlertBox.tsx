import React, { useState, useEffect } from 'react';
import { IoIosCloseCircle, IoIosWarning, IoIosInformationCircle } from 'react-icons/io';
import { FaPencilAlt, FaSave } from 'react-icons/fa';
import { cn } from '../../utils';
import { Alert, AlertType } from './types';
import { upsertConfig } from '../../api';
import { useConfig } from '../ConfigContext';

const alertIcons: Record<AlertType, React.ReactNode> = {
  [AlertType.Error]: <IoIosCloseCircle className="h-5 w-5" />,
  [AlertType.Warning]: <IoIosWarning className="h-5 w-5" />,
  [AlertType.Info]: <IoIosInformationCircle className="h-5 w-5" />,
};

interface AlertBoxProps {
  alert: Alert;
  className?: string;
  compactButtonEnabled?: boolean;
}

const alertStyles: Record<AlertType, string> = {
  [AlertType.Error]: 'bg-[#d7040e] text-white',
  [AlertType.Warning]: 'bg-[#cc4b03] text-white',
  [AlertType.Info]: 'dark:bg-white dark:text-black bg-black text-white',
};

export const AlertBox = ({ alert, className }: AlertBoxProps) => {
  const { read } = useConfig();
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [loadedThreshold, setLoadedThreshold] = useState<number | null>(null);
  const [thresholdValue, setThresholdValue] = useState(
    alert.autoCompactThreshold ? Math.max(1, Math.round(alert.autoCompactThreshold * 100)) : 80
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadThreshold = async () => {
      try {
        const threshold = await read('GOOSE_AUTO_COMPACT_THRESHOLD', false);
        if (threshold !== undefined && threshold !== null) {
          setLoadedThreshold(threshold as number);
          setThresholdValue(Math.max(1, Math.round((threshold as number) * 100)));
        }
      } catch (err) {
        console.error('Error fetching auto-compact threshold:', err);
      }
    };

    loadThreshold();
  }, [read]);

  const currentThreshold = loadedThreshold !== null ? loadedThreshold : alert.autoCompactThreshold;

  const handleSaveThreshold = async () => {
    if (isSaving) return; // Prevent double-clicks

    let validThreshold = Math.max(1, Math.min(100, thresholdValue));
    if (validThreshold !== thresholdValue) {
      setThresholdValue(validThreshold);
    }

    setIsSaving(true);
    try {
      const newThreshold = validThreshold / 100; // Convert percentage to decimal

      await upsertConfig({
        body: {
          key: 'GOOSE_AUTO_COMPACT_THRESHOLD',
          value: newThreshold,
          is_secret: false,
        },
      });

      setIsEditingThreshold(false);
      setLoadedThreshold(newThreshold);

      // Notify parent component of the threshold change
      if (alert.onThresholdChange) {
        alert.onThresholdChange(newThreshold);
      }
    } catch (error) {
      console.error('Error saving threshold:', error);
      window.alert(
        `Failed to save threshold: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn('flex flex-col gap-2 px-3 py-3', alertStyles[alert.type], className)}
      onMouseDown={(e) => {
        // Prevent popover from closing when clicking inside the alert box
        if (isEditingThreshold) {
          e.stopPropagation();
        }
      }}
    >
      {alert.progress ? (
        <div className="flex flex-col gap-2">
          <span className="text-[11px]">{alert.message}</span>

          {/* Auto-compact threshold indicator with edit */}
          {currentThreshold !== undefined && (
            <div className="flex items-center justify-center gap-1 min-h-[20px]">
              {isEditingThreshold ? (
                <>
                  <span className="text-[10px] opacity-70">Auto compact at</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={thresholdValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      // Allow empty input for easier editing
                      if (e.target.value === '') {
                        setThresholdValue(1);
                      } else if (!isNaN(val)) {
                        // Clamp value between 1 and 100
                        setThresholdValue(Math.max(1, Math.min(100, val)));
                      }
                    }}
                    onBlur={(e) => {
                      // On blur, ensure we have a valid value
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val < 1) {
                        setThresholdValue(1);
                      } else if (val > 100) {
                        setThresholdValue(100);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveThreshold();
                      } else if (e.key === 'Escape') {
                        setIsEditingThreshold(false);
                        const resetValue = currentThreshold
                          ? Math.round(currentThreshold * 100)
                          : 80;
                        setThresholdValue(Math.max(1, resetValue));
                      }
                    }}
                    onFocus={(e) => {
                      // Select all text on focus for easier editing
                      e.target.select();
                    }}
                    onClick={(e) => {
                      // Prevent issues with text selection
                      e.stopPropagation();
                    }}
                    className="w-12 px-1 text-[10px] bg-white/10 border border-current/30 rounded outline-none text-center focus:bg-white/20 focus:border-current/50 transition-colors"
                    disabled={isSaving}
                    autoFocus
                  />
                  <span className="text-[10px] opacity-70">%</span>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveThreshold();
                    }}
                    disabled={isSaving}
                    className="p-1 hover:opacity-60 transition-opacity cursor-pointer relative z-50"
                    style={{ minWidth: '20px', minHeight: '20px', pointerEvents: 'auto' }}
                  >
                    <FaSave className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[10px] opacity-70">
                    Auto compact at {Math.round(currentThreshold * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditingThreshold(true);
                    }}
                    className="p-1 hover:opacity-60 transition-opacity cursor-pointer relative z-10"
                    style={{ minWidth: '20px', minHeight: '20px' }}
                  >
                    <FaPencilAlt className="w-3 h-3 opacity-70" />
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between w-full relative">
            {(() => {
              let closestDotIndex = -1;
              if (currentThreshold !== undefined && currentThreshold > 0 && currentThreshold <= 1) {
                let minDistance = Infinity;
                for (let j = 0; j < 30; j++) {
                  const dotPos = j / 29;
                  const distance = Math.abs(dotPos - currentThreshold);
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestDotIndex = j;
                  }
                }
              }

              return [...Array(30)].map((_, i) => {
                const progress = alert.progress!.current / alert.progress!.total;
                const progressPercentage = Math.round(progress * 100);
                const dotPosition = i / 29; // 0 to 1 range for 30 dots
                const isActive = dotPosition <= progress;
                const isThresholdDot = i === closestDotIndex;

                const getProgressColor = () => {
                  if (progressPercentage <= 50) {
                    return 'bg-green-500';
                  } else if (progressPercentage <= 75) {
                    return 'bg-yellow-500';
                  } else if (progressPercentage <= 90) {
                    return 'bg-orange-500';
                  } else {
                    return 'bg-red-500';
                  }
                };

                const progressColor = getProgressColor();
                const inactiveColor = 'bg-gray-300 dark:bg-gray-600';

                return (
                  <div
                    key={i}
                    className={cn(
                      'rounded-full transition-all relative',
                      isThresholdDot
                        ? 'h-[6px] w-[6px] -mt-[2px]' // Make threshold dot twice as large
                        : 'h-[2px] w-[2px]',
                      isActive ? progressColor : inactiveColor
                    )}
                  />
                );
              });
            })()}
          </div>
          <div className="flex justify-between items-baseline text-[11px]">
            <div className="flex gap-1 items-baseline">
              <span className={'dark:text-black/60 text-white/60'}>
                {alert.progress!.current >= 1000
                  ? (alert.progress!.current / 1000).toFixed(1) + 'k'
                  : alert.progress!.current}
              </span>
              <span className={'dark:text-black/40 text-white/40'}>
                {Math.round((alert.progress!.current / alert.progress!.total) * 100)}%
              </span>
            </div>
            <span className={'dark:text-black/60 text-white/60'}>
              {alert.progress!.total >= 1000
                ? (alert.progress!.total / 1000).toFixed(0) + 'k'
                : alert.progress!.total}
            </span>
          </div>
          {alert.showCompactButton && alert.onCompact && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alert.onCompact!();
              }}
              disabled={alert.compactButtonDisabled}
              className={cn(
                'flex items-center gap-1.5 text-[11px] outline-none mt-1',
                alert.compactButtonDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-80 cursor-pointer'
              )}
            >
              {alert.compactIcon}
              <span>Compact now</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">{alertIcons[alert.type]}</div>
            <div className="flex flex-col gap-2 flex-1">
              <span className="text-[11px] break-words whitespace-pre-line">{alert.message}</span>
              {alert.action && (
                <a
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert.action?.onClick();
                  }}
                  className="text-[11px] text-left underline hover:opacity-80 cursor-pointer outline-none"
                >
                  {alert.action.text}
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
