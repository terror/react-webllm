export type WebLLMModelOption = 'Llama-3.1-8B-Instruct-q4f32_1-MLC';

export interface WebLLMInitProgress {
  progress: number;
  text: string;
  status: 'initializing' | 'success' | 'error' | 'not-started';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
}

export interface GenerationOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  repetition_penalty?: number;
  stop?: string[];
}

export interface GenerationResponse {
  text: string;
  status: 'success' | 'error';
  error?: string;
}

export interface SystemInfo {
  supported: boolean;
  webGPUAvailable: boolean;
  webGLAvailable: boolean;
  sharedArrayBufferAvailable: boolean;
  gpuVendor: string | null;
}

export interface LLMProviderState {
  initProgress: WebLLMInitProgress;
  initialized: boolean;
  supported: boolean;
  systemInfo: SystemInfo;
  generate?: (
    prompt: string,
    options?: GenerationOptions
  ) => Promise<GenerationResponse>;
  initialize?: (modelOption?: WebLLMModelOption) => Promise<boolean>;
  resetChat?: () => Promise<void>;
}
