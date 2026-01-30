export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const isPlainTextFile = (type: string, name: string): boolean => {
  const textExtensions = ['.txt', '.md', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.xml', '.csv', '.svg'];
  if (type.startsWith('text/')) return true;
  if (type === 'application/json') return true;
  if (type === 'application/javascript') return true;
  return textExtensions.some(ext => name.toLowerCase().endsWith(ext));
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};