import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CanvasSettings as CanvasSettingsModel } from '@/models/CanvasSettings';
import { TextAlignment, LayoutMode } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import fontManager from '@/services/FontManager';

interface CanvasSettingsProps {
  initialSettings: CanvasSettingsModel;
  onUpdateSettings: (settings: CanvasSettingsModel) => void;
  onLayoutChange: (mode: LayoutMode) => void;
  currentLayout: LayoutMode;
}

export function CanvasSettingsPanel({
  initialSettings,
  onUpdateSettings,
  onLayoutChange,
  currentLayout
}: CanvasSettingsProps) {
  const [settings, setSettings] = useState<CanvasSettingsModel>(initialSettings);
  const [fonts, setFonts] = useState(fontManager.getAllFonts());
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const updateSettings = (updatedSettings: Partial<CanvasSettingsModel>) => {
    const newSettings = new CanvasSettingsModel({ ...settings, ...updatedSettings });
    setSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const handleLayoutChange = (mode: LayoutMode) => {
    onLayoutChange(mode);
  };

  const handleTitleFontChange = (value: string) => {
    const selectedFont = fontManager.getFontById(value);
    if (selectedFont) {
      updateSettings({ titleFontFamily: selectedFont.name });
    }
  };

  const handleBodyFontChange = (value: string) => {
    const selectedFont = fontManager.getFontById(value);
    if (selectedFont) {
      updateSettings({ bodyFontFamily: selectedFont.name });
    }
  };

  const handleFontUpload = async () => {
    setFontError(null);
    if (!fontFile) {
      setFontError('폰트 파일을 선택해주세요.');
      return;
    }
    try {
      const newFont = await fontManager.addCustomFont(fontFile);
      setFonts(fontManager.getAllFonts());
      // After upload, set it as the font for both title and body
      updateSettings({ titleFontFamily: newFont.name, bodyFontFamily: newFont.name });
      setFontFile(null);
    } catch (error) {
      setFontError(error instanceof Error ? error.message : '폰트 업로드 실패');
    }
  };

  const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontError(null);
    if (e.target.files && e.target.files.length > 0) {
      setFontFile(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Tabs defaultValue="layout">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="layout">레이아웃</TabsTrigger>
            <TabsTrigger value="text">텍스트</TabsTrigger>
            <TabsTrigger value="color">색상</TabsTrigger>
          </TabsList>

          <TabsContent value="layout">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>레이아웃 모드</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Button variant={currentLayout === LayoutMode.PORTRAIT ? "default" : "outline"} onClick={() => handleLayoutChange(LayoutMode.PORTRAIT)} className="w-full h-[120%]">
                    <div className="flex flex-col items-center">
                      <div className="portrait-preview-icon mb-2"></div>
                      세로 모드 (9:16)
                    </div>
                  </Button>
                  <Button variant={currentLayout === LayoutMode.LANDSCAPE ? "default" : "outline"} onClick={() => handleLayoutChange(LayoutMode.LANDSCAPE)} className="w-full h-[120%]">
                    <div className="flex flex-col items-center">
                      <div className="landscape-preview-icon mb-2"></div>
                      가로 모드 (16:9)
                    </div>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>캔버스 크기 (Zoom): {Math.round(settings.zoom * 100)}%</Label>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={[settings.zoom]}
                  onValueChange={(value) => updateSettings({ zoom: value[0] })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>제목 정렬</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button variant={settings.titleAlignment === TextAlignment.LEFT ? "default" : "outline"} onClick={() => updateSettings({ titleAlignment: TextAlignment.LEFT })} className="w-full">왼쪽</Button>
                  <Button variant={settings.titleAlignment === TextAlignment.CENTER ? "default" : "outline"} onClick={() => updateSettings({ titleAlignment: TextAlignment.CENTER })} className="w-full">가운데</Button>
                  <Button variant={settings.titleAlignment === TextAlignment.RIGHT ? "default" : "outline"} onClick={() => updateSettings({ titleAlignment: TextAlignment.RIGHT })} className="w-full">오른쪽</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>본문 정렬</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button variant={settings.contentAlignment === TextAlignment.LEFT ? "default" : "outline"} onClick={() => updateSettings({ contentAlignment: TextAlignment.LEFT })} className="w-full">왼쪽</Button>
                  <Button variant={settings.contentAlignment === TextAlignment.CENTER ? "default" : "outline"} onClick={() => updateSettings({ contentAlignment: TextAlignment.CENTER })} className="w-full">가운데</Button>
                  <Button variant={settings.contentAlignment === TextAlignment.RIGHT ? "default" : "outline"} onClick={() => updateSettings({ contentAlignment: TextAlignment.RIGHT })} className="w-full">오른쪽</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title-font-family">제목 폰트</Label>
                <Select onValueChange={handleTitleFontChange} value={fonts.find(f => f.name === settings.titleFontFamily)?.id || fonts[0].id}>
                  <SelectTrigger>
                    <SelectValue placeholder="폰트 선택" />
                  </SelectTrigger>
                  <SelectContent>{fonts.map((font) => (<SelectItem key={font.id} value={font.id}>{font.name} {font.isCustom ? "(사용자 정의)" : ""}</SelectItem>))}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body-font-family">본문 폰트</Label>
                <Select onValueChange={handleBodyFontChange} value={fonts.find(f => f.name === settings.bodyFontFamily)?.id || fonts[0].id}>
                  <SelectTrigger>
                    <SelectValue placeholder="폰트 선택" />
                  </SelectTrigger>
                  <SelectContent>{fonts.map((font) => (<SelectItem key={font.id} value={font.id}>{font.name} {font.isCustom ? "(사용자 정의)" : ""}</SelectItem>))}</SelectContent>
                </Select>
              </div>

              <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full">폰트 업로드</Button></PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">사용자 정의 폰트 추가</h4>
                    <div className="space-y-2">
                      <Input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFontFileChange} />
                      {fontError && (<p className="text-sm text-red-500">{fontError}</p>)}
                      <Button onClick={handleFontUpload} className="w-full mt-2" disabled={!fontFile}>폰트 추가</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">제목 폰트 크기: {settings.titleFontSize}px</Label>
                  <Slider min={24} max={96} step={1} value={[settings.titleFontSize]} onValueChange={(value) => updateSettings({ titleFontSize: value[0] })} className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">본문 폰트 크기: {settings.contentFontSize}px</Label>
                  <Slider min={16} max={72} step={1} value={[settings.contentFontSize]} onValueChange={(value) => updateSettings({ contentFontSize: value[0] })} className="w-full" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>줄 간격: {settings.lineSpacing}</Label>
                <Slider min={1} max={3} step={0.1} value={[settings.lineSpacing]} onValueChange={(value) => updateSettings({ lineSpacing: value[0] })} className="w-full" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="color">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-color">텍스트 색상</Label>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: settings.textColor }} />
                  <Input id="text-color" type="color" value={settings.textColor} onChange={(e) => updateSettings({ textColor: e.target.value })} className="w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bg-color">배경 색상</Label>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: settings.backgroundColor }} />
                  <Input id="bg-color" type="color" value={settings.backgroundColor} onChange={(e) => updateSettings({ backgroundColor: e.target.value })} className="w-full" />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
