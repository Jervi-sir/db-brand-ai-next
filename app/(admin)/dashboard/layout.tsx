import { cookies } from 'next/headers';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

import { auth } from '../../(auth)/auth';
import Script from 'next/script';
import { AppSidebarAdmin } from '@/components/app-siderbar-admin';
import { Separator } from '@/components/ui/separator';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebarAdmin user={session?.user} />
        <SidebarInset>
        
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
