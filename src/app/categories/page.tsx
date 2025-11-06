'use client';
import Link from 'next/link';
import { SidebarPage } from '@/components/sidebar-page';
import { Card, CardContent } from '@/components/ui/card';
import { apiEndpoints } from '@/settings/config';
import { Folder, ChevronRight, Bot, Database, List, Search, UserSearch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardPageSkeleton } from '@/components/dashboard/dashboard-page-skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

const categoryIcons: { [key: string]: React.ElementType } = {
    ai: Bot,
    search: Bot,
    downloaders: Bot,
    tools: Bot,
    stalk: UserSearch,
};

export default function DashboardPage() {
  const breadcrumbs = [{ label: 'Categories' }];
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const allCategories = Object.keys(apiEndpoints);
  const totalEndpoints = allCategories.reduce(
    (acc, key) => acc + apiEndpoints[key].endpoints.length,
    0
  );
  
  const filteredCategories = allCategories.filter((key) =>
    apiEndpoints[key].name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const stats = [
    {
      value: totalEndpoints.toString(),
      label: 'Total Endpoints',
      icon: List,
    },
    {
      value: allCategories.length.toString(),
      label: 'Categories',
      icon: Database,
    },
  ];

  if (isLoading) {
    return (
      <SidebarPage breadcrumbs={breadcrumbs}>
        <DashboardPageSkeleton />
      </SidebarPage>
    );
  }

  return (
    <SidebarPage breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-lg">
                    <stat.icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <div>
            <h2 className="text-xl font-semibold mb-4">All Categories</h2>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search categories..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-1">
            {filteredCategories.map((key) => {
                const category = apiEndpoints[key];
                const Icon = categoryIcons[key] || Bot;
                return (
                <Link href={`/category/${key}`} key={key} passHref>
                    <Card className="group hover:bg-primary/5 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-lg">
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                        <p className="font-semibold text-base">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.endpoints.length} endpoints available</p>
                        </div>
                        <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </CardContent>
                    </Card>
                </Link>
                );
            })}
            </div>
        </div>
      </div>
    </SidebarPage>
  );
}
