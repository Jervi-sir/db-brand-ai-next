import { Settings } from "lucide-react";

import { CalendarProvider } from "../calendar/contexts/calendar-context";

import { ChangeBadgeVariantInput } from "../calendar/components/change-badge-variant-input";
import { ChangeVisibleHoursInput } from "../calendar/components/change-visible-hours-input";
import { ChangeWorkingHoursInput } from "../calendar/components/change-working-hours-input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { getEvents, getUsers } from "../calendar/requests";
import { SessionProvider } from "next-auth/react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Script from "next/script";
import { auth } from "@/app/(auth)/auth";
import { cookies } from "next/headers";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [events, users] = await Promise.all([getEvents(), getUsers()]);
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <SessionProvider session={session}>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} />
        <SidebarInset>
          <CalendarProvider users={users} events={events}>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b pr-10">
              <div className="flex items-center gap-2 px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h4>Schedule</h4>
              </div>
              <div className="ml-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 p-2 justify-start">
                      <Settings className="size-4" />
                      <p className="text-base font-semibold">Calendar settings</p>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-[460px]">
                    <div className="flex flex-col gap-6">
                      <ChangeBadgeVariantInput />
                      <ChangeVisibleHoursInput />
                      <ChangeWorkingHoursInput />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </header>

            <div className="flex flex-col gap-4 px-8 py-4">
              {children}
            </div>
          </CalendarProvider>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
