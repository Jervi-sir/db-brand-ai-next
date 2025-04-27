import { CalendarProvider } from "./calendar-context";
import { SessionProvider } from "next-auth/react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Script from "next/script";
import { auth } from "@/app/(auth)/auth";
import { cookies } from "next/headers";
import { Separator } from "@/components/ui/separator";

export default async function Layout({ children }: { children: React.ReactNode }) {
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
          <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b pr-10">
              <div className="flex items-center gap-2 px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h4>Schedule</h4>
              </div>
            </header>
            <div className="flex flex-col gap-4 px-2 py-4">
              {children}
            </div>
          </>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
