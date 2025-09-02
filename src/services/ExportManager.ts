import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { formatDate } from '@/lib/utils';
import { ImageFormat, LayoutMode } from '@/lib/types';
import canvasManager from './CanvasManager';
import { CanvasSettings } from '@/models/CanvasSettings';

class ExportManager {
  private canvasRef: React.RefObject<HTMLDivElement> | null = null;
  private isCanvasRefValid = false;
  private settings: CanvasSettings | null = null;

  setCanvasRef(ref: React.RefObject<HTMLDivElement>) {
    this.canvasRef = ref;
    this.isCanvasRefValid = !!ref?.current;
    console.log('Canvas reference set:', { 
      hasRef: !!ref, 
      hasCurrent: !!ref?.current,
      isValid: this.isCanvasRefValid,
      classes: ref?.current?.className
    });
  }

  // Check if we have a valid canvas reference
  hasValidCanvasRef(): boolean {
    // Update status before checking
    this.isCanvasRefValid = !!this.canvasRef?.current;
    return this.isCanvasRefValid;
  }

  // Update settings for export
  updateSettings(settings: CanvasSettings) {
    this.settings = settings;
  }

  /**
   * 여러 전략을 사용하여 이미지를 내보냅니다.
   * 주 전략이 실패할 경우 대체 전략으로 전환합니다.
   */
  async exportAsImage(format: ImageFormat = ImageFormat.PNG, layoutMode?: LayoutMode): Promise<string> {
    console.log('=== 이미지 내보내기 시작 ===', new Date().toISOString());
    console.log('브라우저 정보:', navigator.userAgent);
    
    try {
      // 전략 #1: html2canvas 사용
      try {
        const dataURL = await this.exportWithHtml2Canvas(format, layoutMode);
        return dataURL;
      } catch (html2canvasError) {
        console.error('전략 #1 (html2canvas) 실패:', html2canvasError);
        console.log('대체 전략 시도 중...');
        
        // 전략 #2: Canvas API 직접 사용
        try {
          const dataURL = await this.exportWithCanvasAPI(format, layoutMode);
          return dataURL;
        } catch (canvasApiError) {
          console.error('전략 #2 (Canvas API) 실패:', canvasApiError);
          console.log('마지막 대체 전략 시도 중...');
          
          // 전략 #3: 더 단순한 DOM-to-Canvas 접근법
          try {
            const dataURL = await this.exportWithSimplifiedCanvas(format, layoutMode);
            return dataURL;
          } catch (simpleCanvasError) {
            console.error('전략 #3 (단순 Canvas) 실패:', simpleCanvasError);
            throw new Error('모든 내보내기 전략 실패');
          }
        }
      }
    } catch (error) {
      console.error('이미지 내보내기 프로세스 오류:', error);
      
      // 자세한 오류 메시지 반환
      let errorMessage = '이미지 생성 중 문제가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = `이미지 내보내기 실패: ${error.message}`;
      }
      
      // 문제 해결 팁 추가
      errorMessage += ' (브라우저 문제일 수 있습니다. 다른 브라우저를 시도하거나, 이미지 크기를 줄여보세요.)';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * 전략 #1: html2canvas 라이브러리를 사용하여 DOM을 이미지로 변환
   */
  private async exportWithHtml2Canvas(format: ImageFormat = ImageFormat.PNG, layoutMode?: LayoutMode): Promise<string> {
    console.log('HTML2Canvas 전략으로 내보내기 시작');
    
    if (!this.canvasRef?.current) {
      console.error('Canvas reference is null or undefined');
      throw new Error('Canvas reference is not set.');
    }
    
    // 레이아웃 모드 결정
    const currentMode = layoutMode || 
      (this.canvasRef.current.closest('.portrait-canvas') 
        ? LayoutMode.PORTRAIT 
        : LayoutMode.LANDSCAPE);

    console.log('레이아웃 모드:', currentMode, currentMode === LayoutMode.PORTRAIT ? '세로 모드' : '가로 모드');
    
    // 치수 설정
    const dimensions = currentMode === LayoutMode.PORTRAIT
      ? { width: 1080, height: 1920 } // Exact 9:16 ratio
      : { width: 1920, height: 1080 }; // Exact 16:9 ratio
    
    console.log('내보내기 치수:', dimensions);
    
    // 설정 및 데이터 가져오기
    const settings = this.settings || canvasManager.getSettings();
    const lyricsData = canvasManager.getLyrics();
    
    // 내보내기용 컨테이너 생성
    const exportContainer = document.createElement('div');
    exportContainer.style.width = `${dimensions.width}px`;
    exportContainer.style.height = `${dimensions.height}px`;
    exportContainer.style.position = 'absolute';
    exportContainer.style.top = '-9999px';
    exportContainer.style.left = '-9999px';
    exportContainer.style.backgroundColor = settings.backgroundColor;
    exportContainer.style.display = 'flex';
    exportContainer.style.flexDirection = 'column';
    exportContainer.style.justifyContent = 'center';
    exportContainer.style.padding = '2rem';
    exportContainer.style.boxSizing = 'border-box';
    exportContainer.style.zIndex = '-1'; // 보이지 않게 설정
    
    // 제목 요소 생성
    const titleDiv = document.createElement('div');
    titleDiv.className = 'lyrics-title';
    titleDiv.textContent = lyricsData.title || '';
    titleDiv.style.fontFamily = settings.fontFamily;
    titleDiv.style.fontSize = `${settings.titleFontSize}px`;
    titleDiv.style.color = settings.textColor;
    titleDiv.style.marginBottom = '2rem';
    titleDiv.style.width = '100%';
    
    // 제목 정렬 설정
    switch (settings.titleAlignment) {
      case 'left': titleDiv.style.textAlign = 'left'; break;
      case 'right': titleDiv.style.textAlign = 'right'; break;
      default: titleDiv.style.textAlign = 'center';
    }
    
    // 본문 요소 생성
    const contentDiv = document.createElement('div');
    contentDiv.className = 'lyrics-content';
    contentDiv.textContent = lyricsData.content || '';
    contentDiv.style.fontFamily = settings.fontFamily;
    contentDiv.style.fontSize = `${settings.contentFontSize}px`;
    contentDiv.style.lineHeight = `${settings.lineSpacing}`;
    contentDiv.style.color = settings.textColor;
    contentDiv.style.whiteSpace = 'pre-wrap';
    contentDiv.style.width = '100%';
    
    // 본문 정렬 설정
    switch (settings.contentAlignment) {
      case 'left': contentDiv.style.textAlign = 'left'; break;
      case 'right': contentDiv.style.textAlign = 'right'; break;
      default: contentDiv.style.textAlign = 'center';
    }
    
    // 작가 요소 생성
    let authorDiv;
    if (lyricsData.author) {
      authorDiv = document.createElement('div');
      authorDiv.className = 'lyrics-author';
      authorDiv.textContent = `- ${lyricsData.author}`;
      authorDiv.style.fontFamily = settings.fontFamily;
      authorDiv.style.fontSize = `${settings.contentFontSize * 0.8}px`;
      authorDiv.style.color = settings.textColor;
      authorDiv.style.marginTop = '2rem';
      authorDiv.style.opacity = '0.8';
      authorDiv.style.alignSelf = 'flex-end';
    }
    
    // 요소들을 컨테이너에 추가
    exportContainer.appendChild(titleDiv);
    exportContainer.appendChild(contentDiv);
    if (authorDiv) exportContainer.appendChild(authorDiv);
    
    console.log('내보내기용 DOM 요소 생성 완료');
    
    // DOM에 컨테이너 추가
    document.body.appendChild(exportContainer);
    
    try {
      // html2canvas 렌더링 실행
      console.log('html2canvas 호출 시작');
      
      const options = {
        backgroundColor: settings.backgroundColor,
        scale: 2,  // 더 나은 품질의 내보내기
        useCORS: true,
        allowTaint: true, // 외부 이미지 허용
        logging: true, // 디버깅을 위한 로깅 활성화
        width: dimensions.width,
        height: dimensions.height,
        windowWidth: dimensions.width,
        windowHeight: dimensions.height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      };
      
      console.log('html2canvas 옵션:', options);
      const canvas = await html2canvas(exportContainer, options);
      
      console.log('html2canvas 렌더링 완료, 캔버스 생성됨:', canvas.width, 'x', canvas.height);
      
      // 정리
      document.body.removeChild(exportContainer);
      console.log('내보내기 컨테이너 제거됨');

      // 캔버스에서 DataURL 가져오기
      const mime = this.getMimeType(format);
      console.log('MIME 타입:', mime);
      
      try {
        // 낮은 품질부터 시도하여 오류 방지
        const quality = 0.8;
        const dataURL = canvas.toDataURL(mime, quality);
        console.log('데이터 URL 생성 성공, 길이:', dataURL.length);
        console.log('HTML2Canvas 전략 성공');
        return dataURL;
      } catch (dataUrlError) {
        console.error('데이터 URL 생성 오류:', dataUrlError);
        
        // PNG로 폴백 시도
        try {
          console.log('PNG 형식으로 폴백 시도');
          const pngDataURL = canvas.toDataURL('image/png');
          console.log('PNG 데이터 URL 생성 성공');
          return pngDataURL;
        } catch (pngError) {
          console.error('PNG 폴백도 실패:', pngError);
          throw new Error('이미지 데이터 URL 생성에 실패했습니다.');
        }
      }
    } catch (canvasError) {
      console.error('html2canvas 렌더링 오류:', canvasError);
      
      // 정리 시도
      try {
        if (document.body.contains(exportContainer)) {
          document.body.removeChild(exportContainer);
        }
      } catch (cleanupError) {
        console.error('정리 중 오류:', cleanupError);
      }
      
      throw new Error('HTML2Canvas 이미지 렌더링 중 문제가 발생했습니다.');
    }
  }

  /**
   * 전략 #2: Canvas API를 직접 사용하여 텍스트 렌더링
   */
  private async exportWithCanvasAPI(format: ImageFormat = ImageFormat.PNG, layoutMode?: LayoutMode): Promise<string> {
    console.log('Canvas API 전략으로 내보내기 시작');
    
    if (!this.canvasRef?.current) {
      throw new Error('Canvas reference is not set.');
    }
    
    // 레이아웃 모드 결정
    const currentMode = layoutMode || 
      (this.canvasRef.current.closest('.portrait-canvas') 
        ? LayoutMode.PORTRAIT 
        : LayoutMode.LANDSCAPE);
    
    // 치수 설정 (메모리 문제 방지를 위해 더 작게 설정)
    const dimensions = currentMode === LayoutMode.PORTRAIT
      ? { width: 540, height: 960 } // 9:16 비율이지만 더 작은 크기
      : { width: 960, height: 540 }; // 16:9 비율이지만 더 작은 크기
    
    // 설정 및 데이터 가져오기
    const settings = this.settings || canvasManager.getSettings();
    const lyricsData = canvasManager.getLyrics();
    
    // Canvas 요소 생성
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D 컨텍스트를 생성할 수 없습니다.');
    }
    
    // 배경 채우기
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // 폰트 설정
    ctx.fillStyle = settings.textColor;
    ctx.textBaseline = 'top';
    
    // 패딩 설정
    const padding = dimensions.width * 0.05; // 5% 패딩
    const contentWidth = dimensions.width - (padding * 2);
    
    // 제목 렌더링
    const titleFontSize = settings.titleFontSize;
    ctx.font = `bold ${titleFontSize}px ${settings.fontFamily}`;
    
    // 제목 정렬
    let titleX = padding;
    ctx.textAlign = 'left';
    
    if (settings.titleAlignment === 'center') {
      titleX = dimensions.width / 2;
      ctx.textAlign = 'center';
    } else if (settings.titleAlignment === 'right') {
      titleX = dimensions.width - padding;
      ctx.textAlign = 'right';
    }
    
    // 제목 줄바꿈 처리
    const title = lyricsData.title || '';
    const wrappedTitle = this.wrapText(ctx, title, contentWidth);
    let titleY = padding;
    
    wrappedTitle.forEach(line => {
      ctx.fillText(line, titleX, titleY);
      titleY += titleFontSize * 1.2;
    });
    
    // 본문 렌더링
    const contentFontSize = settings.contentFontSize;
    ctx.font = `${contentFontSize}px ${settings.fontFamily}`;
    
    // 본문 정렬
    let contentX = padding;
    ctx.textAlign = 'left';
    
    if (settings.contentAlignment === 'center') {
      contentX = dimensions.width / 2;
      ctx.textAlign = 'center';
    } else if (settings.contentAlignment === 'right') {
      contentX = dimensions.width - padding;
      ctx.textAlign = 'right';
    }
    
    // 본문 시작 위치 (제목 이후)
    let contentY = titleY + padding;
    
    // 본문 줄바꿈 처리
    const content = lyricsData.content || '';
    const lineHeight = contentFontSize * settings.lineSpacing;
    const contentLines = content.split('\n');
    
    contentLines.forEach(paragraph => {
      const wrappedLines = this.wrapText(ctx, paragraph, contentWidth);
      
      wrappedLines.forEach(line => {
        ctx.fillText(line, contentX, contentY);
        contentY += lineHeight;
      });
      
      // 문단 사이의 추가 공간
      contentY += lineHeight * 0.5;
    });
    
    // 작가 렌더링
    if (lyricsData.author) {
      const authorFontSize = settings.contentFontSize * 0.8;
      ctx.font = `${authorFontSize}px ${settings.fontFamily}`;
      
      // 약간 투명하게
      ctx.globalAlpha = 0.8;
      
      const authorText = `- ${lyricsData.author}`;
      const authorMetrics = ctx.measureText(authorText);
      
      // 작가 이름은 항상 오른쪽 아래에 배치
      const authorY = dimensions.height - padding - authorFontSize;
      const authorX = dimensions.width - padding;
      
      ctx.textAlign = 'right';
      ctx.fillText(authorText, authorX, authorY);
      
      // 투명도 복원
      ctx.globalAlpha = 1.0;
    }
    
    try {
      // Canvas에서 데이터 URL 가져오기
      const mime = this.getMimeType(format);
      const dataURL = canvas.toDataURL(mime, 0.9);
      console.log('Canvas API 전략 성공');
      return dataURL;
    } catch (dataUrlError) {
      console.error('Canvas API에서 데이터 URL 생성 오류:', dataUrlError);
      
      // PNG로 폴백 시도
      try {
        const pngDataURL = canvas.toDataURL('image/png');
        return pngDataURL;
      } catch (pngError) {
        console.error('PNG 폴백도 실패:', pngError);
        throw new Error('Canvas API에서 이미지 생성에 실패했습니다.');
      }
    }
  }

  /**
   * 전략 #3: 더 단순한 DOM-to-Canvas 접근법
   */
  private async exportWithSimplifiedCanvas(format: ImageFormat = ImageFormat.PNG, layoutMode?: LayoutMode): Promise<string> {
    console.log('단순 Canvas 전략으로 내보내기 시작');
    
    if (!this.canvasRef?.current) {
      throw new Error('Canvas reference is not set.');
    }
    
    // 더 작은 크기로 설정
    const dimensions = { width: 400, height: 400 };
    if (layoutMode === LayoutMode.PORTRAIT) {
      dimensions.height = 711; // 9:16 비율에 맞춤
    } else {
      dimensions.width = 711; // 16:9 비율에 맞춤
    }
    
    // 설정 가져오기
    const settings = this.settings || canvasManager.getSettings();
    const lyricsData = canvasManager.getLyrics();
    
    try {
      // Canvas 요소 생성
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('2D 컨텍스트를 생성할 수 없습니다.');
      }
      
      // 배경 채우기
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 텍스트 설정
      ctx.fillStyle = settings.textColor;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      
      // 매우 단순화된 렌더링
      ctx.fillText(lyricsData.title || '제목 없음', canvas.width/2, 50);
      ctx.fillText((lyricsData.content || '').substring(0, 30) + '...', canvas.width/2, 100);
      
      if (lyricsData.author) {
        ctx.fillText(`- ${lyricsData.author}`, canvas.width/2, 150);
      }
      
      // 데이터 URL 생성 시도
      try {
        return canvas.toDataURL('image/png');
      } catch (pngError) {
        console.error('PNG 생성 실패:', pngError);
        
        // 마지막 수단: 빈 이미지 반환
        try {
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = 100;
          smallCanvas.height = 100;
          const smallCtx = smallCanvas.getContext('2d');
          if (smallCtx) {
            smallCtx.fillStyle = '#ffffff';
            smallCtx.fillRect(0, 0, 100, 100);
            smallCtx.fillStyle = '#000000';
            smallCtx.font = '10px Arial';
            smallCtx.textAlign = 'center';
            smallCtx.fillText('Error', 50, 50);
          }
          return smallCanvas.toDataURL('image/png');
        } catch (emptyError) {
          throw new Error('빈 이미지 생성에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('단순 Canvas 전략 실패:', error);
      throw new Error('단순 Canvas 접근법도 실패했습니다.');
    }
  }

  /**
   * 텍스트를 지정된 너비로 줄바꿈합니다.
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + word + ' ').width;
      
      if (width < maxWidth) {
        currentLine += word + ' ';
      } else {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }

  /**
   * 이미지를 저장합니다 - 다중 전략 및 폴백 접근법 사용
   */
  async saveImage(
    title: string = 'lyrics-canvas', 
    format: ImageFormat = ImageFormat.PNG,
    layoutMode?: LayoutMode
  ): Promise<void> {
    console.log('=== 이미지 저장 시작 ===', new Date().toISOString());
    console.log('브라우저 정보:', navigator.userAgent);
    console.log('파라미터:', { title, format, layoutMode });
    
    try {
      // Enhanced canvas reference validation
      if (!this.hasValidCanvasRef()) {
        console.error('Canvas reference validation failed', {
          hasRef: !!this.canvasRef,
          hasCurrent: !!this.canvasRef?.current,
        });
        
        // Attempt to get canvas via DOM as a fallback
        const canvasElements = document.querySelectorAll('.lyrics-canvas-container');
        if (canvasElements.length > 0) {
          console.log('Fallback: Found canvas via DOM selector, using first one:', canvasElements[0]);
          // @ts-ignore - Using DOM element directly as a fallback
          this.canvasRef = { current: canvasElements[0] as HTMLDivElement };
        } else {
          throw new Error('캔버스 참조가 설정되지 않았습니다. 브라우저를 새로고침하고 다시 시도해주세요.');
        }
      }
      
      // Determine the current mode more reliably
      const element = this.canvasRef?.current;
      if (!element) {
        console.error('Canvas reference is still missing after recovery attempt');
        throw new Error('캔버스 참조가 여전히 유효하지 않습니다.');
      }
      
      // Check if the element or its parent has the portrait-canvas class
      const isPortrait = element.classList.contains('portrait-canvas') || 
                         element.closest('.portrait-canvas') !== null;
      
      // Use provided layoutMode or detect from DOM
      const currentMode = layoutMode || (isPortrait ? LayoutMode.PORTRAIT : LayoutMode.LANDSCAPE);
      
      console.log('이미지 저장 모드:', currentMode, currentMode === LayoutMode.PORTRAIT ? '세로 모드' : '가로 모드');
      
      // 폴백 시스템: 여러 형식 및 접근법 시도
      let savedSuccessfully = false;
      let lastError: Error | null = null;
      
      // 첫 번째 시도: 요청된 형식으로 내보내기
      try {
        console.log(`${format} 형식으로 이미지 내보내기 시도...`);
        const blob = await this.getBlobWithFallbacks(title, format, currentMode);
        await this.saveBlob(blob, title, format);
        savedSuccessfully = true;
        console.log(`${format} 형식으로 이미지 저장 성공!`);
      } catch (primaryError) {
        console.error(`${format} 형식으로 저장 실패:`, primaryError);
        lastError = primaryError instanceof Error ? primaryError : new Error(String(primaryError));
        
        // PNG로 대체 시도
        if (format !== ImageFormat.PNG) {
          try {
            console.log('PNG 형식으로 대체 시도...');
            const pngBlob = await this.getBlobWithFallbacks(title, ImageFormat.PNG, currentMode);
            await this.saveBlob(pngBlob, title, ImageFormat.PNG);
            savedSuccessfully = true;
            console.log('PNG 형식으로 대체 저장 성공!');
          } catch (pngError) {
            console.error('PNG 대체 저장 실패:', pngError);
            lastError = pngError instanceof Error ? pngError : new Error(String(pngError));
          }
        }
        
        // JPEG로 마지막 시도
        if (!savedSuccessfully && format !== ImageFormat.JPEG) {
          try {
            console.log('JPEG 형식으로 최종 시도...');
            const jpegBlob = await this.getBlobWithFallbacks(title, ImageFormat.JPEG, currentMode);
            await this.saveBlob(jpegBlob, title, ImageFormat.JPEG);
            savedSuccessfully = true;
            console.log('JPEG 형식으로 대체 저장 성공!');
          } catch (jpegError) {
            console.error('JPEG 대체 저장 실패:', jpegError);
            lastError = jpegError instanceof Error ? jpegError : new Error(String(jpegError));
          }
        }
      }
      
      if (!savedSuccessfully) {
        // 모든 시도 실패
        const errorMsg = lastError?.message || '알 수 없는 오류';
        console.error('모든 이미지 저장 시도 실패:', errorMsg);
        throw new Error(`이미지 저장 실패: ${errorMsg} (다른 브라우저에서 시도해보세요)`);
      }
      
      console.log('=== 이미지 저장 성공적으로 완료 ===');
    } catch (error) {
      console.error('이미지 저장 프로세스 오류:', error);
      
      let errorMessage = '이미지 저장 중 문제가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = `이미지 저장 실패: ${error.message}`;
      }
      
      // 문제 해결 안내 추가
      errorMessage += ' (다른 브라우저를 시도하거나 이미지 크기 또는 형식을 변경해보세요)';
      
      // 오류를 다시 throw 하여 사용자에게 알립니다
      throw new Error(errorMessage);
    }
  }
  
  /**
   * 여러 가지 방법을 시도하여 Blob을 생성합니다.
   */
  private async getBlobWithFallbacks(
    title: string,
    format: ImageFormat,
    layoutMode: LayoutMode
  ): Promise<Blob> {
    console.log('다중 전략으로 Blob 생성 시도...');
    
    // 전략 #1: 표준 dataURL → Blob 변환
    try {
      console.log('전략 #1: 표준 내보내기 시도');
      const dataURL = await this.exportAsImage(format, layoutMode);
      const blob = await this.getImageBlob(dataURL, format);
      return blob;
    } catch (standardError) {
      console.error('표준 내보내기 실패:', standardError);
      
      // 전략 #2: 더 작은 크기로 시도
      try {
        console.log('전략 #2: 더 작은 이미지 시도');
        const smallerDataURL = await this.exportWithCanvasAPI(format, layoutMode);
        const blob = await this.getImageBlob(smallerDataURL, format);
        return blob;
      } catch (smallerError) {
        console.error('더 작은 이미지 실패:', smallerError);
        
        // 전략 #3: 가장 기본적인 캔버스 생성
        try {
          console.log('전략 #3: 기본 캔버스 시도');
          const basicDataURL = await this.exportWithSimplifiedCanvas(format, layoutMode);
          const blob = await this.getImageBlobDirect(basicDataURL);
          return blob;
        } catch (basicError) {
          console.error('기본 캔버스 실패:', basicError);
          throw new Error('모든 이미지 생성 방법 실패');
        }
      }
    }
  }
  
  /**
   * Blob을 안전하게 저장합니다.
   */
  private async saveBlob(blob: Blob, title: string, format: ImageFormat): Promise<void> {
    // 안전한 파일명 생성
    let safeTitle = title.replace(/[^\w\s가-힣]/g, '').replace(/\s+/g, '_') || 'lyrics-canvas';
    safeTitle = safeTitle.substring(0, 50); // 파일명 길이 제한
    
    // 현재 타임스탬프를 간결한 형식으로 추가
    const timestamp = formatDate(new Date());
    const fileName = `${safeTitle}_${timestamp}.${format.toLowerCase()}`;
    
    console.log('저장할 파일 이름:', fileName);
    console.log('Blob 크기:', blob.size, 'bytes');
    console.log('Blob 타입:', blob.type);
    
    // FileSaver를 사용하여 저장
    try {
      console.log('FileSaver.saveAs 호출');
      saveAs(blob, fileName);
      console.log('FileSaver.saveAs 성공');
      return;
    } catch (saveAsError) {
      console.error('FileSaver.saveAs 실패:', saveAsError);
      
      // 대체 방법 시도: URL.createObjectURL
      try {
        console.log('URL.createObjectURL 대체 방법 시도');
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // 정리
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log('URL.createObjectURL 방법 성공');
        return;
      } catch (urlError) {
        console.error('URL.createObjectURL 대체 방법 실패:', urlError);
        throw new Error('파일 저장 메커니즘이 모두 실패했습니다.');
      }
    }
  }

  /**
   * 안전한 방법으로 Base64 문자열에서 직접 Blob을 생성합니다.
   */
  private async getImageBlobDirect(dataURL: string): Promise<Blob> {
    // Base64 데이터 추출
    const parts = dataURL.split(';base64,');
    if (parts.length !== 2) {
      throw new Error('유효하지 않은 데이터 URL 형식');
    }
    
    const contentType = parts[0].split(':')[1];
    const byteCharacters = atob(parts[1]);
    const byteArrays = [];
    
    // 작은 청크로 처리하여 메모리 문제 방지
    const sliceSize = 512;
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    return new Blob(byteArrays, { type: contentType });
  }

  /**
   * DataURL을 Blob으로 변환합니다 - 다중 전략 접근법
   */
  async getImageBlob(dataURL: string, format: ImageFormat = ImageFormat.PNG): Promise<Blob> {
    console.log('DataURL에서 Blob 생성 시작');
    
    try {
      if (!dataURL || typeof dataURL !== 'string') {
        console.error('유효하지 않은 dataURL:', typeof dataURL);
        throw new Error('유효하지 않은 데이터 URL');
      }
      
      if (!dataURL.includes('base64,')) {
        console.error('base64 형식이 아닌 dataURL:', dataURL?.substring(0, 50) + '...');
        throw new Error('유효하지 않은 이미지 데이터 형식입니다.');
      }
      
      // 전략 #1: createObjectURL 사용
      try {
        console.log('전략 #1: fetch API 사용 시도');
        const response = await fetch(dataURL);
        const blob = await response.blob();
        console.log('Fetch API를 통한 Blob 생성 성공, 크기:', blob.size);
        return blob;
      } catch (fetchError) {
        console.warn('Fetch API Blob 변환 실패, 대체 방법 시도:', fetchError);
        
        // 전략 #2: 기본 Blob 생성자 사용
        try {
          console.log('전략 #2: Blob 생성자 시도');
          const parts = dataURL.split(';base64,');
          const contentType = parts[0].split(':')[1] || this.getMimeType(format);
          const base64 = parts[1];
          
          const byteCharacters = this.safeAtob(base64);
          const byteArrays = [];
          
          // 작은 청크로 처리
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
          }
          
          const blob = new Blob(byteArrays, { type: contentType });
          console.log('Blob 생성자 성공, 크기:', blob.size);
          return blob;
        } catch (blobError) {
          console.warn('Blob 생성자 실패, 마지막 방법 시도:', blobError);
          
          // 전략 #3: Canvas를 통한 변환
          try {
            console.log('전략 #3: Canvas를 통한 변환 시도');
            const img = new Image();
            
            const blob = await new Promise<Blob>((resolve, reject) => {
              img.onload = () => {
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.width;
                  canvas.height = img.height;
                  
                  const ctx = canvas.getContext('2d');
                  if (!ctx) {
                    return reject(new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.'));
                  }
                  
                  ctx.drawImage(img, 0, 0);
                  
                  canvas.toBlob(
                    (blob) => {
                      if (blob) {
                        resolve(blob);
                      } else {
                        reject(new Error('Canvas에서 Blob 생성 실패'));
                      }
                    },
                    this.getMimeType(format),
                    0.95
                  );
                } catch (err) {
                  reject(err);
                }
              };
              
              img.onerror = () => {
                reject(new Error('이미지 로딩 실패'));
              };
              
              // 크로스 오리진 이슈 방지
              img.crossOrigin = 'anonymous';
              img.src = dataURL;
            });
            
            console.log('Canvas 변환 성공, 크기:', blob.size);
            return blob;
          } catch (canvasError) {
            console.error('모든 Blob 변환 방법 실패:', canvasError);
            throw new Error('이미지 데이터를 변환할 수 없습니다.');
          }
        }
      }
    } catch (error) {
      console.error('Blob 생성 처리 중 심각한 오류:', error);
      
      // 응급 대책: 매우 작은 투명 PNG Blob 생성
      try {
        console.log('응급 조치: 최소 Blob 생성');
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = 10;
        smallCanvas.height = 10;
        
        const smallCtx = smallCanvas.getContext('2d');
        if (smallCtx) {
          smallCtx.fillStyle = '#ffffff';
          smallCtx.fillRect(0, 0, 10, 10);
        }
        
        return new Promise<Blob>((resolve, reject) => {
          smallCanvas.toBlob(
            (blob) => {
              if (blob) {
                console.log('응급 Blob 생성 성공');
                resolve(blob);
              } else {
                reject(new Error('응급 Blob 생성 실패'));
              }
            },
            'image/png'
          );
        });
      } catch (emergencyError) {
        console.error('응급 Blob 생성 실패:', emergencyError);
        throw new Error('모든 이미지 변환 시도가 실패했습니다.');
      }
    }
  }

  /**
   * 안전한 atob 함수 - 오류 처리 및 문자 검증 추가
   */
  private safeAtob(base64: string): string {
    try {
      // base64 문자열 유효성 검사
      const validBase64Regex = /^[A-Za-z0-9+/=]+$/;
      if (!validBase64Regex.test(base64)) {
        console.error('유효하지 않은 base64 문자열');
        throw new Error('유효하지 않은 base64 형식');
      }
      
      // 패딩 문자 확인
      if (base64.length % 4 !== 0) {
        console.warn('잘못된 base64 패딩, 수정 시도...');
        // 패딩 조정
        base64 = base64.padEnd(base64.length + (4 - (base64.length % 4)), '=');
      }
      
      return atob(base64);
    } catch (error) {
      console.error('Base64 디코딩 실패:', error);
      throw new Error('Base64 디코딩 중 오류 발생');
    }
  }

  async getImageDataURL(format: ImageFormat = ImageFormat.PNG, layoutMode?: LayoutMode): Promise<string> {
    console.log('getImageDataURL 호출됨:', { format, layoutMode });
    
    try {
      // 레이아웃 모드 결정: 전달된 모드 또는 현재 캔버스의 모드
      let currentMode = layoutMode;
      
      if (!currentMode && this.canvasRef?.current) {
        const element = this.canvasRef.current;
        // 엘리먼트 자체 또는 부모에 portrait-canvas 클래스가 있는지 확인
        const isPortrait = element.classList.contains('portrait-canvas') || 
                         element.closest('.portrait-canvas') !== null;
        
        currentMode = isPortrait ? LayoutMode.PORTRAIT : LayoutMode.LANDSCAPE;
        console.log('레이아웃 모드 감지됨:', currentMode === LayoutMode.PORTRAIT ? '세로 모드' : '가로 모드');
      }
      
      return this.exportAsImage(format, currentMode);
    } catch (error) {
      console.error('이미지 데이터 URL 생성 중 오류:', error);
      throw new Error('이미지 데이터 URL 생성에 실패했습니다.');
    }
  }

  private getMimeType(format: ImageFormat): string {
    switch (format) {
      case ImageFormat.PNG:
        return 'image/png';
      case ImageFormat.JPEG:
        return 'image/jpeg';
      case ImageFormat.WEBP:
        return 'image/webp';
      default:
        return 'image/png';
    }
  }
}

// Create a singleton instance
const exportManager = new ExportManager();
export default exportManager;
