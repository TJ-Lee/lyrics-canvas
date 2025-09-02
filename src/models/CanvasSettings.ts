import { TextAlignment, Dimensions, LayoutMode } from "@/lib/types";
import { getLayoutDimensions } from "@/lib/utils";

export class CanvasSettings {
  portraitDimensions: Dimensions;
  landscapeDimensions: Dimensions;
  backgroundColor: string;
  titleFontFamily: string; // Font for the title
  bodyFontFamily: string; // Font for the content
  titleFontSize: number;
  contentFontSize: number;
  lineSpacing: number;
  titleAlignment: TextAlignment;
  contentAlignment: TextAlignment;
  textColor: string;
  zoom: number; // Zoom level

  constructor(settings: Partial<CanvasSettings> & { fontFamily?: string; fontSize?: number } = {}) {
    this.portraitDimensions = settings.portraitDimensions || getLayoutDimensions(LayoutMode.PORTRAIT);
    this.landscapeDimensions = settings.landscapeDimensions || getLayoutDimensions(LayoutMode.LANDSCAPE);
    this.backgroundColor = settings.backgroundColor || "#000000";
    
    // Handle font family splitting with backward compatibility
    const defaultFont = "Noto Sans KR";
    this.titleFontFamily = settings.titleFontFamily || settings.fontFamily || defaultFont;
    this.bodyFontFamily = settings.bodyFontFamily || settings.fontFamily || defaultFont;
    
    // Handle font size splitting with backward compatibility
    const defaultContentSize = 32;
    this.contentFontSize = settings.contentFontSize || settings.fontSize || defaultContentSize;
    this.titleFontSize = settings.titleFontSize || settings.fontSize * 1.5 || defaultContentSize * 1.5;
    
    this.lineSpacing = settings.lineSpacing || 1.6;
    this.titleAlignment = settings.titleAlignment || TextAlignment.CENTER;
    this.contentAlignment = settings.contentAlignment || TextAlignment.CENTER;
    this.textColor = settings.textColor || "#ffffff";
    this.zoom = settings.zoom || 1; // Default zoom is 1
  }

  toJSON(): Record<string, unknown> {
    return {
      portraitDimensions: this.portraitDimensions,
      landscapeDimensions: this.landscapeDimensions,
      backgroundColor: this.backgroundColor,
      titleFontFamily: this.titleFontFamily,
      bodyFontFamily: this.bodyFontFamily,
      titleFontSize: this.titleFontSize,
      contentFontSize: this.contentFontSize,
      lineSpacing: this.lineSpacing,
      titleAlignment: this.titleAlignment,
      contentAlignment: this.contentAlignment,
      textColor: this.textColor,
      zoom: this.zoom,
    };
  }

  static fromJSON(json: Record<string, unknown>): CanvasSettings {
    return new CanvasSettings(json as Partial<CanvasSettings>);
  }

  getDimensions(mode: LayoutMode): Dimensions {
    return mode === LayoutMode.PORTRAIT
      ? this.portraitDimensions
      : this.landscapeDimensions;
  }
}
