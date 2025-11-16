
export interface GeminiFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  previewUrl: string; // Data URL for images, or a placeholder
  note: string;
}
