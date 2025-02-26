import * as webllm from '@mlc-ai/web-llm';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { 
  WebLLMModelOption, 
  WebLLMInitProgress, 
  GenerationOptions, 
  GenerationResponse,
  LLMProviderState,
  SystemInfo
} from './types';

const LLMContext = createContext<LLMProviderState | null>(null);

export const useLLM = () => {
  const context = useContext(LLMContext);

  if (!context) {
    throw new Error('useLLM must be used within an LLMProvider');
  }

  return context;
};

export interface LLMProviderProps {
  children: React.ReactNode;
  autoInitialize?: boolean;
  defaultModel?: WebLLMModelOption;
}

export const LLMProvider: React.FC<LLMProviderProps> = ({
  children,
  autoInitialize = false,
  defaultModel = 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
}) => {
  const [engine, setEngine] = useState<webllm.MLCEngine | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [supported, setSupported] = useState(false);

  const [initProgress, setInitProgress] = useState<WebLLMInitProgress>({
    progress: 0,
    text: 'Not initialized',
    status: 'not-started',
  });

  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    supported: false,
    webGPUAvailable: false,
    webGLAvailable: false,
    sharedArrayBufferAvailable: false,
    gpuVendor: null,
  });

  const checkWebLLMSupport = useCallback(async () => {
    if (typeof WebAssembly !== 'object') {
      setSupported(false);
      setSystemInfo((prev) => ({ ...prev, supported: false }));
      return false;
    }

    try {
      const hasWebGPU = 'gpu' in navigator;

      const canvas = document.createElement('canvas');

      const hasWebGL = !!(
        canvas.getContext('webgl') || canvas.getContext('webgl2')
      );

      const isSupported = hasWebGL || hasWebGPU;

      setSupported(isSupported);

      setSystemInfo({
        supported: isSupported,
        webGPUAvailable: hasWebGPU,
        webGLAvailable: hasWebGL,
        sharedArrayBufferAvailable: typeof SharedArrayBuffer === 'function',
        gpuVendor: null, // Will be populated after initialization
      });

      return isSupported;
    } catch (error) {
      console.error('Error checking WebLLM support:', error);
      setSupported(false);
      setSystemInfo((prev) => ({ ...prev, supported: false }));
      return false;
    }
  }, []);

  const initialize = useCallback(
    async (modelOption: WebLLMModelOption = defaultModel): Promise<boolean> => {
      if (initialized && engine) return true;

      if (!supported) {
        const isSupported = await checkWebLLMSupport();

        if (!isSupported) {
          setInitProgress({
            progress: 0,
            text: 'WebLLM is not supported in this browser',
            status: 'error',
          });

          return false;
        }
      }

      setInitProgress({
        progress: 0,
        text: 'Initializing WebLLM...',
        status: 'initializing',
      });

      try {
        const progressCallback = (report: webllm.InitProgressReport) => {
          setInitProgress({
            progress: report.progress,
            text: report.text,
            status: 'initializing',
          });
        };

        const mlcEngine = await webllm.CreateMLCEngine(modelOption, {
          initProgressCallback: progressCallback,
        });

        setEngine(mlcEngine);
        setInitialized(true);

        setInitProgress({
          progress: 1,
          text: 'WebLLM initialized successfully',
          status: 'success',
        });

        try {
          const vendor = await mlcEngine.getGPUVendor();
          setSystemInfo((prev) => ({ ...prev, gpuVendor: vendor }));
        } catch (e) {
          console.log('Could not get GPU vendor:', e);
        }

        return true;
      } catch (error) {
        console.error('Failed to initialize WebLLM:', error);
        setInitProgress({
          progress: 0,
          text: `Failed to initialize WebLLM: ${error instanceof Error ? error.message : 'Unknown error'}`,
          status: 'error',
        });
        return false;
      }
    },
    [initialized, engine, supported, checkWebLLMSupport, defaultModel]
  );

  useEffect(() => {
    const init = async () => {
      await checkWebLLMSupport();

      if (autoInitialize && supported) {
        initialize(defaultModel).catch((error) => {
          console.warn('Auto-initialization failed:', error);
        });
      }
    };

    init();
  }, [autoInitialize, defaultModel, initialize, checkWebLLMSupport, supported]);

  const generate = useCallback(
    async (
      prompt: string,
      options: GenerationOptions = {}
    ): Promise<GenerationResponse> => {
      if (!engine || !initialized) {
        return {
          text: '',
          status: 'error',
          error: 'WebLLM not initialized. Call initialize() first.',
        };
      }

      try {
        const messages: webllm.ChatCompletionMessageParam[] = [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: prompt },
        ];

        const response = await engine.chat.completions.create({
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens,
          top_p: options.top_p,
          stop: options.stop,
        });

        return {
          text: response.choices[0].message.content || '',
          status: 'success',
        };
      } catch (error) {
        console.error('Error generating text with WebLLM:', error);
        return {
          text: '',
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'Unknown error generating text',
        };
      }
    },
    [engine, initialized]
  );

  const resetChat = useCallback(async (): Promise<void> => {
    if (!engine) return;

    try {
      await engine.resetChat();
    } catch (error) {
      console.error('Error resetting chat:', error);
    }
  }, [engine]);

  const value: LLMProviderState = {
    initProgress,
    initialized,
    supported,
    systemInfo,
    generate,
    initialize,
    resetChat,
  };

  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>;
};

export default LLMProvider;
