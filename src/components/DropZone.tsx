import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface DropZoneProps {
  onFileLoad: (gpxString: string, fileName: string) => void;
}

export default function DropZone({ onFileLoad }: DropZoneProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      setError(null);
      if (!file || !file.name.toLowerCase().endsWith('.gpx')) {
        setError(t('dropzone.invalidFile'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => onFileLoad(e.target?.result as string, file.name.replace(/\.gpx$/i, ''));
      reader.readAsText(file);
    },
    [onFileLoad, t]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={t('dropzone.title')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        aria-label={t('dropzone.subtitle')}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      <img className="dropzone__icon" src="/favicon.svg" alt="" aria-hidden="true" />
      <p className="dropzone__title">{t('dropzone.title')}</p>
      <p className="dropzone__subtitle">{t('dropzone.subtitle')}</p>
      {error && <p className="dropzone__error">{error}</p>}
    </div>
  );
}
