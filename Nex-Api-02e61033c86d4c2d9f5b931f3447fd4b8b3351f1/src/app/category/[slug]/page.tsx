'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiEndpoints, type ApiCategory, type ApiEndpoint } from '@/settings/config';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/dashboard/code-block';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle, Search, List, Play, Code, Server, Image as ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarPage } from '@/components/sidebar-page';
import { CategoryPageSkeleton } from '@/components/dashboard/category-page-skeleton';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

function ApiEndpointComponent({ endpoint }: { endpoint: ApiEndpoint }) {
  const [activeMethod, setActiveMethod] = useState<'GET' | 'POST'>(endpoint.methods[0]);
  const [formState, setFormState] = useState<Record<string, string | File>>({});
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [origin, setOrigin] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);


  const handleInputChange = (name: string, value: string | File) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponse(null);
    try {
      const url = new URL(endpoint.path, origin);
      
      let res;
      if (activeMethod === 'GET') {
        Object.entries(formState).forEach(([key, value]) => {
          if (value && typeof value === 'string') url.searchParams.append(key, value);
        });
        res = await fetch(url.toString());
        const data = await res.json();
        setResponse({ status: res.status, data });
      } else { // POST
        
        let body: BodyInit;
        const hasFile = Object.values(formState).some(v => v instanceof File);

        if (hasFile) {
            body = new FormData();
            Object.entries(formState).forEach(([key, value]) => {
                if (value) {
                    (body as FormData).append(key, value);
                }
            });
        } else {
            body = JSON.stringify(formState);
        }

        res = await fetch(url.toString(), {
          method: 'POST',
          headers: hasFile ? {} : { 'Content-Type': 'application/json' },
          body: body,
        });

        const data = await res.json();
        setResponse({ status: res.status, data });
      }

    } catch (error: any) {
      setResponse({ status: 500, data: { error: error.message } });
      toast({
        title: "Error",
        description: "Failed to fetch API.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false);
    }
  };

  const getCurlCommand = (method: 'GET' | 'POST') => {
    if (!origin) return 'Loading cURL command...';
    
    const url = new URL(endpoint.path, origin);

    let curl = `curl -X ${method} "${url.toString()}"`;

    if (method === 'GET') {
      const params = new URLSearchParams();
      Object.entries(formState).forEach(([key, value]) => {
        if(value && typeof value === 'string') params.append(key, value);
      });
       const displayUrl = new URL(endpoint.path, origin);
       Object.entries(formState).forEach(([key, value]) => {
        if(value && typeof value === 'string') displayUrl.searchParams.append(key, value);
      });
      curl = `curl -X ${method} "${displayUrl.toString()}"`;
    } else { // POST
        const hasFile = Object.values(formState).some(v => v instanceof File);
        if (hasFile) {
            Object.entries(formState).forEach(([key, value]) => {
                if (value instanceof File) {
                    curl += ` \\\n-F "${key}=@/path/to/your/${value.name}"`;
                } else if (value) {
                    curl += ` \\\n-F "${key}=${value}"`;
                }
            });
        } else {
            curl += ` \\\n-H "Content-Type: application/json"`;
            curl += ` \\\n-d '${JSON.stringify(formState, null, 2)}'`;
        }
    }

    return curl;
  };

  const httpStatusCodes = [
    { code: 200, description: 'OK - Request successful', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    { code: 400, description: 'Bad Request - Invalid parameters or missing required fields', icon: <AlertTriangle className="h-4 w-4 text-yellow-500" /> },
    { code: 405, description: 'Method Not Allowed - HTTP method not supported', icon: <AlertTriangle className="h-4 w-4 text-yellow-500" /> },
    { code: 500, description: 'Internal Server Error - Server encountered an error', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
  ];

  const getMethodClass = (method: string) => {
    switch (method) {
        case 'GET': return 'bg-sky-600 hover:bg-sky-700';
        case 'POST': return 'bg-green-600 hover:bg-green-700';
        default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };


  return (
    <AccordionItem value={endpoint.name} className="border rounded-lg overflow-hidden">
      <AccordionTrigger className="p-3 sm:p-4 hover:no-underline bg-card data-[state=open]:border-b">
        <div className="flex items-center gap-2 sm:gap-4 w-full">
            <Badge className={`w-16 sm:w-20 justify-center text-xs sm:text-sm ${getMethodClass(endpoint.methods[0])}`}>{endpoint.methods[0]}</Badge>
            <div className='text-left flex-1 min-w-0'>
                <p className="font-mono text-xs sm:text-sm truncate">{endpoint.path}</p>
                <p className="text-xs text-muted-foreground font-normal truncate">{endpoint.name}</p>
            </div>
            <Badge variant={endpoint.status === 'online' ? 'secondary' : 'destructive'} className='ml-auto flex-shrink-0'>
                {endpoint.status === 'online' ? 'Ready' : 'Offline'}
            </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-0 bg-card">
        <Tabs defaultValue="try" className="w-full">
            <TabsList className="m-2 sm:m-4 grid grid-cols-3">
                <TabsTrigger value="try" className="text-xs sm:text-sm"><Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />Try it out</TabsTrigger>
                <TabsTrigger value="response" className="text-xs sm:text-sm"><Server className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />Response</TabsTrigger>
                <TabsTrigger value="curl" className="text-xs sm:text-sm"><Code className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />cURL</TabsTrigger>
            </TabsList>
            <div className="p-3 sm:p-4 border-t">
                <TabsContent value="try">
                    <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">{endpoint.description}</p>
                    <div className="space-y-3 sm:space-y-4">
                        {endpoint.methods.length > 1 && (
                          <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as 'GET' | 'POST')}>
                            <TabsList className="grid grid-cols-2 w-full">
                              {endpoint.methods.map(m => <TabsTrigger key={m} value={m} className="text-xs sm:text-sm">{m}</TabsTrigger>)}
                            </TabsList>
                          </Tabs>
                        )}
                        <div className="space-y-3 sm:space-y-4">
                          {endpoint.parameters.map(param => (
                            <div key={param.name} className="space-y-2">
                              <Label htmlFor={param.name} className="flex items-center text-xs">
                                {param.name} {param.required && <span className="text-red-500 ml-1">*</span>}
                              </Label>
                              {param.type === 'select' && param.options ? (
                                 <Select onValueChange={(value) => handleInputChange(param.name, value)} name={param.name}>
                                    <SelectTrigger className="bg-background h-9 sm:h-10">
                                        <SelectValue placeholder={param.description} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {param.options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                              ) : param.type === 'file' ? (
                                <Input
                                    id={param.name}
                                    type="file"
                                    onChange={(e) => handleInputChange(param.name, e.target.files ? e.target.files[0] : '')}
                                    required={param.required}
                                    className="bg-background h-9 sm:h-10"
                                    ref={fileInputRef}
                                />
                              ) : (
                                <Input
                                    id={param.name}
                                    type={param.type}
                                    placeholder={param.description}
                                    onChange={(e) => handleInputChange(param.name, e.target.value)}
                                    required={param.required}
                                    className="bg-background h-9 sm:h-10"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                    </div>
                    <Button onClick={handleExecute} disabled={isLoading} className="mt-4 sm:mt-6 w-full sm:w-auto">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Execute
                    </Button>
                </TabsContent>
                <TabsContent value="response">
                    {response ? (
                        <div className='space-y-4'>
                            <h4 className="font-semibold">Response</h4>
                            <Card className="bg-background">
                                <CardHeader>
                                    <CardTitle className='text-sm'>Status: {response.status}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-72 w-full">
                                        <CodeBlock text={JSON.stringify(response.data, null, 2)} />
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Execute the request to see the response here.</p>
                        </div>
                    )}
                     <div className="space-y-4 mt-8">
                        <div className="font-semibold flex items-center gap-2 text-sm">
                            <List className="h-4 w-4" />
                            HTTP STATUS CODES
                        </div>
                        <div className="border rounded-lg overflow-hidden bg-background">
                            <div className="grid grid-cols-[80px_1fr] p-2 font-semibold bg-muted text-xs">
                                <div>Code</div>
                                <div>Description</div>
                            </div>
                            {httpStatusCodes.map(status => (
                                <div key={status.code} className="grid grid-cols-[80px_1fr] p-2 border-t items-center text-sm">
                                    <div className='flex items-center gap-2 font-mono'>{status.icon} {status.code}</div>
                                    <div>{status.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="curl">
                    <div className="space-y-4">
                        <h4 className="font-semibold">cURL Command</h4>
                        <CodeBlock text={getCurlCommand(activeMethod)} />
                    </div>
                </TabsContent>
            </div>
        </Tabs>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const { slug } = params;
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const category: ApiCategory | undefined = apiEndpoints[slug as string];

  if (!category) {
    notFound();
  }

  const filteredEndpoints = category.endpoints.filter(endpoint =>
    endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.path.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const breadcrumbs = [
    { label: "Categories", href: "/categories" },
    { label: category.name }
  ];

  if (isLoading) {
    return (
        <SidebarPage breadcrumbs={breadcrumbs}>
            <CategoryPageSkeleton />
        </SidebarPage>
    )
  }

  return (
    <SidebarPage breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
              {category.name}
              <Badge>{category.endpoints.length} Endpoints</Badge>
          </h1>
          <p className="text-muted-foreground mt-2">{category.description}</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
              placeholder="Search endpoints..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {filteredEndpoints.map(endpoint => (
            <ApiEndpointComponent key={endpoint.name} endpoint={endpoint} />
          ))}
        </Accordion>
      </div>
    </SidebarPage>
  );
}
