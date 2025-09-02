import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { LyricsData } from '@/models/LyricsData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LyricsInputProps {
  onUpdateLyrics: (lyrics: LyricsData) => void;
  initialLyrics?: LyricsData;
}

export function LyricsInput({ onUpdateLyrics, initialLyrics }: LyricsInputProps) {
  const [title, setTitle] = useState(initialLyrics?.title || '');
  const [content, setContent] = useState(initialLyrics?.content || '');
  const [author, setAuthor] = useState(initialLyrics?.author || '');
  const [activeTab, setActiveTab] = useState('write');

  // 샘플 가사
  const samples = [
    {
      title: '별 헤는 밤',
      content: '계절이 지나가는 하늘에는\n가을로 가득 차 있습니다.\n\n나는 아무 걱정도 없이\n가을 속의 별들을 다 헤일 듯합니다.\n\n가슴 속에 하나 둘 새겨지는 별을\n이제 다 못 헤는 것은\n쉬이 아침이 오는 까닭이요,\n내일 밤이 남은 까닭이요,\n아직 나의 청춘이 다하지 않은 까닭입니다.',
      author: '윤동주'
    },
    {
      title: '서시',
      content: '죽는 날까지 하늘을 우러러\n한 점 부끄럼이 없기를,\n잎새에 이는 바람에도\n나는 괴로워했다.\n별을 노래하는 마음으로\n모든 죽어가는 것을 사랑해야지\n그리고 나한테 주어진 길을\n걸어가야겠다.\n\n오늘 밤에도 별이 바람에 스치운다.',
      author: '윤동주'
    },
    {
      title: '흔들리며 피는 꽃',
      content: '흔들리지 않고 피는 꽃이 어디 있으랴\n이 세상 모든 꽃은\n바람에 흔들리면서 피었나니\n흔들리면서 줄기를 곧게 세웠나니\n흔들리지 않고 가는 사랑이 어디 있으랴\n젖지 않고 피는 꽃이 어디 있으랴',
      author: '도종환'
    }
  ];

  // 가사 업데이트 함수
  const updateLyrics = () => {
    const lyricsData = new LyricsData(title, content, author);
    onUpdateLyrics(lyricsData);
  };

  // 입력값 변경 시 가사 업데이트
  useEffect(() => {
    updateLyrics();
  }, [title, content, author]);

  // 샘플 가사 적용
  const applySample = (index: number) => {
    const sample = samples[index];
    setTitle(sample.title);
    setContent(sample.content);
    setAuthor(sample.author);
    setActiveTab('write');
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write">직접 입력</TabsTrigger>
            <TabsTrigger value="samples">샘플 가사</TabsTrigger>
          </TabsList>
          
          <TabsContent value="write" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="노래 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lyrics">가사</Label>
              <Textarea
                id="lyrics"
                placeholder="가사를 입력해주세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-y"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="author">작사가/아티스트</Label>
              <Input
                id="author"
                placeholder="작사가 또는 아티스트 (선택사항)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="samples" className="mt-4">
            <div className="space-y-4">
              {samples.map((sample, index) => (
                <Card key={index} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => applySample(index)}>
                  <CardContent className="p-4">
                    <h3 className="font-bold">{sample.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">작사: {sample.author}</p>
                    <p className="text-sm mt-2 line-clamp-2">{sample.content.slice(0, 100)}...</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}