import { ApiStatus } from '@/lib/types';
import { isElectronEnvironment } from '@/lib/utils';

// Electron IPC 통신을 위한 인터페이스 정의
interface ElectronApi {
  send: (channel: string, ...args: unknown[]) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
}

class ElectronBridge {
  private serverUrl: string = '';
  public isElectron: boolean;
  private electronApi: ElectronApi | null = null;

  constructor() {
    this.isElectron = isElectronEnvironment();
    
    // Electron 환경인 경우 IPC 인터페이스 초기화
    if (this.isElectron && window.electron) {
      this.electronApi = window.electron;
    }
  }

  async initializeApi(): Promise<void> {
    if (!this.isElectron || !this.electronApi) {
      throw new Error('ElectronBridge is only available in Electron environment');
    }
    
    try {
      // Electron 앱에 API 초기화 요청
      const result = await this.electronApi.invoke('api:initialize') as { success: boolean; serverUrl: string } | undefined;
      if (result?.success) {
        this.serverUrl = result.serverUrl;
        return;
      }
      throw new Error('API 초기화 실패');
    } catch (error) {
      console.error('API 초기화 중 오류 발생:', error);
      throw error;
    }
  }

  async startApiServer(): Promise<void> {
    if (!this.isElectron || !this.electronApi) {
      throw new Error('ElectronBridge is only available in Electron environment');
    }

    try {
      const result = await this.electronApi.invoke('api:start') as { success: boolean; serverUrl: string } | undefined;
      if (result?.success) {
        this.serverUrl = result.serverUrl;
        return;
      }
      throw new Error('API 서버 시작 실패');
    } catch (error) {
      console.error('API 서버 시작 중 오류 발생:', error);
      throw error;
    }
  }

  async stopApiServer(): Promise<void> {
    if (!this.isElectron || !this.electronApi) {
      throw new Error('ElectronBridge is only available in Electron environment');
    }

    try {
      const result = await this.electronApi.invoke('api:stop') as { success: boolean } | undefined;
      if (result?.success) {
        this.serverUrl = '';
        return;
      }
      throw new Error('API 서버 중지 실패');
    } catch (error) {
      console.error('API 서버 중지 중 오류 발생:', error);
      throw error;
    }
  }

  async getApiStatus(): Promise<ApiStatus> {
    if (!this.isElectron || !this.electronApi) {
      return {
        running: false,
        url: '',
        version: '0.0.0'
      };
    }

    try {
      const status = await this.electronApi.invoke('api:status') as { running?: boolean; url?: string; version?: string } | undefined;
      return {
        running: status?.running || false,
        url: status?.url || '',
        version: status?.version || '0.0.0'
      };
    } catch (error) {
      console.error('API 상태 확인 중 오류 발생:', error);
      return {
        running: false,
        url: '',
        version: '0.0.0'
      };
    }
  }

  getServerUrl(): string {
    return this.serverUrl;
  }
}

// Electron API 타입 정의 (window 객체에 추가)
declare global {
  interface Window {
    electron?: ElectronApi;
  }
}

// Create a singleton instance
const electronBridge = new ElectronBridge();
export default electronBridge;