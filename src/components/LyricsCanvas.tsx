import React, { useEffect, useRef, useState } from 'react';
import { LayoutMode } from '@/lib/types';
import { LyricsData } from '@/models/LyricsData';
import { CanvasSettings } from '@/models/CanvasSettings';
import canvasManager from '@/services/CanvasManager';
import exportManager from '@/services/ExportManager';
import { calculateOptimalFontSize } from '@/lib/utils';
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
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [responsiveFontSizes, setResponsiveFontSizes] = useState({
    title: settings.titleFontSize,
    content: settings.contentFontSize
  });

  // Recalculate responsive font sizes when dimensions or content changes
  useEffect(() => {
    const calculateFontSizes = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const titleLength = lyricsData.title?.length || 0;
      const contentLength = lyricsData.content?.length || 0;
      const contentLines = (lyricsData.content?.split('\n').length || 0) + 1;
      
      // Get available space for text
      const availableWidth = containerRect.width * 0.8; // 80% of width for margins
      const availableHeight = containerRect.height * 0.7; // 70% of height for other elements
      
      // Base font sizes depending on mode
      let baseTitleSize = mode === LayoutMode.PORTRAIT ? 36 : 48;
      let baseContentSize = mode === LayoutMode.PORTRAIT ? 24 : 32;
      
      // Adjust font size based on content length and available space
      let optimalContentSize = baseContentSize;
      let optimalTitleSize = baseTitleSize;
      
      // If content is long, reduce font size to fit
      if (contentLines > availableHeight / (baseContentSize * settings.lineSpacing)) {
        optimalContentSize = Math.floor(availableHeight / (contentLines * settings.lineSpacing));
      }
      
      // Ensure title fits in width
      if (titleLength > 0) {
        const titleWidthFactor = availableWidth / (titleLength * 0.5); // Rough estimate of character width
        optimalTitleSize = Math.min(baseTitleSize, titleWidthFactor);
        
        // Check for line wrapping and adjust if last line has 3 or fewer characters
        const titleText = lyricsData.title || '';
        const titleWords = titleText.split(' ');
        let currentLine = '';
        let lines = [];
        for (const word of titleWords) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const testWidth = testLine.length * (optimalTitleSize * 0.5); // Rough width estimate
          if (testWidth < availableWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
        
        if (lines.length > 1) {
          const lastLine = lines[lines.length - 1];
          // 세로 모드에서는 한 글자라도 줄바꿈되면 크기를 줄임
          if (mode === LayoutMode.PORTRAIT || lastLine.length <= 3) {
            // Reduce font size to try to fit in one line
            optimalTitleSize = Math.min(optimalTitleSize, availableWidth / (titleText.length * 0.5));
          }
        }
      }
      
      // Keep user settings if they are smaller
      if (settings.titleFontSize < optimalTitleSize) {
        optimalTitleSize = settings.titleFontSize;
      }
      if (settings.contentFontSize < optimalContentSize) {
        optimalContentSize = settings.contentFontSize;
      }
      
      // Set minimum readable sizes
      optimalTitleSize = Math.max(optimalTitleSize, mode === LayoutMode.PORTRAIT ? 24 : 32);
      optimalContentSize = Math.max(optimalContentSize, mode === LayoutMode.PORTRAIT ? 16 : 20);
      
      setResponsiveFontSizes({
        title: Math.round(optimalTitleSize),
        content: Math.round(optimalContentSize)
      });
      
      setCanvasDimensions({
        width: containerRect.width,
        height: containerRect.height
      });
      
      console.log('Calculated font sizes:', {
        mode: mode === LayoutMode.PORTRAIT ? 'Portrait' : 'Landscape',
        titleSize: Math.round(optimalTitleSize),
        contentSize: Math.round(optimalContentSize),
        contentLines: contentLines,
        availableHeight: availableHeight,
        containerWidth: containerRect.width
      });
    };
    
    calculateFontSizes();
    
    // Add resize observer to recalculate on container size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateFontSizes();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [lyricsData, settings.titleFontSize, settings.contentFontSize, settings.lineSpacing, mode]);

  // Canvas manager and export manager setup
  useEffect(() => {
    canvasManager.updateLyrics(lyricsData);
    canvasManager.updateSettings(settings);

    // Use containerRef instead of canvasRef.parentElement
    if (containerRef.current) {
      // Pass the container reference directly to ensure proper canvas export
      exportManager.setCanvasRef(containerRef);
      
      // Force the correct aspect ratio as a safeguard
      if (mode === LayoutMode.PORTRAIT) {
        const width = containerRef.current.offsetWidth;
        const expectedHeight = Math.round(width * (16/9)); // For 9:16 ratio
        
        // Enforce correct height if it doesn't match expected height
        if (Math.abs(containerRef.current.offsetHeight - expectedHeight) > 2) { // Allow 2px tolerance
          console.log('⚠️ Correcting height to maintain 9:16 ratio');
          containerRef.current.style.height = `${expectedHeight}px`;
          containerRef.current.style.minHeight = `${expectedHeight}px`;
          containerRef.current.style.maxHeight = `${expectedHeight}px`;
        }
      }
      
      const rect = containerRef.current.getBoundingClientRect();
      console.log('Container dimensions:', { 
        width: rect.width, 
        height: rect.height, 
        ratio: rect.width / rect.height,
        expected: mode === LayoutMode.PORTRAIT ? '9:16' : '16:9',
        titleFontSize: responsiveFontSizes.title,
        contentFontSize: responsiveFontSizes.content
      });
      
      // Adjust font sizes for export based on screen size ratio
      const exportWidth = mode === LayoutMode.PORTRAIT ? 1080 : 1920; // Standard export dimensions
      const screenWidth = rect.width;
      const scaleFactor = exportWidth / screenWidth;
      const exportSettings = new CanvasSettings({
        ...settings.toJSON(),
        titleFontSize: Math.round(settings.titleFontSize * scaleFactor),
        contentFontSize: Math.round(settings.contentFontSize * scaleFactor)
      });
      exportManager.updateSettings(exportSettings);
      console.log('Export font sizes:', {
        titleFontSize: exportSettings.titleFontSize,
        contentFontSize: exportSettings.contentFontSize,
        scaleFactor: scaleFactor
      });
    }
  }, [lyricsData, settings, mode, responsiveFontSizes]);

  // Get container classes
  const getContainerClasses = () => {
    const baseClasses = 'relative mx-auto bg-transparent lyrics-canvas-container';
    return mode === LayoutMode.PORTRAIT
      ? `${baseClasses} portrait-canvas`
      : `${baseClasses} landscape-canvas`;
  };

  // Container style calculation with exact dimensions
  const getContainerStyles = () => {
    if (mode === LayoutMode.PORTRAIT) {
      // Exact 9:16 ratio for portrait mode (width:height = 9:16)
      const width = 300;
      // For 9:16 ratio, height should be width * (16/9)
      const height = Math.round(width * (16/9)); // 533px for width=300px

      // Use strict dimensions for portrait mode
      return {
        width: `${width}px`,
        height: `${height}px`,
        margin: '0 auto',
        overflow: 'hidden', // Ensure no content overflow affects ratio
        minHeight: `${height}px`, // Prevent shrinking
        maxHeight: `${height}px`, // Prevent growing
      };
    } else {
      // Landscape mode (16:9)
      return {
        width: '100%',
        maxWidth: '853px',
        aspectRatio: '16/9',
        maxHeight: 'calc(100vh - 160px)',
        overflow: 'hidden',
      };
    }
  };

  // Canvas inner style
  const getCanvasStyles = () => {
    const { backgroundColor } = settings;
    return {
      backgroundColor,
      width: '100%',
      height: '100%',
      position: 'relative' as const,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
    };
  };

  // Text alignment helpers
  const getTitleAlignmentClass = () => {
    switch (settings.titleAlignment) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      default: return 'text-center';
    }
  };

  const getContentAlignmentClass = () => {
    switch (settings.contentAlignment) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      default: return 'text-center';
    }
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
          <div 
            className={`lyrics-title w-full ${getTitleAlignmentClass()}`}
            style={{
              fontFamily: settings.fontFamily,
              fontSize: `${responsiveFontSizes.title}px`,
              color: settings.textColor,
              marginBottom: '2rem',
              fontWeight: 700,
              transition: 'font-size 0.2s ease-in-out', // Smooth font size transitions
            }}
          >
            {lyricsData.title}
          </div>
          
          <div
            className={`lyrics-content w-full ${getContentAlignmentClass()}`}
            style={{
              fontFamily: settings.fontFamily,
              fontSize: `${responsiveFontSizes.content}px`,
              lineHeight: `${settings.lineSpacing}`,
              color: settings.textColor,
              whiteSpace: 'pre-wrap',
              transition: 'font-size 0.2s ease-in-out', // Smooth font size transitions
            }}
          >
            {lyricsData.content}
          </div>
          
          {lyricsData.author && (
            <div
              className="lyrics-author"
              style={{
                fontFamily: settings.fontFamily,
                fontSize: `${responsiveFontSizes.content * 0.8}px`, // Base author size on content
                color: settings.textColor,
                marginTop: '2rem',
                opacity: 0.8,
                alignSelf: 'flex-end',
                transition: 'font-size 0.2s ease-in-out', // Smooth font size transitions
              }}
            >
              - {lyricsData.author}
            </div>
          )}
        </div>
      </div>
      
      {/* Debug overlay to show actual dimensions */}
      <DebugInfo canvasRef={containerRef} mode={mode} />
    </>
  );
}
