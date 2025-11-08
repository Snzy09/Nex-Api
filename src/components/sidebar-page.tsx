
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
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          {/* Team Switcher */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <activeTeam.logo className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{activeTeam.name}</span>
                      <span className="truncate text-xs">{activeTeam.plan}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side={isMobile ? 'bottom' : 'right'}
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Teams
                  </DropdownMenuLabel>
                  {DATA.teams.map((team, index) => (
                    <DropdownMenuItem
                      key={team.name}
                      onClick={() => setActiveTeam(team)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <team.logo className="size-4 shrink-0" />
                      </div>
                      {team.name}
                      <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
          {/* Team Switcher */}
        </SidebarHeader>

        <SidebarContent>
          {/* Nav Main */}
          <SidebarGroup>
            <SidebarGroupLabel>Feature</SidebarGroupLabel>
            <SidebarMenu>
              {DATA.navMain.map((item) => {
                const isActive = pathname === item.url;
                if (!item.items) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        asChild
                        isActive={isActive}
                      >
                        <a href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
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
                        <SidebarMenuButton tooltip={item.title} asChild>
                          <a href={item.url}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                          </a>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                isActive={pathname === subItem.url}
                                asChild
                              >
                                <a href={subItem.url}>
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
            <SidebarGroupLabel>Our Category Feature</SidebarGroupLabel>
            <SidebarMenu>
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
                    >
                      <a href={href}>
                        <Icon />
                        <span>{category.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {/* Nav User */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="truncate font-semibold">{activeUser.name}</span>
                    {isPrivilegedUser && (
                      <BadgeCheck className="size-4 shrink-0 text-primary" />
                    )}
                  </div>
                  <span className="truncate text-xs">{activeUser.email}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {/* Nav User */}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-screen">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb className="min-w-0 flex-1">
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem className="flex-shrink-0">
                  <BreadcrumbLink href="/">Nex Api 〽️</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
                {breadcrumbs.length > 1 ? (
                  <>
                    <BreadcrumbItem className="hidden sm:flex">
                      <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden sm:flex" />
                    <BreadcrumbItem className="truncate">
                      {breadcrumbs[breadcrumbs.length - 1].href ? (
                        <BreadcrumbLink href={breadcrumbs[breadcrumbs.length - 1].href}>
                          {breadcrumbs[breadcrumbs.length - 1].label.length > 10
                            ? `${breadcrumbs[breadcrumbs.length - 1].label.substring(0, 10)}...`
                            : breadcrumbs[breadcrumbs.length - 1].label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="truncate">
                          {breadcrumbs[breadcrumbs.length - 1].label.length > 10
                            ? `${breadcrumbs[breadcrumbs.length - 1].label.substring(0, 10)}...`
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
                          <BreadcrumbLink href={crumb.href}>
                            {crumb.label.length > 10
                              ? `${crumb.label.substring(0, 10)}...`
                              : crumb.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="truncate">
                            {crumb.label.length > 10
                              ? `${crumb.label.substring(0, 10)}...`
                              : crumb.label}
                          </BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
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
