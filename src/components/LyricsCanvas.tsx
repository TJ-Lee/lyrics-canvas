import React, { useEffect, useRef } from 'react';
import { LayoutMode } from '@/lib/types';
import { LyricsData } from '@/models/LyricsData';
import { CanvasSettings } from '@/models/CanvasSettings';
import canvasManager from '@/services/CanvasManager';
import exportManager from '@/services/ExportManager';
import { DebugInfo } from './DebugInfo';

interface LyricsCanvasProps {
  lyricsData: LyricsData;
  settings: CanvasSettings;
  mode: LayoutMode;
  className?: string;
}

export function LyricsCanvas({ lyricsData, settings, mode, className = '' }: LyricsCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas manager and export manager setup
  useEffect(() => {
    canvasManager.updateLyrics(lyricsData);
    canvasManager.updateSettings(settings);

    if (containerRef.current) {
      exportManager.setCanvasRef(containerRef);
      
      const rect = containerRef.current.getBoundingClientRect();
      const exportWidth = mode === LayoutMode.PORTRAIT ? 1080 : 1920;
      const screenWidth = rect.width;
      const scaleFactor = screenWidth > 0 ? exportWidth / screenWidth : 1;
      
      const exportSettings = new CanvasSettings({
        ...settings.toJSON(),
        titleFontSize: Math.round(settings.titleFontSize * scaleFactor),
        contentFontSize: Math.round(settings.contentFontSize * scaleFactor),
        // Keep zoom at 1 for exported image, as scaling is handled by resolution
        zoom: 1,
      });
      exportManager.updateSettings(exportSettings);
    }
  }, [lyricsData, settings, mode]);

  // Get container classes based on layout mode
  const getContainerClasses = () => {
    const baseClasses = 'relative mx-auto bg-transparent lyrics-canvas-container';
    return mode === LayoutMode.PORTRAIT
      ? `${baseClasses} portrait-canvas`
      : `${baseClasses} landscape-canvas`;
  };

  // Set fixed container styles to maintain aspect ratio
  const getContainerStyles = (): React.CSSProperties => {
    return {
      width: '100%',
      aspectRatio: mode === LayoutMode.PORTRAIT ? '9 / 16' : '16 / 9',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };
  };

  // Apply settings to the inner canvas div
  const getCanvasStyles = (): React.CSSProperties => {
    return {
      backgroundColor: settings.backgroundColor,
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
      // Apply the zoom setting
      transform: `scale(${settings.zoom})`,
      transformOrigin: 'center center',
      transition: 'transform 0.2s ease-in-out',
    };
  };

  // Text alignment helpers
  const getTitleAlignmentClass = () => {
    return `text-${settings.titleAlignment}`;
  };

  const getContentAlignmentClass = () => {
    return `text-${settings.contentAlignment}`;
  };

  return (
    <>
      <div 
        ref={containerRef}
        className={`${getContainerClasses()} ${className}`}
        style={getContainerStyles()}
      >
        <div
          ref={canvasRef}
          className="lyrics-canvas-inner w-full h-full"
          style={getCanvasStyles()}
        >
          {lyricsData.title && (
            <div 
              className={`lyrics-title w-full ${getTitleAlignmentClass()}`}
              style={{
                fontFamily: `'${settings.titleFontFamily}', sans-serif`,
                fontSize: `${settings.titleFontSize}px`,
                color: settings.textColor,
                marginBottom: '2rem',
                fontWeight: 700,
                whiteSpace: 'pre-wrap',
              }}
            >
              {lyricsData.title}
            </div>
          )}
          
          {lyricsData.content && (
            <div
              className={`lyrics-content w-full ${getContentAlignmentClass()}`}
              style={{
                fontFamily: `'${settings.bodyFontFamily}', sans-serif`,
                fontSize: `${settings.contentFontSize}px`,
                lineHeight: settings.lineSpacing,
                color: settings.textColor,
                whiteSpace: 'pre-wrap',
              }}
            >
              {lyricsData.content}
            </div>
          )}
          
          {lyricsData.author && (
            <div
              className="lyrics-author"
              style={{
                fontFamily: `'${settings.bodyFontFamily}', sans-serif`,
                fontSize: `${settings.contentFontSize * 0.8}px`,
                color: settings.textColor,
                marginTop: '2rem',
                opacity: 0.8,
                alignSelf: 'flex-end',
              }}
            >
              - {lyricsData.author}
            </div>
          )}
        </div>
      </div>
      
      <DebugInfo canvasRef={containerRef} mode={mode} />
    </>
  );
}
