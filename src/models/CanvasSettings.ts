import { TextAlignment, Dimensions, LayoutMode } from "@/lib/types";
import { getLayoutDimensions } from "@/lib/utils";

export class CanvasSettings {
  portraitDimensions: Dimensions;
  landscapeDimensions: Dimensions;
  backgroundColor: string;
  fontFamily: string;
  titleFontSize: number; // New separate size for title
  contentFontSize: number; // New separate size for content
  lineSpacing: number;
  titleAlignment: TextAlignment;
  contentAlignment: TextAlignment;
  textColor: string;

  constructor(settings: Partial<CanvasSettings> = {}) {
    this.portraitDimensions = settings.portraitDimensions || getLayoutDimensions(LayoutMode.PORTRAIT);
    this.landscapeDimensions = settings.landscapeDimensions || getLayoutDimensions(LayoutMode.LANDSCAPE);
    this.backgroundColor = settings.backgroundColor || "#000000";
    this.fontFamily = settings.fontFamily || "Noto Sans KR";
    
    // Initialize fontSize fields with defaults or provided values
    this._fontSize = settings.fontSize || 32; // Legacy field
    this.titleFontSize = settings.titleFontSize || settings.fontSize || 48; // Default to 1.5x content size
    this.contentFontSize = settings.contentFontSize || settings.fontSize || 32;
    
    this.lineSpacing = settings.lineSpacing || 1.6;
    this.titleAlignment = settings.titleAlignment || TextAlignment.CENTER;
    this.contentAlignment = settings.contentAlignment || TextAlignment.CENTER;
    this.textColor = settings.textColor || "#ffffff";
  }

  toJSON(): Record<string, unknown> {
    return {
      portraitDimensions: this.portraitDimensions,
      landscapeDimensions: this.landscapeDimensions,
      backgroundColor: this.backgroundColor,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize, // Keep for backward compatibility
      titleFontSize: this.titleFontSize,
      contentFontSize: this.contentFontSize,
      lineSpacing: this.lineSpacing,
      titleAlignment: this.titleAlignment,
      contentAlignment: this.contentAlignment,
      textColor: this.textColor,
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

  // For backward compatibility with existing code
  get textAlignment(): TextAlignment {
    return this.contentAlignment;
  }

  set textAlignment(alignment: TextAlignment) {
    this.contentAlignment = alignment;
  }

  // Update fontSize to keep both title and content in sync when using legacy code
  set fontSize(size: number) {
    this._fontSize = size;
    // Only update if they haven't been explicitly set yet
    if (this.titleFontSize === this._fontSize * 1.5 || !this.titleFontSize) {
      this.titleFontSize = size * 1.5;
    }
    if (this.contentFontSize === this._fontSize || !this.contentFontSize) {
      this.contentFontSize = size;
    }
  }

  get fontSize(): number {
    return this._fontSize || this.contentFontSize;
  }

  private _fontSize: number = 32; // Internal storage for fontSize
}
