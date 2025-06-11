import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, DragEvent, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UploadCloud, X, Trash2, AlertCircle, FileText, FileCode, FileImage, FileArchive, LayoutGrid, List, Plus, Search, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface Document {
    id: number;
    name: string;
    path: string;
    size: number;
    last_modified: number;
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface Stats {
    total_documents: number;
    total_storage: number;
}

interface PageProps {
    documents: Document[];
    stats: Stats;
    flash?: {
        success?: string;
        error?: string;
    }
    [key: string]: any;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileTypeIcon = ({ type, className }: { type: string, className?: string }) => {
    const iconClass = cn("h-8 w-8", className);
    const colorMap: { [key: string]: string } = {
        pdf: "#D93831",
        docx: "#2A5699",
    };
    const color = colorMap[type.toLowerCase()];

    switch (type.toLowerCase()) {
        case 'pdf': return <FileCode className={iconClass} color={color} />;
        case 'docx': return <FileText className={iconClass} color={color} />;
        case 'txt': return <FileText className={iconClass} />;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif': return <FileImage className={iconClass} />;
        default: return <FileArchive className={iconClass} />;
    }
};

export default function RagUpload() {
    const { documents, stats, flash } = usePage<PageProps>().props;
    const [dragActive, setDragActive] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string }>({});
    const ITEMS_PER_PAGE = view === 'grid' ? 12 : 10;

    const { data, setData, post, processing, errors, progress, reset } = useForm<{ file: File | null }>({
        file: null,
    });

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
        if (flash?.error) {
            setShowError(true);
            const timer = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) setData('file', e.dataTransfer.files[0]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setData('file', e.target.files[0]);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('rag.store'), {
            onSuccess: () => {
                reset();
                setUploadModalOpen(false);
            },
            preserveScroll: true,
        });
    };
    
    const removeFile = useCallback(() => reset('file'), [reset]);

    const handleDelete = useCallback((path: string) => {
        if (confirm('Are you sure you want to delete this file?')) {
            router.delete(route('rag.destroy'), { data: { path }, preserveScroll: true });
        }
    }, [router]);

    const filteredDocuments = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = searchTerm
            ? documents.filter(doc => doc.name.toLowerCase().includes(lowercasedFilter))
            : documents;

        return {
            all: filtered,
            pdf: filtered.filter(d => d.type === 'pdf'),
            docx: filtered.filter(d => d.type === 'docx'),
            txt: filtered.filter(d => d.type === 'txt'),
            images: filtered.filter(d => ['png', 'jpg', 'jpeg'].includes(d.type)),
        }
    }, [documents, searchTerm]);

    const paginatedDocuments = useMemo(() => {
        const docs = filteredDocuments[activeTab as keyof typeof filteredDocuments];
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return docs.slice(startIndex, endIndex);
    }, [filteredDocuments, currentPage, ITEMS_PER_PAGE, activeTab]);
    
    const totalPages = useMemo(() => {
        const totalDocs = filteredDocuments[activeTab as keyof typeof filteredDocuments].length;
        return Math.ceil(totalDocs / ITEMS_PER_PAGE);
    }, [filteredDocuments, ITEMS_PER_PAGE, activeTab]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, view]);

    useEffect(() => {
        const fetchImagePreviews = async () => {
            const imageDocs = paginatedDocuments.filter(doc => isImage(doc.type) && !imagePreviews[doc.id]);
            if (imageDocs.length === 0) return;

            const newPreviews: { [key: string]: string } = {};
            // This is a placeholder for the secret. In a real app, this should come from a secure place.
            const apiKey = 'Yassirkalkhi0987@'; 

            for (const doc of imageDocs) {
                try {
                    const response = await fetch(route('documents.view', { document: doc.id }), {
                        headers: { 'X-API-Key': apiKey }
                    });
                    if (response.ok) {
                        const blob = await response.blob();
                        newPreviews[doc.id] = URL.createObjectURL(blob);
                    }
                } catch (error) {
                    console.error('Error fetching image preview:', error);
                }
            }
            setImagePreviews(prev => ({ ...prev, ...newPreviews }));
        };

        if (view === 'grid') {
            fetchImagePreviews();
        }
    }, [paginatedDocuments, view]);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const isImage = (type: string) => ['png', 'jpg', 'jpeg'].includes(type.toLowerCase());

    const StatusIndicator = ({ status }: { status: Document['status'] }) => {
        const baseClass = "h-2.5 w-2.5 rounded-full mr-2";
        switch (status) {
            case 'completed':
                return <Tooltip><TooltipTrigger><div className={cn(baseClass, "bg-green-500")}></div></TooltipTrigger><TooltipContent>Completed</TooltipContent></Tooltip>;
            case 'processing':
                return <Tooltip><TooltipTrigger><div className={cn(baseClass, "bg-yellow-500 animate-pulse")}></div></TooltipTrigger><TooltipContent>Processing</TooltipContent></Tooltip>;
            case 'failed':
                return <Tooltip><TooltipTrigger><div className={cn(baseClass, "bg-red-500")}></div></TooltipTrigger><TooltipContent>Failed</TooltipContent></Tooltip>;
            default:
                return null;
        }
    };

    const renderDocumentGrid = useCallback((docs: Document[]) => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {docs.length > 0 ? docs.map((doc) => (
                <Card key={doc.path} className="group relative overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8 bg-black/50 hover:bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDelete(doc.path)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <div className="aspect-square w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                        {isImage(doc.type) ? (
                            imagePreviews[doc.id] ? (
                                <img src={imagePreviews[doc.id]} alt={doc.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <FileImage className="h-16 w-16 text-gray-300 dark:text-gray-600 animate-pulse" />
                                </div>
                            )
                        ) : (
                            <FileTypeIcon type={doc.type} className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                        )}
                    </div>
                    <div className="p-2 border-t dark:border-gray-700 bg-white dark:bg-gray-950">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center">
                                    <StatusIndicator status={doc.status} />
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 w-full truncate">{doc.name}</p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>{doc.name}</TooltipContent>
                        </Tooltip>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-4">{formatBytes(doc.size)}</p>
                    </div>
                </Card>
            )) : (
                <div className="col-span-full h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No documents found.
                </div>
            )}
        </div>
    ), [handleDelete, imagePreviews]);

    const renderDocumentTable = useCallback((docs: Document[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Size</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded At</TableHead>
                    <TableHead className="text-right">
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {docs.length > 0 ? docs.map((doc) => (
                    <TableRow key={doc.path}>
                        <TableCell className="font-medium flex items-center">
                            <StatusIndicator status={doc.status} />
                            <FileTypeIcon type={doc.type} className="h-6 w-6 mr-3 shrink-0" />
                            <span className="truncate">{doc.name}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{formatBytes(doc.size)}</TableCell>
                        <TableCell className="hidden md:table-cell">{new Date(doc.last_modified * 1000).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">More actions</span>
                            </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDelete(doc.path)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No documents found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    ), [handleDelete]);
    
    const renderContent = useCallback((docs: Document[]) => {
        if (view === 'grid') return renderDocumentGrid(docs);
        return renderDocumentTable(docs);
    }, [view, renderDocumentGrid, renderDocumentTable]);

    return (
        <AppLayout>
            <Head title="RAG Management" />
            <TooltipProvider>
                <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">

                    <Dialog open={isUploadModalOpen} onOpenChange={setUploadModalOpen}>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle>Upload New Document</DialogTitle>
                                <DialogDescription>Select a file to upload. Max size: 10MB.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                    <div 
                                    className={cn("relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", dragActive ? "border-blue-500" : "border-gray-300 dark:border-gray-600")}
                                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                    >
                                        {data.file ? (
                                            <div className="text-center p-8 relative">
                                            <FileTypeIcon type={data.file.type.split('/')[1] || 'default'} className="h-16 w-16 mx-auto mb-4" />
                                                <p className="mt-2 font-semibold text-gray-700 dark:text-gray-200">{data.file.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(data.file.size)}</p>
                                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removeFile}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <input id="dropzone-file" type="file" className="hidden" onChange={handleChange} accept=".txt,.pdf,.docx,.png,.jpg,.jpeg" />
                                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <UploadCloud className="h-10 w-10 mb-4 text-gray-500 dark:text-gray-400" />
                                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Supported files (MAX. 10MB)</p>
                                                    </div>
                                                </label>
                                            </>
                                        )}
                                    </div>
                                    {progress && (
                                        <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                                            <div className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: `${progress.percentage}%` }}>{progress.percentage}%</div>
                                        </div>
                                    )}
                                    {errors.file && <p className="text-sm text-red-600 mt-2">{errors.file}</p>}
                                    <Button type="submit" className="w-full" disabled={!data.file || processing}>
                                        {processing ? 'Uploading...' : 'Upload File'}
                                    </Button>
                                </form>
                        </DialogContent>
                    </Dialog>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white sm:text-3xl">Docs</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage documents for Retrieval-Augmented Generation.</p>
                        </div>
                        <Button onClick={() => setUploadModalOpen(true)}>
                            <Plus className="-ml-1 mr-2 h-4 w-4" />
                            Upload File
                        </Button>
                    </div>

                    {showSuccess && flash?.success && (
                        <Alert variant="default" className="mb-6 bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800">
                            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
                            <AlertDescription className="text-green-700 dark:text-green-300">{flash.success}</AlertDescription>
                        </Alert>
                    )}
                    {showError && flash?.error && (
                         <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{flash.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex items-center gap-6 mb-6">
                        <div className="flex items-center gap-3">
                            <FileArchive className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Documents</p>
                                <p className="text-xl font-bold">{stats.total_documents}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FileArchive className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Storage Used</p>
                                <p className="text-xl font-bold">{formatBytes(stats.total_storage)}</p>
                            </div>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <Card>
                            <CardHeader className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>Your Documents</CardTitle>
                                        <CardDescription className="mt-1">
                                            Browse, search, and manage your files.
                                        </CardDescription>
                                    </div>
                                    <div className="flex w-full sm:w-auto items-center gap-2">
                                        <div className="relative flex-grow sm:flex-grow-0">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Search..."
                                                className="pl-8 w-full sm:w-[200px] lg:w-[250px]"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')} aria-label="Grid view">
                                                    <LayoutGrid className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Grid View</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} aria-label="List view">
                                                    <List className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>List View</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                                <TabsList className="mt-4 -mb-5 -mx-5 sm:-mx-7 px-4 sm:px-6 border-t border-gray-200 dark:border-gray-700 grid w-full grid-cols-3 sm:w-auto sm:grid-cols-5 rounded-none bg-transparent">
                                        <TabsTrigger value="all">All</TabsTrigger>
                                        <TabsTrigger value="pdf">PDF</TabsTrigger>
                                        <TabsTrigger value="docx">Docx</TabsTrigger>
                                        <TabsTrigger value="txt">Text</TabsTrigger>
                                        <TabsTrigger value="images">Images</TabsTrigger>
                                    </TabsList>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <TabsContent value="all" className="mt-0">{renderContent(paginatedDocuments)}</TabsContent>
                                <TabsContent value="pdf" className="mt-0">{renderContent(paginatedDocuments)}</TabsContent>
                                <TabsContent value="docx" className="mt-0">{renderContent(paginatedDocuments)}</TabsContent>
                                <TabsContent value="txt" className="mt-0">{renderContent(paginatedDocuments)}</TabsContent>
                                <TabsContent value="images" className="mt-0">{renderContent(paginatedDocuments)}</TabsContent>

                                {totalPages > 1 && (
                                    <Pagination className="mt-6">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} aria-disabled={currentPage === 1} />
                                            </PaginationItem>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <PaginationItem key={i}>
                                                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }} isActive={currentPage === i + 1}>
                                                        {i + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} aria-disabled={currentPage === totalPages} />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </CardContent>
                        </Card>
                    </Tabs>
                </div>
            </TooltipProvider>
        </AppLayout>
    );
} 