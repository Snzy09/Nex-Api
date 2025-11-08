'use client';
import { apiEndpoints } from "@/settings/config";
import { TypingText } from "./dashboard/typing-text";
import { InfoCard } from "./dashboard/info-card";
import { Database, List } from "lucide-react";

export function Dashboard() {
    const totalCategories = Object.keys(apiEndpoints).length;
    const totalEndpoints = Object.values(apiEndpoints).reduce((acc, category) => acc + category.endpoints.length, 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nex Api 〽️</h1>
                    <TypingText />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard 
                    title="Total Categories" 
                    icon={Database}
                    content={<div className="text-2xl font-bold">{totalCategories}</div>}
                />
                <InfoCard 
                    title="Total Features" 
                    icon={List}
                    content={<div className="text-2xl font-bold">{totalEndpoints}</div>}
                />
            </div>
        </div>
    )
}
