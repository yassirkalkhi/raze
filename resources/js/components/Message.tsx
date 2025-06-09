"use client"

import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
//@ts-ignore
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
//@ts-ignore
import { nord } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, ChevronDown, ChevronUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePage } from "@inertiajs/react"
import { SharedData } from "@/types"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface MessageProps {
    content: string
    className?: string
    role?: "user" | "assistant"
    isStreaming?: boolean
}

const markdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => <p className="mb-4 text-sm leading-6 text-gray-800 dark:text-gray-200">{children}</p>,
    pre: ({ children }: { children?: React.ReactNode }) => <pre className="p-0 bg-transparent">{children}</pre>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-6 mb-4 text-sm text-gray-800 dark:text-gray-200">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-6 mb-4 text-sm text-gray-800 dark:text-gray-200">{children}</ol>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="mb-1 leading-6">{children}</li>,
    h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-2xl font-bold mt-6 mb-3 border-b pb-1">{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-xl font-semibold mt-6 mb-2 border-b pb-1">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-lg font-semibold mt-5 mb-2">{children}</h3>,
    blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic text-gray-600 dark:text-gray-400 my-4">{children}</blockquote>,
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-2">{children}</a>,
    code(props: any) {
        const { inline, className, children, ...rest } = props
        const match = /language-(\w+)/.exec(className || "")
        if (inline) {
            return <code className="bg-gray-200 dark:bg-[#2E3440] rounded text-[0.7rem] px-1 py-0.5">{children}</code>
        }
        return match ? (
            <div className="rounded-md border my-4 bg-gray-900/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between w-full px-4 py-1 border-b border-gray-300 dark:border-white/10">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-300 capitalize">{match[1]}</span>
                    <button onClick={() => navigator.clipboard.writeText(String(children))} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <Copy size={13} />
                    </button>
                </div>
                <SyntaxHighlighter style={nord} language={match[1]} PreTag="div" className="!bg-transparent text-[0.8rem] w-full" {...rest}>
                    {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className="bg-gray-200 dark:bg-[#2E3440] rounded text-[0.7rem] px-1 py-0.5">{children}</code>
        )
    },
}

export const Message = ({ content, className, role = "assistant", isStreaming = false }: MessageProps) => {
    const { auth } = usePage<SharedData>().props
    const [showThoughts, setShowThoughts] = useState(false)

    let mainContent = content
    let thoughtContent = ""
    let isThinking = false

    if (role === "assistant") {
        const thinkStartTag = "<think>"
        const thinkEndTag = "</think>"
        const startIdx = content.indexOf(thinkStartTag)

        if (startIdx !== -1) {
            const endIdx = content.indexOf(thinkEndTag, startIdx)
            const beforeThink = content.substring(0, startIdx)

            if (endIdx !== -1) {
                thoughtContent = content.substring(startIdx + thinkStartTag.length, endIdx)
                const afterThink = content.substring(endIdx + thinkEndTag.length)
                mainContent = beforeThink + afterThink
                isThinking = false
            } else {
                if (isStreaming) {
                    thoughtContent = content.substring(startIdx + thinkStartTag.length)
                    mainContent = beforeThink
                    isThinking = true
                } else {
                    mainContent = content.substring(startIdx + thinkStartTag.length)
                    thoughtContent = ""
                    isThinking = false
                }
            }
        }
    }

    const ThinkingIndicator = () => (
        <div className="flex items-center ps-2">
            <div className="bg-white rounded-full w-3 h-3 animate-pulse"></div>
        </div>
    )

    return (
        <div className="group flex py-4 dark:text-white">
            <div className="flex-shrink-0 mt-1">
                {role === "user" ? (
                    <Avatar className="h-6 w-6 overflow-hidden">
                        <AvatarImage bgGradientOption={auth.user.avatar} />
                        <AvatarFallback gradientOption={auth.user.avatar} />
                    </Avatar>
                ) : (
                    <Avatar className="h-6 w-6 overflow-hidden">
                        <AvatarImage bgGradientOption={"from-rose-400 to-rose-600"} />
                    </Avatar>
                )}
            </div>
            <div className={cn("w-[calc(100%-44px)] rounded-lg pt-1 ps-2 text-[0.7rem] md:text-base break-words", role === "user" ? "" : "", className)}>
                {role === "user" ? (
                    <p className="text-sm leading-6 text-gray-800 dark:text-gray-200">{content}</p>
                ) : (
                    <>
                        {isThinking ? (
                            <ThinkingIndicator />
                        ) : (
                            !isStreaming &&
                            thoughtContent.trim() && (
                                <>
                                    <button className="flex ms-1 gap-2 mb-4 text-sm bg-primary-foreground text-gray-500 dark:text-gray-300 -mx-3" onClick={() => setShowThoughts(!showThoughts)}>
                                        <span>reasonings</span>
                                        {showThoughts ? <ChevronUp className="mt-1" size={16} /> : <ChevronDown className="mt-1" size={16} />}
                                    </button>
                                    <div className={cn(
                                        "transition-all duration-300 ease-in-out overflow-hidden",
                                        showThoughts ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                    )}>
                                        <div className="mt-2 mb-4 p-3 leading-5 border rounded-md text-xs text-gray-500">
                                            <ReactMarkdown components={markdownComponents}>{thoughtContent}</ReactMarkdown>
                                        </div>
                                    </div>
                                </>
                            )
                        )}
                        <div className={isThinking ? "opacity-0 h-0 overflow-hidden" : "opacity-100 transition-opacity duration-500"}>
                            <ReactMarkdown components={markdownComponents}>{mainContent}</ReactMarkdown>
                        </div>
                    </>
                )}
                {!isThinking && (
                    <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => navigator.clipboard.writeText(mainContent)} title="Copy message">
                            <Copy size={13} />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
