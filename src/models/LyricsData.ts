import { generateUUID } from "@/lib/utils";

export class LyricsData {
  id: string;
  title: string;
  content: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(title: string = "", content: string = "", author?: string) {
    this.id = generateUUID();
    this.title = title;
    this.content = content;
    this.author = author;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      author: this.author,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static fromJSON(json: Record<string, unknown>): LyricsData {
    const data = new LyricsData(
      json.title as string, 
      json.content as string, 
      json.author as string | undefined
    );
    data.id = json.id as string || generateUUID();
    data.createdAt = new Date(json.createdAt as string);
    data.updatedAt = new Date(json.updatedAt as string);
    return data;
  }
}