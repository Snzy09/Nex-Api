'use client';

import { useState, useEffect, useRef } from 'react';

const DEFAULT_TEXTS = [
    'Simple And Modern Design Api For Everyone.',
    'Modern Web Api',
    'Simple Ui Design',
    'User Friendly',
];

interface TypingTextProps {
    texts?: string[];
    className?: string;
}

export function TypingText({ texts, className }: TypingTextProps) {
    const [textIndex, setTextIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const holdDelay = 2000;

    const textArray = texts || DEFAULT_TEXTS;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleTyping = () => {
            const currentText = textArray[textIndex];
            if (isDeleting) {
                if (displayedText.length > 0) {
                    setDisplayedText(currentText.substring(0, displayedText.length - 1));
                } else {
                    setIsDeleting(false);
                    setTextIndex((prev) => (prev + 1) % textArray.length);
                }
            } else {
                if (displayedText.length < currentText.length) {
                    setDisplayedText(currentText.substring(0, displayedText.length + 1));
                } else {
                    timeoutRef.current = setTimeout(() => setIsDeleting(true), holdDelay);
                }
            }
        };

        const speed = isDeleting ? deletingSpeed : typingSpeed;
        timeoutRef.current = setTimeout(handleTyping, speed);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [displayedText, isDeleting, textIndex, textArray, holdDelay, typingSpeed, deletingSpeed]);

    const baseClassName = texts && texts.length > 0 ? "h-auto" : "text-muted-foreground h-6";

    return (
        <p className={`${baseClassName} ${className || ''}`}>
            {displayedText}
            <span className="border-r-2 animate-blink-caret ml-1" aria-hidden="true" />
        </p>
    );
}
