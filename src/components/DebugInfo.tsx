import React, { useState, useEffect, useRef } from 'react';
import { LayoutMode } from '@/lib/types';

interface DebugInfoProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  mode: LayoutMode;
}

export function DebugInfo({ canvasRef, mode }: DebugInfoProps) {
  const [dimensions, setDimensions] = useState({ 
    width: 0, 
    height: 0, 
    ratio: 0,
    exactRatio: ''
  });
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // Set up resize observer to monitor canvas dimensions
    if (canvasRef.current && !observer.current) {
      observer.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          const ratio = width / height;
          const gcd = getGCD(width, height);
          const exactRatio = `${width/gcd}:${height/gcd}`;
          
          setDimensions({
            width: Math.round(width),
            height: Math.round(height),
            ratio: parseFloat(ratio.toFixed(5)),
            exactRatio
          });
        }
      });

      observer.current.observe(canvasRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [canvasRef]);

  // Calculate greatest common divisor for exact ratio
  const getGCD = (a: number, b: number): number => {
    a = Math.round(a);
    b = Math.round(b);
    return b === 0 ? a : getGCD(b, a % b);
  };

  const getExpectedRatio = () => {
    return mode === LayoutMode.PORTRAIT ? 9/16 : 16/9;
  };

  // Add more detailed debugging info
  const getRatioDifference = () => {
    const expectedRatio = getExpectedRatio();
    const difference = Math.abs(dimensions.ratio - expectedRatio);
    const percentDiff = ((difference / expectedRatio) * 100).toFixed(2);
    return `${percentDiff}% 차이`;
  };

  const isRatioCorrect = () => {
    const expectedRatio = getExpectedRatio();
    const tolerance = 0.01; // Allow 1% difference for rounding
    return Math.abs(dimensions.ratio - expectedRatio) < tolerance;
  };

  const getExpectedRatioString = () => {
    if (mode === LayoutMode.PORTRAIT) {
      return "0.5625 (9:16)";
    } else {
      return "1.7778 (16:9)";
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-md text-xs z-50 font-mono">
      <div className="font-bold mb-1">Canvas Dimensions:</div>
      <div>Mode: {mode === LayoutMode.PORTRAIT ? "세로 모드" : "가로 모드"}</div>
      <div>Width: {dimensions.width}px</div>
      <div>Height: {dimensions.height}px</div>
      <div className={isRatioCorrect() ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
        현재 비율: {dimensions.ratio} ({dimensions.exactRatio})
      </div>
      <div>정확한 비율: {getExpectedRatioString()}</div>
      
      {!isRatioCorrect() && (
        <div className="text-yellow-400 text-[10px]">
          오차: {getRatioDifference()}
        </div>
      )}
      
      <div className="mt-2 text-[10px]">
        {isRatioCorrect() 
          ? "✓ 비율이 정확합니다!" 
          : "✗ 비율이 정확하지 않습니다"}
      </div>
      
      {!isRatioCorrect() && mode === LayoutMode.PORTRAIT && (
        <div className="mt-1 text-[9px] text-yellow-300">
          예상 높이: {Math.round(dimensions.width * (16/9))}px
        </div>
      )}
    </div>
  );
}