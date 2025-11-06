'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useState, useMemo } from 'react';

const HEXAGON_SIZE = 60;
const HEXAGON_SPACING = 10;
const HEXAGONS_PER_ROW = 25;
const ROW_COUNT = 15;

const Hexagon = React.memo(({
  rowIndex,
  colIndex,
  isEvenRow,
}: {
  rowIndex: number;
  colIndex: number;
  isEvenRow: boolean;
}) => {
  const x =
    colIndex * (HEXAGON_SIZE + HEXAGON_SPACING) +
    (isEvenRow ? 0 : (HEXAGON_SIZE + HEXAGON_SPACING) / 2);
  const y = rowIndex * (HEXAGON_SIZE * 0.85);

  const points = useMemo(() => [
    [x + HEXAGON_SIZE / 2, y],
    [x + HEXAGON_SIZE, y + HEXAGON_SIZE / 4],
    [x + HEXAGON_SIZE, y + (HEXAGON_SIZE * 3) / 4],
    [x + HEXAGON_SIZE / 2, y + HEXAGON_SIZE],
    [x, y + (HEXAGON_SIZE * 3) / 4],
    [x, y + HEXAGON_SIZE / 4],
  ]
    .map((p) => p.join(','))
    .join(' '), [x, y]);

  const animationStyle = useMemo(() => ({
    animation: `pulse ${Math.random() * 5 + 5}s ease-in-out infinite`,
    animationDelay: `${Math.random() * 5}s`,
  }), []);

  return (
    <polygon
      points={points}
      className="fill-current opacity-5"
      style={animationStyle}
    />
  );
});

Hexagon.displayName = 'Hexagon';


export const HexagonBackground = ({
  className,
}: {
  className?: string;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hexagons = useMemo(() => {
    return Array.from({ length: ROW_COUNT }).flatMap((_, rowIndex) => {
      const isEvenRow = rowIndex % 2 === 0;
      return Array.from({ length: HEXAGONS_PER_ROW }).map((_, colIndex) => (
        <Hexagon
          key={`${rowIndex}-${colIndex}`}
          rowIndex={rowIndex}
          colIndex={colIndex}
          isEvenRow={isEvenRow}
        />
      ));
    });
  }, []);
  
  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 -z-10 overflow-hidden text-primary/50',
        className
      )}
    >
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 0.02;
              transform: scale(0.95);
            }
            50% {
              opacity: 0.07;
              transform: scale(1);
            }
          }
        `}
      </style>
      <svg
        className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%]"
      >
        <g>{hexagons}</g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
};