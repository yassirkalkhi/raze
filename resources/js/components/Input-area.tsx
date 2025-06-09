"use client"

import React, { KeyboardEvent, useEffect } from "react"

import { useState, useRef, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Paperclip, X, Loader2, ArrowUp, ImageIcon, FileText, MessageSquarePlus, MessageSquarePlusIcon, MessageSquare, Command } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface FileAttachment {
  file: File
  preview: string
}

interface InputAreaProps {
  isLoading: boolean
  handleSubmit: (e: FormEvent, content: string, files?: File[]) => Promise<void> | void
  placeholder?: string
  className?: string
}

export default function InputArea({
  isLoading,
  handleSubmit,
  placeholder = "Type your message... ",
  className,
}: InputAreaProps) {
  const [input, setInput] = useState<string>("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    if (isMobile) return;

    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape' && isPaletteOpen) {
        e.preventDefault();
        setIsPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isPaletteOpen, isMobile]);

  useEffect(() => {
    if (isMobile) return;

    if (isPaletteOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50); 
    }
  }, [isPaletteOpen, isMobile]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (attachments.length >= 5) {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return; // Max 5 files allowed
      }

      const filesToAdd = Array.from(e.target.files);
      const remainingSlots = 5 - attachments.length;
      const newFiles = filesToAdd.slice(0, remainingSlots).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setAttachments((prev) => [...prev, ...newFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].preview);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() !== "" || attachments.length > 0) {
        submitForm(e as unknown as FormEvent);
      }
    }
  };

  const submitForm = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() !== "" || attachments.length > 0) {
      const filesToSend = attachments.map(att => att.file);
      handleSubmit(e, input, filesToSend.length > 0 ? filesToSend : undefined); 
      setInput("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      if (!isMobile) {
        setIsPaletteOpen(false);
      }
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const FormContent = (
    <div 
      className={cn(
        "bg-background rounded-lg shadow-2xl w-[80%]  mx-auto flex flex-col overflow-hidden max-h-[80vh] fixed bottom-2 left-0 right-0",
        !isMobile && "flex flex-col  max-w-xl md:max-w-2xl   animate-in fade-in zoom-in-95 duration-200",
        className 
      )}
      onClick={!isMobile ? (e) => e.stopPropagation() : undefined}
    >
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border-b border-border/50 overflow-y-auto max-h-32">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 hover:bg-muted/70 rounded text-xs text-muted-foreground transition-colors max-w-[200px]">
                <div className="w-5 h-5 bg-background rounded flex items-center justify-center overflow-hidden shrink-0">
                  {attachment.file.type.startsWith("image/") ? (
                    <img
                      src={attachment.preview || "/placeholder.svg"}
                      alt={attachment.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(attachment.file.type)
                  )}
                </div>
                <div className="flex flex-col overflow-hidden flex-grow">
                  <span className="text-xs truncate" title={attachment.file.name}>{attachment.file.name}</span>
                  <span className="text-[10px] opacity-70">{(attachment.file.size / (1024 * 1024)).toFixed(2)}MB</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full opacity-60 hover:opacity-100 hover:bg-background/70 transition-all ml-auto shrink-0"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove attachment</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <form
        onSubmit={submitForm}
        className="flex items-end gap-2 p-3 "
      >
        <div className="flex-1 flex items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleTextareaKeyDown}
            onFocus={adjustTextareaHeight}  
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full  resize-none py-3 px-4 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 no-scrollbar min-h-[56px] max-h-[200px] text-foreground placeholder:text-xs text-sm"
            rows={1}
            maxLength={3000}
          />
        </div>
        <div className="flex items-center gap-1 self-end pb-1"> 
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || attachments.length >= 5}
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            type="submit"
            size="icon"
            className="h-7 w-7 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            disabled={isLoading || (input.trim() === "" && attachments.length === 0)}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
        <div className="w-full max-w-4xl">
            {FormContent}
        </div>
    );
  }

  if (!isPaletteOpen) {
    return (
      <Button 
        className="fixed bottom-8 right-8 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg" 
        onClick={() => setIsPaletteOpen(true)}
      >
        <span>Press for chat or</span>
        <div className="flex items-center -gap-1">
          <Command className="h-4 w-4" />
          <span>+</span>
          <span>K</span>
        </div>
        
      </Button>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setIsPaletteOpen(false)}
    >
      {FormContent}
    </div>
  );
}
