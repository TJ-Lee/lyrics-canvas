import { ApiStatus, ApiEndpoints } from '@/lib/types';
import electronBridge from './ElectronBridge';
import { LyricsData } from '@/models/LyricsData';
import { CanvasSettings } from '@/models/CanvasSettings';

class ApiService {
  private baseUrl: string = '';
  private endpoints: ApiEndpoints = {
    generate: '/api/generate',
    status: '/api/status'
  };
  private authToken?: string;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    // Electron 환경에서는 ElectronBridge를 통해 API 서버 초기화
    if (electronBridge.isElectron) {
      try {
        await electronBridge.initializeApi();
        const status = await this.getApiStatus();
        if (status.running) {
          this.baseUrl = status.url;
          this.isInitialized = true;
        }
      } catch (error) {
        console.error('API 서비스 초기화 실패:', error);
        throw error;
      }
    } else {
      // 웹 환경에서는 API를 사용하지 않음
      console.info('웹 환경에서는 API 서비스가 활성화되지 않습니다.');
    }
  }

  async generateLyricsCanvas(
    data: LyricsData, 
    settings: CanvasSettings
  ): Promise<string> {
    if (!this.isInitialized || !this.baseUrl) {
      throw new Error('API 서비스가 초기화되지 않았습니다.');
    }

    try {
      const response = await fetch(`${this.baseUrl}${this.endpoints.generate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          lyrics: data.toJSON(),
          settings: settings.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      console.error('가사 캔버스 생성 실패:', error);
      throw error;
    }
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = undefined;
  }

  isRunning(): boolean {
    return this.isInitialized && !!this.baseUrl;
  }

  async getApiStatus(): Promise<ApiStatus> {
    if (electronBridge.isElectron) {
      return electronBridge.getApiStatus();
    }

    // 웹 환경에서는 API 서버가 항상 비활성화 상태
    return {
      running: false,
      url: '',
      version: '0.0.0'
    };
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;