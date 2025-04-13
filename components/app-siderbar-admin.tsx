"use client"

import * as React from "react"
import { Bot, Code2, Command, Settings2, SquareTerminal, TowerControlIcon, Unlock, X, } from "lucide-react"

import { 
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar, 
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from "@/components/ui/sidebar"
import { ChevronRight, type LucideIcon } from "lucide-react"

import { User } from "next-auth"
import { usePathname, useRouter } from "next/navigation"
import { SidebarUserNav } from '@/components/sidebar-user-nav';

const data = {
  navMain: [
    {
      title: "menu1",
      url: "/dashboard",
      icon: SquareTerminal,
    },
    // {
    //   title: "Models",
    //   url: "/dashboard/models",
    //   icon: Bot,

    // },
    {
      title: "Ai Usage",
      url: "/dashboard/ai-usage",
      icon: TowerControlIcon,

    },
    {
      title: "Ai Settings",
      url: "/dashboard/ai-settings",
      icon: Settings2,
    },
    {
      title: "Unlocking Codes",
      url: "/dashboard/unlocking-codes",
      icon: Unlock,
    },
  ],

  navBottom: [
    {
      title: "Exit Dashboard",
      url: "/",
      icon: X,
    },
  ]
}


export function AppSidebarAdmin({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Dr Brandlin ai</span>
                  <span className="truncate text-xs">Admin</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label={'Platform'} items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={data.navBottom} />
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}


export function NavMain({
  label,
  items,
}: {
  label?: string,
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
  }[]
}) {
  const pathname = usePathname()
  return (
    <SidebarGroup>
      { label
        &&
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
      }
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title} className={pathname === item.url ? 'bg-neutral-950 rounded-lg' : 'rounded-lg'}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <a href={item.url} className={pathname === item.url ? 'bg-neutral-950 rounded-lg text-white' : 'rounded-lg'}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>

          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
