import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { LayoutMode, TextAlignment, Dimensions } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
}

export function getLayoutDimensions(mode: LayoutMode): Dimensions {
  // 더 명확한 차이를 위해 실제 기기 화면에 가까운 비율로 조정
  if (mode === LayoutMode.PORTRAIT) {
    return { width: 1080, height: 1920 }; // 9:16 비율 (모바일 세로)
  } else {
    return { width: 1920, height: 1080 }; // 16:9 비율 (모바일 가로/TV 화면)
  }
}

export function getTextAlignmentClass(alignment: TextAlignment): string {
  switch (alignment) {
    case TextAlignment.LEFT:
      return "text-left";
    case TextAlignment.CENTER:
      return "text-center";
    case TextAlignment.RIGHT:
      return "text-right";
    default:
      return "text-center";
  }
}

// 최적의 폰트 크기 계산 (텍스트의 길이와 컨테이너 크기를 기반으로)
export function calculateOptimalFontSize(
  text: string, 
  containerWidth: number, 
  containerHeight: number, 
  maxFontSize: number = 72,
  minFontSize: number = 16
): number {
  const lines = text.split('\n').length;
  const avgCharsPerLine = text.length / lines;
  
  // 세로 공간 기반 계산 (라인 수에 따른 폰트 크기)
  const fontSizeByHeight = Math.floor(containerHeight / (lines * 1.5));
  
  // 가로 공간 기반 계산 (평균 글자수에 따른 폰트 크기)
  const fontSizeByWidth = Math.floor(containerWidth / (avgCharsPerLine * 0.6));
  
  // 두 계산 중 작은 값 선택 (제한 사항 내에서)
  let optimalSize = Math.min(fontSizeByHeight, fontSizeByWidth);
  
  // 제한 적용
  if (optimalSize > maxFontSize) optimalSize = maxFontSize;
  if (optimalSize < minFontSize) optimalSize = minFontSize;
  
  return optimalSize;
}

// 텍스트를 여러 줄로 나누고 재배치하는 함수
export function formatTextLines(
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  
  // 대략적인 글자당 픽셀 너비 (폰트 크기에 비례)
  const charWidth = fontSize * 0.6;
  
  for (const word of words) {
    // 현재 라인에 단어를 추가했을 때 너비 계산
    const lineWithWord = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = lineWithWord.length * charWidth;
    
    // 너비 초과하면 새 라인 시작
    if (lineWidth > maxWidth && currentLine !== "") {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = lineWithWord;
    }
  }
  
  // 마지막 라인 추가
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

export function isElectronEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.process &&
    window.process.type === 'renderer'
  );
}