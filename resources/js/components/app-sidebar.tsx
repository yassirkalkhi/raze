import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { router, useForm, usePage } from '@inertiajs/react';
import { Button } from './ui/button';
import { useState } from 'react';





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
        </Sidebar>
    );
}
