import { Font } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import localStorageService from "./LocalStorageService";

const STORAGE_KEY = "lyrics_canvas_fonts";
const DEFAULT_FONTS: Font[] = [
  {
    id: "noto-sans-kr",
    name: "Noto Sans KR",
    url: "http://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap",
    isCustom: false,
  },
  {
    id: "nanum-gothic",
    name: "Nanum Gothic",
    url: "http://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap",
    isCustom: false,
  },
  {
    id: "nanum-myeongjo",
    name: "Nanum Myeongjo",
    url: "http://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap",
    isCustom: false,
  },
];

class FontManager {
  private availableFonts: Font[];
  private currentFont: Font;
  
  constructor() {
    this.availableFonts = [...DEFAULT_FONTS];
    this.currentFont = DEFAULT_FONTS[0]; 
    this.loadCustomFonts();
  }

  async loadDefaultFonts(): Promise<Font[]> {
    return DEFAULT_FONTS;
  }

  async addCustomFont(fontFile: File): Promise<Font> {
    try {
      // 폰트 파일 유효성 검사
      if (!fontFile.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
        throw new Error('지원되지 않는 폰트 파일 형식입니다. TTF, OTF, WOFF, WOFF2 형식만 지원합니다.');
      }

      // 폰트 URL 생성 (브라우저 메모리에 로드)
      const fontUrl = URL.createObjectURL(fontFile);
      
      // 폰트 이름 추출 (확장자 제거)
      const fontName = fontFile.name.replace(/\.[^/.]+$/, "");
      
      // 폰트 객체 생성
      const newFont: Font = {
        id: generateUUID(),
        name: fontName,
        url: fontUrl,
        isCustom: true
      };

      // 사용 가능한 폰트 목록에 추가
      this.availableFonts.push(newFont);
      
      // 커스텀 폰트 저장
      this.saveCustomFonts();
      
      // 새 폰트 로드를 위한 FontFace API 사용
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      await fontFace.load();
      document.fonts.add(fontFace);

      return newFont;
    } catch (error) {
      console.error("커스텀 폰트 추가 실패:", error);
      throw error;
    }
  }

  removeCustomFont(fontId: string): boolean {
    const fontIndex = this.availableFonts.findIndex(font => font.id === fontId && font.isCustom);
    
    if (fontIndex === -1) {
      return false;
    }
    
    // 제거할 폰트가 현재 선택된 폰트인 경우 기본 폰트로 변경
    if (this.currentFont.id === fontId) {
      this.setCurrentFont(DEFAULT_FONTS[0].id);
    }
    
    // ObjectURL 정리
    if (this.availableFonts[fontIndex].isCustom) {
      URL.revokeObjectURL(this.availableFonts[fontIndex].url);
    }
    
    // 폰트 목록에서 제거
    this.availableFonts.splice(fontIndex, 1);
    
    // 변경사항 저장
    this.saveCustomFonts();
    
    return true;
  }

  setCurrentFont(fontId: string): void {
    const font = this.getFontById(fontId);
    if (font) {
      this.currentFont = font;
    }
  }

  getFontById(fontId: string): Font | undefined {
    return this.availableFonts.find(font => font.id === fontId);
  }

  getAllFonts(): Font[] {
    return [...this.availableFonts];
  }

  getCurrentFont(): Font {
    return this.currentFont;
  }

  saveCustomFonts(): void {
    const customFonts = this.availableFonts.filter(font => font.isCustom);
    localStorageService.saveData(STORAGE_KEY, customFonts);
  }

  loadCustomFonts(): void {
    try {
      const customFonts = localStorageService.getData<Font[]>(STORAGE_KEY, []);
      
      if (customFonts && Array.isArray(customFonts)) {
        // 기존 커스텀 폰트 URL을 정리
        this.availableFonts
          .filter(font => font.isCustom)
          .forEach(font => URL.revokeObjectURL(font.url));
        
        // 기본 폰트만 남기고 모든 커스텀 폰트 제거
        this.availableFonts = this.availableFonts.filter(font => !font.isCustom);
        
        // localStorage에서 불러온 폰트들은 실제 폰트 파일이 없으므로 사용하지 않음
        // 실제 사용을 위해서는 사용자가 다시 폰트를 업로드해야 함
        console.info("커스텀 폰트 정보가 로드되었습니다. 실제 사용을 위해 폰트 파일을 다시 업로드해주세요.");
      }
    } catch (error) {
      console.error("커스텀 폰트 로드 실패:", error);
    }
  }
}

// Create a singleton instance
const fontManager = new FontManager();
export default fontManager;