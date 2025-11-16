import { GeminiFile } from '../types';

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const groupFilesByDate = (files: GeminiFile[]): Record<string, GeminiFile[]> => {
  const groups: Record<string, GeminiFile[]> = {};

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  files.forEach(file => {
    const fileDate = new Date(file.uploadDate);
    let groupKey: string;

    if (isSameDay(fileDate, today)) {
      groupKey = 'Bugün';
    } else if (isSameDay(fileDate, yesterday)) {
      groupKey = 'Dün';
    } else {
      groupKey = fileDate.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(file);
  });

  return groups;
};