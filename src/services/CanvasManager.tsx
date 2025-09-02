import React, { createRef, RefObject } from 'react';
import { LyricsData } from '@/models/LyricsData';
import { CanvasSettings } from '@/models/CanvasSettings';
import { LayoutMode, Dimensions } from '@/lib/types';
import { calculateOptimalFontSize, getTextAlignmentClass, formatTextLines } from '@/lib/utils';

class CanvasManager {
  private lyrics: LyricsData;
  private canvasRef: RefObject<HTMLDivElement>;
  private canvasSettings: CanvasSettings;

  constructor() {
    this.lyrics = new LyricsData();
    this.canvasRef = createRef<HTMLDivElement>();
    this.canvasSettings = new CanvasSettings();
  }

  // Canvas 참조 반환
  getCanvasRef(): RefObject<HTMLDivElement> {
    return this.canvasRef;
  }

  // 캔버스 생성 (새 캔버스 엘리먼트 생성)
  createCanvas(mode: LayoutMode): HTMLDivElement {
    const dimensions = this.canvasSettings.getDimensions(mode);
    const canvas = document.createElement('div');
    
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    canvas.style.backgroundColor = this.canvasSettings.backgroundColor;
    canvas.style.position = 'relative';
    canvas.style.overflow = 'hidden';
    
    return canvas;
  }

  // 가사 데이터 업데이트
  updateLyrics(data: LyricsData): void {
    this.lyrics = data;
    this.lyrics.updatedAt = new Date();
  }

  // 캔버스 설정 업데이트
  updateSettings(settings: CanvasSettings): void {
    this.canvasSettings = settings;
  }

  // 현재 가사 데이터 반환
  getLyrics(): LyricsData {
    return this.lyrics;
  }

  // 현재 캔버스 설정 반환
  getSettings(): CanvasSettings {
    return this.canvasSettings;
  }

  // 텍스트 자동 포맷팅 (레이아웃 모드에 맞게)
  formatText(mode: LayoutMode): string {
    const dimensions = this.canvasSettings.getDimensions(mode);
    const { content } = this.lyrics;
    
    if (!content || content.trim() === '') {
      return '';
    }

    // 최적 폰트 크기 계산
    const optimalFontSize = this.calculateOptimalFontSize(content, dimensions);
    
    // 텍스트 줄바꿈 및 포맷팅
    const containerWidth = dimensions.width * 0.8; // 80% 너비 사용
    const lines = formatTextLines(content, containerWidth, optimalFontSize);
    
    return lines.join('\n');
  }

  // 최적 폰트 크기 계산 (컨테이너 크기 기반)
  calculateOptimalFontSize(text: string, containerDimensions: Dimensions): number {
    const { width, height } = containerDimensions;
    const containerWidth = width * 0.8; // 컨테이너의 80%만 사용
    const containerHeight = height * 0.7; // 컨테이너의 70%만 사용 (제목 공간 확보)
    
    const maxFontSize = 72;
    const minFontSize = 18;
    
    return calculateOptimalFontSize(
      text,
      containerWidth,
      containerHeight,
      maxFontSize,
      minFontSize
    );
  }

  // 캔버스 렌더링 (React 컴포넌트 반환)
  render(mode: LayoutMode): JSX.Element {
    const dimensions = this.canvasSettings.getDimensions(mode);
    const titleAlignClass = getTextAlignmentClass(this.canvasSettings.titleAlignment);
    const contentAlignClass = getTextAlignmentClass(this.canvasSettings.contentAlignment);
    
    const containerStyle: React.CSSProperties = {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      backgroundColor: this.canvasSettings.backgroundColor,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
    };
    
    const titleStyle: React.CSSProperties = {
      fontFamily: this.canvasSettings.fontFamily,
      fontSize: `${this.canvasSettings.titleFontSize}px`, // Use dedicated title font size
      color: this.canvasSettings.textColor,
      marginBottom: '2rem',
      width: '100%',
      textAlign: this.canvasSettings.titleAlignment,
    };
    
    const contentStyle: React.CSSProperties = {
      fontFamily: this.canvasSettings.fontFamily,
      fontSize: `${this.canvasSettings.contentFontSize}px`, // Use dedicated content font size
      lineHeight: `${this.canvasSettings.lineSpacing}`,
      color: this.canvasSettings.textColor,
      width: '100%',
      whiteSpace: 'pre-wrap',
      textAlign: this.canvasSettings.contentAlignment,
    };

    const formattedContent = this.formatText(mode);
    
    return (
      <div ref={this.canvasRef} style={containerStyle} className="lyrics-canvas">
        {this.lyrics.title && (
          <div style={titleStyle} className={`lyrics-title ${titleAlignClass}`}>
            {this.lyrics.title}
          </div>
        )}
        <div style={contentStyle} className={`lyrics-content ${contentAlignClass}`}>
          {formattedContent}
        </div>
        {this.lyrics.author && (
          <div style={{ 
            fontFamily: this.canvasSettings.fontFamily,
            fontSize: `${this.canvasSettings.contentFontSize * 0.8}px`, // Base author size on content font size
            color: this.canvasSettings.textColor,
            marginTop: '2rem',
            opacity: 0.8,
            alignSelf: 'flex-end',
          }}>
            - {this.lyrics.author}
          </div>
        )}
      </div>
    );
  }
}

// Create a singleton instance
const canvasManager = new CanvasManager();
export default canvasManager;