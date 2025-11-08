
'use client';

import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AudioWaveform,
  BadgeCheck,
  BookOpen,
  Bot,
  Cog,
  Download,
  ChevronRight,
  ChevronsUpDown,
  Command,
  Film,
  GalleryVerticalEnd,
  Image as ImageIcon,
  LayoutDashboard,
  Newspaper,
  Plus,
  Soup,
  UserSearch,
  Search
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from './theme-toggle';
import { apiEndpoints } from '@/settings/config';
import { usePathname } from 'next/navigation';
import { HexagonBackground } from './ui/hexagon-background';

const DATA = {
  user: {
    name: 'NexSz',
    email: 'sanzzydev@gmail.com',
    avatar:
      'https://k.top4top.io/p_3597th0j31.png',
  },
  teams: [
    {
      name: 'Nex Api 〽️',
      logo: GalleryVerticalEnd,
      plan: 'V 1.0',
    },
    {
      name: 'Shanz 🔅',
      logo: AudioWaveform,
      plan: 'Thanks To Shanz For Scrape',
    },
    {
      name: 'Sanzz 🎴',
      logo: Command,
      plan: 'Owner',
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboard,
    },
    {
      title: 'Categories',
      url: '/categories',
      icon: Bot,
    },
    {
      title: 'Documentation',
      url: '/documentation',
      icon: BookOpen,
      items: [
        {
          title: 'Introduction',
          url: '/documentation#introduction',
        },
        {
          title: 'Get Started',
          url: '/documentation#get-started',
        },
        {
          title: 'Tutorials',
          url: '/documentation#tutorials',
        },
        {
          title: 'Changelog',
          url: '/documentation#changelog',
        },
      ],
    },
  ],
  projects: [],
};

const categoryIcons: { [key: string]: React.ElementType } = {
    ai: Bot,
    search: Search,
    downloaders: Download,
    tools: Cog,
    stalk: UserSearch,
    resep: Soup,
    random: ImageIcon,
    news: Newspaper,
    anime: Film,
    manga: BookOpen,
};


interface SidebarPageProps {
  children: React.ReactNode;
  breadcrumbs: { label: string; href?: string }[];
  user?: any;
}

export const SidebarPage = ({
  children,
  breadcrumbs,
  user,
}: SidebarPageProps) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [activeTeam, setActiveTeam] = React.useState(DATA.teams[0]);

  React.useEffect(() => {
    setActiveTeam(DATA.teams[Math.floor(Math.random() * DATA.teams.length)]);
  }, []);

  if (!activeTeam) return null;

  const activeUser = user || DATA.user;
  const isPrivilegedUser = !!user;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset" className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarHeader className="border-b border-sidebar-border/50 p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                  >
                    <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
                      <activeTeam.logo className="size-5" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold text-foreground">{activeTeam.name}</span>
                      <span className="truncate text-xs text-muted-foreground font-medium">{activeTeam.plan}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border shadow-lg"
                  align="start"
                  side={isMobile ? 'bottom' : 'right'}
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-3 py-2">
                    Switch Team
                  </DropdownMenuLabel>
                  {DATA.teams.map((team, index) => (
                    <DropdownMenuItem
                      key={team.name}
                      onClick={() => setActiveTeam(team)}
                      className="gap-3 p-3 rounded-lg hover:bg-accent focus:bg-accent transition-colors"
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5">
                        <team.logo className="size-4 shrink-0" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-xs text-muted-foreground">{team.plan}</span>
                      </div>
                      <DropdownMenuShortcut className="ml-auto text-xs">⌘{index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          {/* Nav Main */}
          <SidebarGroup className="mb-6">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Navigation
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {DATA.navMain.map((item) => {
                const isActive = pathname === item.url;
                if (!item.items) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        asChild
                        isActive={isActive}
                        className="h-10 px-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm"
                      >
                        <a href={item.url} className="flex items-center gap-3">
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <span className="font-medium">{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                const isParentActive = item.items.some((sub) =>
                  pathname.startsWith(sub.url.split('#')[0])
                );
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isParentActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className="h-10 px-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        >
                          <a href={item.url} className="flex items-center gap-3 flex-1">
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span className="font-medium">{item.title}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                          </a>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-6 mt-1">
                        <SidebarMenuSub className="space-y-1">
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                isActive={pathname === subItem.url}
                                asChild
                                className="h-8 px-3 rounded-md hover:bg-sidebar-accent/30 transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium"
                              >
                                <a href={subItem.url} className="text-sm">
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>

          {/* API Categories */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              API Categories
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {Object.keys(apiEndpoints).map((categoryKey) => {
                const category = apiEndpoints[categoryKey];
                const href = `/category/${categoryKey}`;
                const isActive = pathname === href;
                const Icon = categoryIcons[categoryKey] || Bot;
                return (
                  <SidebarMenuItem key={category.name}>
                    <SidebarMenuButton
                      tooltip={category.name}
                      asChild
                      isActive={isActive}
                      className="h-10 px-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm"
                    >
                      <a href={href} className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{category.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/50 p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="h-12 px-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
              >
                <Avatar className="h-9 w-9 rounded-xl border-2 border-primary/20">
                  <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                    {activeUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-foreground">{activeUser.name}</span>
                    {isPrivilegedUser && (
                      <BadgeCheck className="size-4 shrink-0 text-primary" />
                    )}
                  </div>
                  <span className="truncate text-xs text-muted-foreground font-medium">{activeUser.email}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-screen">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <SidebarTrigger className="h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors" />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb className="min-w-0 flex-1">
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem className="flex-shrink-0">
                  <BreadcrumbLink href="/" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                    Nex Api 〽️
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.length > 0 && <BreadcrumbSeparator className="text-muted-foreground/50" />}
                {breadcrumbs.length > 1 ? (
                  <>
                    <BreadcrumbItem className="hidden md:flex">
                      <BreadcrumbEllipsis className="text-muted-foreground/70" />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:flex text-muted-foreground/50" />
                    <BreadcrumbItem className="truncate">
                      {breadcrumbs[breadcrumbs.length - 1].href ? (
                        <BreadcrumbLink href={breadcrumbs[breadcrumbs.length - 1].href} className="hover:text-foreground transition-colors">
                          {breadcrumbs[breadcrumbs.length - 1].label.length > 12
                            ? `${breadcrumbs[breadcrumbs.length - 1].label.substring(0, 12)}...`
                            : breadcrumbs[breadcrumbs.length - 1].label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="truncate font-medium">
                          {breadcrumbs[breadcrumbs.length - 1].label.length > 12
                            ? `${breadcrumbs[breadcrumbs.length - 1].label.substring(0, 12)}...`
                            : breadcrumbs[breadcrumbs.length - 1].label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </>
                ) : (
                  breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbItem className="truncate">
                        {crumb.href ? (
                          <BreadcrumbLink href={crumb.href} className="hover:text-foreground transition-colors">
                            {crumb.label.length > 12
                              ? `${crumb.label.substring(0, 12)}...`
                              : crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="truncate font-medium">
                            {crumb.label.length > 12
                              ? `${crumb.label.substring(0, 12)}...`
                              : crumb.label}
                          </BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="text-muted-foreground/50" />}
                    </React.Fragment>
                  ))
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col min-h-0">
          <main className="container relative flex-1 py-2 sm:py-4 lg:py-8 min-h-0 max-w-full overflow-hidden">
            <HexagonBackground />
            <div className="relative z-10 w-full max-w-full overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
