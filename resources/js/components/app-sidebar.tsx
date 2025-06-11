import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Button } from './ui/button';
import { useState } from 'react';
import { FileUp } from 'lucide-react';





export function AppSidebar() {
    const {  chats } = usePage().props as any;
    
    const { post } = useForm({
        title: 'New Chat',
    });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(chats);
        post(route('chats.store'), {
            onError: () => {
               alert('Something went wrong, please try again.');
                
            },
        });
    };
    
    return (
        <Sidebar collapsible="offcanvas" variant="inset" >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <NavUser />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

                    <Button variant={'secondary'} className='m-3 mt-1 mb-8 cursor-pointer' onClick={handleSubmit}>
                        New Chat
                    </Button>
            
            <SidebarContent>
                <NavMain chats={chats || []} />
            </SidebarContent>
            <SidebarFooter>
            <Link href={route('rag.create')} className="flex items-center gap-x-2.5 px-6 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100">
                <FileUp className="h-5 w-5" />
                <span>Upload RAG</span>
            </Link>
            </SidebarFooter>
        </Sidebar>
    );
}
