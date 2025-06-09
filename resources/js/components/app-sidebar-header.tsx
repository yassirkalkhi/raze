import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppSidebarHeader() {
    return (
        <header className="border-sidebar-border/50 bg-transparent border-l-0 flex h-16 shrink-0 items-center gap-2  px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
            </div>
        </header>
    );
}
