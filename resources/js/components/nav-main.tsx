import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type Chat } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown } from 'lucide-react';

export function NavMain({ chats = [] }: { chats: Chat[] }) {
    const page = usePage();
    const href = 'https://localhost:8000/';
    return (
        <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger>
              Recent
              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
          <SidebarMenu className='no-scrollbar'>
             {chats.map((chat) => (
                 <SidebarMenuItem key={chat.id}>
                     <SidebarMenuButton asChild isActive={(href+'chat/'+chat.id) === page.url}
                         tooltip={{ children: chat.title }}
                     >
                         <Link href={`/chat/${chat.id}`} prefetch>
                             <span className='text-xs dark:text-gray-200'>{chat.title}</span>
                         </Link>
                     </SidebarMenuButton>
                 </SidebarMenuItem>
             ))}
         </SidebarMenu>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
}
