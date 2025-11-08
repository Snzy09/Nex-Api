'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useState, useMemo, Suspense } from 'react';

const HEXAGON_SIZE = 40;
const HEXAGON_SPACING = 8;
const HEXAGONS_PER_ROW = 15;
const ROW_COUNT = 10;

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
    animation: `pulse ${Math.random() * 3 + 4}s ease-in-out infinite`,
    animationDelay: `${Math.random() * 3}s`,
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


const HexagonBackgroundContent = ({
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
              opacity: 0.03;
            }
            50% {
              opacity: 0.06;
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

export const HexagonBackground = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <Suspense fallback={null}>
      <HexagonBackgroundContent className={className} />
    </Suspense>
  );
};