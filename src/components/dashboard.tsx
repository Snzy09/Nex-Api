'use client';
import { apiEndpoints } from "@/settings/config";
import { TypingText } from "./dashboard/typing-text";
import { InfoCard } from "./dashboard/info-card";
import { SystemStats } from "./dashboard/system-stats";
import { Database, List, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="stats" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        System Stats
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
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
                </TabsContent>

                <TabsContent value="stats" className="space-y-8">
                    <SystemStats />
                </TabsContent>
            </Tabs>
        </div>
    )
}
