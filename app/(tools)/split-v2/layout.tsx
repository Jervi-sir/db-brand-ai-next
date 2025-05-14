// layout.tsx
import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { auth } from '../../(auth)/auth';
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import { Separator } from '@/components/ui/separator';

export const experimental_ppr = true;

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
          <header className="flex h-16 shrink-0 items-center gap-2 border-b pr-10">
            <div className="flex items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h4>Split</h4>
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}