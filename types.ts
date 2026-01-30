export enum FileStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  content: string | null;
  errorMessage?: string;
  originalName: string;
  type: string;
}

export enum OutputFormat {
  MARKDOWN = 'markdown',
  TXT = 'txt',
  HTML = 'html',
}

export interface CombinerSettings {
  outputFormat: OutputFormat;
  includeFilenames: boolean;
  separator: string;
}
