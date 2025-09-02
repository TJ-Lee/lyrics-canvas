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

  useEffect(() => {
    const initializeApp = async () => {
      loadSavedData();
      const isElectronEnv = electronBridge.isElectron;
      setIsElectron(isElectronEnv);
      if (isElectronEnv) {
        try {
          const status = await apiService.getApiStatus();
          setApiStatus({ running: status.running, url: status.url });
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

  useEffect(() => {
    saveLyricsData();
  }, [lyricsData]);
  
  useEffect(() => {
    saveCanvasSettings();
  }, [canvasSettings]);

  const loadSavedData = () => {
    const savedLyrics = localStorageService.getData<Record<string, unknown>>(STORAGE_KEY_LYRICS);
    if (savedLyrics) setLyricsData(LyricsData.fromJSON(savedLyrics));
    const savedSettings = localStorageService.getData<Record<string, unknown>>(STORAGE_KEY_SETTINGS);
    if (savedSettings) setCanvasSettings(CanvasSettings.fromJSON(savedSettings));
  };

  const saveLyricsData = () => localStorageService.saveData(STORAGE_KEY_LYRICS, lyricsData.toJSON());
  const saveCanvasSettings = () => localStorageService.saveData(STORAGE_KEY_SETTINGS, canvasSettings.toJSON());
  const handleUpdateLyrics = (data: LyricsData) => setLyricsData(data);
  const handleUpdateSettings = (settings: CanvasSettings) => setCanvasSettings(settings);
  const handleLayoutChange = (mode: LayoutMode) => setLayoutMode(mode);

  const handleStartApiServer = async () => {
    if (!isElectron) return;
    try {
      await electronBridge.startApiServer();
      const status = await apiService.getApiStatus();
      setApiStatus({ running: status.running, url: status.url });
      if (status.running) await apiService.initialize();
    } catch (error) {
      console.error('API 서버 시작 실패:', error);
    }
  };

  const handleStopApiServer = async () => {
    if (!isElectron) return;
    try {
      await electronBridge.stopApiServer();
      const status = await apiService.getApiStatus();
      setApiStatus({ running: status.running, url: status.url });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          
          <div className="md:col-span-1 flex flex-col items-center justify-start p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* 캔버스 너비를 30%로 수정 (w-[30%]) */}
            <LyricsCanvas 
              lyricsData={lyricsData}
              settings={canvasSettings}
              mode={layoutMode}
              className="w-[30%]"
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