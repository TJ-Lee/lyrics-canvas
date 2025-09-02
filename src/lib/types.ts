export enum LayoutMode {
  PORTRAIT = "portrait", // 9:16 비율
  LANDSCAPE = "landscape" // 16:9 비율
}

export enum TextAlignment {
  LEFT = "left",
  CENTER = "center",
  RIGHT = "right"
}

export enum ImageFormat {
  PNG = "png",
  JPEG = "jpeg",
  WEBP = "webp"
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface ApiEndpoints {
  generate: string;
  status: string;
}

export interface ApiStatus {
  running: boolean;
  url: string;
  version: string;
}

export interface Font {
  id: string;
  name: string;
  url: string;
  isCustom: boolean;
}