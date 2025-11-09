'use client';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "next-themes";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

export const CodeBlock = ({ text }: { text: string }) => {
    const { toast } = useToast();
    const { theme } = useTheme();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard!",
        });
    }

    const currentTheme = theme === 'dark' ? vscDarkPlus : oneLight;
    
    let formattedText = text;
    let language = 'javascript';
    try {
        const parsed = JSON.parse(text);
        formattedText = JSON.stringify(parsed, null, 2);
        language = 'json';
    } catch (e) {
        // Not a valid JSON, just display as is
    }

    return (
        <div className="relative font-mono text-sm bg-background rounded-md border overflow-hidden">
            <SyntaxHighlighter language={language} style={currentTheme} customStyle={{ margin: 0, padding: '1rem', paddingRight: '3rem', backgroundColor: 'transparent' }} codeTagProps={{ style: { whiteSpace: 'pre-wrap' }}}>
                {formattedText}
            </SyntaxHighlighter>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={copyToClipboard}
            >
                <Copy className="h-4 w-4" />
            </Button>
        </div>
    )
}
