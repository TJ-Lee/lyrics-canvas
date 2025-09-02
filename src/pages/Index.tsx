import { useState, useEffect } from 'react';
import { LyricsInput } from '@/components/LyricsInput';
import { CanvasSettingsPanel } from '@/components/CanvasSettings';
import { LyricsCanvas } from '@/components/LyricsCanvas';
import { ExportPanel } from '@/components/ExportPanel';
import { LyricsData } from '@/models/LyricsData';
import { CanvasSettings } from '@/models/CanvasSettings';
import { LayoutMode } from '@/lib/types';
import localStorageService from '@/services/LocalStorageService';
import apiService from '@/services/ApiService';
import electronBridge from '@/services/ElectronBridge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STORAGE_KEY_LYRICS = 'lyrics_canvas_lyrics';
const STORAGE_KEY_SETTINGS = 'lyrics_canvas_settings';

export default function Index() {
  const [lyricsData, setLyricsData] = useState<LyricsData>(new LyricsData());
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(new CanvasSettings());
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(LayoutMode.PORTRAIT);
  const [isElectron, setIsElectron] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<{ running: boolean, url: string }>({
    running: false,
    url: ''
  });

  // 애플리케이션 초기화
  useEffect(() => {
    const initializeApp = async () => {
      // 저장된 설정 및 가사 데이터 불러오기
      loadSavedData();
      
      // API 서비스 및 Electron 환경 초기화
      const isElectronEnv = electronBridge.isElectron;
      setIsElectron(isElectronEnv);
      
      if (isElectronEnv) {
        try {
          // Electron 환경이면 API 상태 확인
          const status = await apiService.getApiStatus();
          setApiStatus({
            running: status.running,
            url: status.url
          });
          
          // API 서버가 실행 중이면 API 서비스 초기화
          if (status.running) {
            await apiService.initialize();
          }
        } catch (error) {
          console.error('API 초기화 실패:', error);
        }
      }
    };
    
    initializeApp();
  }, []);

  // 가사 데이터 및 설정이 변경될 때마다 저장
  useEffect(() => {
    saveLyricsData();
  }, [lyricsData]);
  
  useEffect(() => {
    saveCanvasSettings();
  }, [canvasSettings]);

  // 로컬 스토리지에서 저장된 데이터 불러오기
  const loadSavedData = () => {
    const savedLyrics = localStorageService.getData<Record<string, unknown>>(STORAGE_KEY_LYRICS);
    if (savedLyrics) {
      setLyricsData(LyricsData.fromJSON(savedLyrics));
    }
    
    const savedSettings = localStorageService.getData<Record<string, unknown>>(STORAGE_KEY_SETTINGS);
    if (savedSettings) {
      setCanvasSettings(CanvasSettings.fromJSON(savedSettings));
    }
  };

  // 가사 데이터 로컬 스토리지에 저장
  const saveLyricsData = () => {
    localStorageService.saveData(STORAGE_KEY_LYRICS, lyricsData.toJSON());
  };

  // 캔버스 설정 로컬 스토리지에 저장
  const saveCanvasSettings = () => {
    localStorageService.saveData(STORAGE_KEY_SETTINGS, canvasSettings.toJSON());
  };

  // 가사 데이터 업데이트
  const handleUpdateLyrics = (data: LyricsData) => {
    setLyricsData(data);
  };

  // 캔버스 설정 업데이트
  const handleUpdateSettings = (settings: CanvasSettings) => {
    setCanvasSettings(settings);
  };

  // 레이아웃 모드 변경
  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  // API 서버 시작
  const handleStartApiServer = async () => {
    if (!isElectron) return;
    
    try {
      await electronBridge.startApiServer();
      const status = await apiService.getApiStatus();
      setApiStatus({
        running: status.running,
        url: status.url
      });
      
      if (status.running) {
        await apiService.initialize();
      }
    } catch (error) {
      console.error('API 서버 시작 실패:', error);
    }
  };

  // API 서버 중지
  const handleStopApiServer = async () => {
    if (!isElectron) return;
    
    try {
      await electronBridge.stopApiServer();
      const status = await apiService.getApiStatus();
      setApiStatus({
        running: status.running,
        url: status.url
      });
    } catch (error) {
      console.error('API 서버 중지 실패:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LyricsCanvas</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">가사 이미지 포맷팅 도구</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 왼쪽 사이드바 - 입력 및 설정 */}
          <div className="md:col-span-1 space-y-6">
            <Tabs defaultValue="input">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="input">가사 입력</TabsTrigger>
                <TabsTrigger value="settings">설정</TabsTrigger>
              </TabsList>
              
              <TabsContent value="input" className="mt-4">
                <LyricsInput 
                  onUpdateLyrics={handleUpdateLyrics} 
                  initialLyrics={lyricsData} 
                />
              </TabsContent>
              
              <TabsContent value="settings" className="mt-4">
                <CanvasSettingsPanel 
                  initialSettings={canvasSettings}
                  onUpdateSettings={handleUpdateSettings}
                  onLayoutChange={handleLayoutChange}
                  currentLayout={layoutMode}
                />
              </TabsContent>
            </Tabs>
            
            <ExportPanel lyricsData={lyricsData} />
          </div>
          
          {/* 중앙 및 오른쪽 - 캔버스 미리보기 */}
          <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <LyricsCanvas 
              lyricsData={lyricsData}
              settings={canvasSettings}
              mode={layoutMode}
              className="w-full"
            />
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-6">
        <div className="container mx-auto p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          LyricsCanvas © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}