import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Chat } from '@/types';
import InputArea from '@/components/Input-area';
import { Message } from '@/components/Message';
import { Message as MessageType } from '@/types';
import { v4 as uuid } from 'uuid';

export default function ChatPage({chatId, messages: initialMessages}: {chatId: Blob, messages: MessageType[]}) {
    const [messages, setMessages] = useState<MessageType[]>(initialMessages || []);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const assistantMessageIdRef = useRef<string | null>(null);

    const handleSubmit = async (e: React.FormEvent, content : string) => {
        e.preventDefault();
        
        const userMessage: MessageType = { id: uuid(), content, role: 'user', created_at: new Date().toISOString(), attachments: [] };
        setMessages(prev => [...prev, userMessage]);

        setIsStreaming(true);
        setStreamingContent('');
        assistantMessageIdRef.current = uuid(); 

        let accumulatedContent = '';
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch('/api/interaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    prompt: content,
                    role: 'user', 
                    chatId: chatId 
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            if (!response.body) {
                throw new Error("Response body is null");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                accumulatedContent += decoder.decode(value, { stream: true });
                setStreamingContent(accumulatedContent);
            }

            const finalAssistantMessage: MessageType = { 
                id: assistantMessageIdRef.current, 
                content: accumulatedContent, 
                role: 'assistant', 
                created_at: new Date().toISOString(), 
                attachments: [] 
            };
            setMessages(prev => [...prev, finalAssistantMessage]);

        } catch (error) {
            console.error('Streaming failed:', error);
            const errorAssistantMessage: MessageType = {
                id: assistantMessageIdRef.current,
                content: "Sorry, I couldn't get a response from the AI.",
                role: 'assistant',
                created_at: new Date().toISOString(),
                attachments: []
            };
            setMessages(prev => [...prev, errorAssistantMessage]);

        } finally {
            setIsStreaming(false);
            setStreamingContent('');
            assistantMessageIdRef.current = null;
        }
    };
    
    const outputRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [messages, streamingContent]);
    
    return (
        <AppLayout >
            <Head title="chat" />
            <div className="w-full flex flex-col items-center px-4 sm:px-6 md:px-8 text-black overflow-hidden">
                <div 
                    ref={outputRef}
                    className="h-[70vh] w-full max-w-4xl rounded-lg p-4 mb-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 no-scrollbar"   
                >
                    {messages?.length === 0 && !isStreaming &&
                        <div className='text-center'>
                            <h1 className='text-xl font-semibold'>Start a new chat</h1>
                            <p className='text-sm text-gray-500'>Start a new chat by typing a message</p>
                        </div>
                    }
                   {messages.map((message) => (
                    <Message key={message.id} content={message.content} role={message.role}></Message>
                   ))}
                   {isStreaming && assistantMessageIdRef.current && (
                       <Message key={assistantMessageIdRef.current} content={streamingContent} role="assistant" isStreaming={true} />
                   )}
                                  
                </div>
                
                    <InputArea isLoading={isStreaming} handleSubmit={handleSubmit} />
             
        
        </div>
    </AppLayout>
    );
}