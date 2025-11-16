import React from 'react';

interface FileIconProps {
  filename: string;
  className?: string;
}

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const FileIcon: React.FC<FileIconProps> = ({ filename, className = 'w-8 h-8' }) => {
  const ext = getFileExtension(filename);
  // Using fiv-viv for "vivid" icons as it's more modern and was in the prompt's render example
  const iconClass = `fiv-viv fiv-icon-${ext}`;
  
  return <span className={`${iconClass} ${className}`} aria-label={`${ext} file icon`}></span>;
};
