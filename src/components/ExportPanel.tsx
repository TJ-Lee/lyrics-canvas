import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageFormat } from '@/lib/types';
import { LyricsData } from '@/models/LyricsData';
import exportManager from '@/services/ExportManager';
import { Download, Share, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportPanelProps {
  lyricsData: LyricsData;
}

export function ExportPanel({ lyricsData }: ExportPanelProps) {
  const [imageFormat, setImageFormat] = useState<ImageFormat>(ImageFormat.JPEG);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleFormatChange = (value: string) => {
    setImageFormat(value as ImageFormat);
  };

  const handleExport = async () => {
    console.log('이미지 내보내기 시작', new Date().toISOString());
    setIsExporting(true);
    setExportError(null);

    try {
      // 유효성 검사 - 캔버스 참조가 올바르게 설정되었는지 확인
      if (!exportManager.hasValidCanvasRef()) {
        setExportError('캔버스 참조가 유효하지 않습니다. 페이지를 새로고침해 주세요.');
        toast.error('내보내기 준비가 되지 않았습니다. 페이지를 새로고침 후 다시 시도하세요.');
        return;
      }

      // 안전한 파일명 생성
      const safeTitle = (lyricsData.title || 'lyrics-canvas').replace(/[^\w\s가-힣]/g, '').replace(/\s+/g, '_');
      
      // 진행 중 알림 표시
      toast.loading('이미지를 저장하는 중...', { 
        id: 'save-image',
        duration: 5000
      });
      
      console.log('내보내기 파라미터:', { title: safeTitle, format: imageFormat });
      await exportManager.saveImage(safeTitle, imageFormat);
      
      console.log('내보내기 성공');
      toast.success('이미지가 성공적으로 저장되었습니다!', { 
        id: 'save-image',
        duration: 3000
      });
    } catch (error) {
      console.error('내보내기 오류:', error);
      
      // 더 자세한 오류 메시지 표시
      if (error instanceof Error) {
        setExportError(`${error.message}`);
        toast.error(`저장 실패: ${error.message}`, { id: 'save-image', duration: 5000 });
      } else {
        const errorMsg = '이미지 저장 중 오류가 발생했습니다. 다른 브라우저를 시도해보세요.';
        setExportError(errorMsg);
        toast.error(errorMsg, { id: 'save-image', duration: 5000 });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    console.log('이미지 공유 시작', new Date().toISOString());
    setIsExporting(true);
    setExportError(null);

    try {
      // Web Share API가 사용 가능한지 확인
      if (!navigator.share || !navigator.canShare) {
        throw new Error('공유 기능을 지원하지 않는 브라우저입니다.');
      }

      // 데이터 URL 생성 시도
      try {
        console.log('이미지 데이터 URL 생성 중...');
        const dataURL = await exportManager.getImageDataURL(imageFormat);
        console.log('데이터 URL 생성 성공');
        
        // Blob 생성 시도
        console.log('이미지 Blob 생성 중...');
        const imageBlob = await exportManager.getImageBlob(dataURL, imageFormat);
        console.log('Blob 생성 성공:', imageBlob.size, 'bytes');
        
        const safeTitle = (lyricsData.title || 'lyrics-canvas').replace(/[^\w\s가-힣]/g, '').replace(/\s+/g, '_');
        const fileName = `${safeTitle}.${imageFormat.toLowerCase()}`;
        
        const file = new File(
          [imageBlob], 
          fileName, 
          { type: imageBlob.type }
        );
        
        // Web Share API를 사용하여 공유
        console.log('파일 공유 시작...');
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: lyricsData.title || '가사 이미지',
            text: '가사 이미지를 공유합니다',
            files: [file],
          });
          console.log('공유 성공');
        } else {
          throw new Error('이 형식의 파일은 공유할 수 없습니다.');
        }
      } catch (exportError) {
        console.error('이미지 생성 실패:', exportError);
        throw new Error('이미지 생성 중 문제가 발생했습니다. 다른 형식으로 시도해보세요.');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      setExportError(error instanceof Error ? error.message : '공유 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="format" className="text-sm font-medium">이미지 형식</label>
            <Select onValueChange={handleFormatChange} defaultValue={imageFormat}>
              <SelectTrigger id="format">
                <SelectValue placeholder="형식 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ImageFormat.JPEG}>JPEG (작은 파일 크기)</SelectItem>
                <SelectItem value={ImageFormat.PNG}>PNG (투명 배경 지원)</SelectItem>
                <SelectItem value={ImageFormat.WEBP}>WebP (최적화된 품질)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
            <p>💡 <strong>도움말</strong>: 저장에 문제가 있으면 다른 이미지 형식을 시도하거나, Chrome 브라우저를 사용해보세요.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  내보내는 중
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  이미지 저장
                </>
              )}
            </Button>
            
            {('share' in navigator) && (
              <Button 
                onClick={handleShare}
                disabled={isExporting}
                variant="outline"
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    준비 중
                  </>
                ) : (
                  <>
                    <Share className="mr-2 h-4 w-4" />
                    공유하기
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
