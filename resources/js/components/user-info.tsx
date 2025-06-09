import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';
import { Badge } from './ui/badge';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
    const getInitials = useInitials();
    console.log(user)

    return (
        <>
            <Avatar className="h-6 w-6 overflow-hidden">
                <AvatarImage  bgGradientOption={user.avatar} />
                <AvatarFallback/>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <div className='flex items-center justify-between'>
                 <span className="truncate font-medium">{user.name}</span>
                <Badge  variant={'secondary'} className='overflow-hidden w-8 h-4 text-[0.6rem]'>free</Badge>   
                </div>
                
                {showEmail && <span className="text-muted-foreground truncate text-xs">{user.email}</span>}
            </div>  
            
        </>
    );
}
