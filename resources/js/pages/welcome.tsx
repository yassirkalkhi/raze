import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MountainIcon, ZapIcon, MoonIcon, HeartIcon, BotIcon, BrainCircuitIcon } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome to Raze" />
            <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                <header className="sticky top-0 z-50 w-full border-b bg-white bg-opacity-80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950 dark:bg-opacity-80">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                        <Link href="/" className="flex items-center gap-2">
                            <AppLogo />
                        </Link>
                        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                            <Link href="#features" className="hover:text-pink-500">
                                Features
                            </Link>
                            <Link href="#about" className="hover:text-pink-500">
                                About
                            </Link>
                        </nav>
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link href={route('dashboard')}>
                                    <Button>Dashboard</Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')}>
                                        <Button variant="ghost">Log In</Button>
                                    </Link>
                                    <Link href={route('register')}>
                                        <Button className="bg-pink-500 text-white hover:bg-pink-600">
                                            Sign Up
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1">
                    <section className="relative w-full py-20 md:py-32 lg:py-40">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 opacity-50"></div>
                        <div className="container mx-auto px-4 text-center md:px-6 relative">
                            <div className="max-w-3xl mx-auto">
                                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                                    The Future of Productivity is{' '}
                                    <span className="text-pink-500">Raze</span>
                                </h1>
                                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300 md:text-xl">
                                    Supercharge your workflow and collaborate seamlessly with our
                                    next-generation platform.
                                </p>
                                <div className="mt-8 flex justify-center gap-4">
                                    <Link href={route('register')}>
                                        <Button size="lg" className="bg-pink-500 text-white hover:bg-pink-600 shadow-lg">
                                            Get Started for Free
                                        </Button>
                                    </Link>
                                    <Link href="#features">
                                        <Button size="lg" variant="outline">
                                            Learn More
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section id="features" className="w-full py-20 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
                        <div className="container mx-auto px-4 md:px-6">
                            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                                <div className="inline-block rounded-lg bg-pink-100 px-3 py-1 text-sm text-pink-600 dark:bg-pink-900/50 dark:text-pink-300">
                                    Key Features
                                </div>
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                                    Everything You Need to Succeed
                                </h2>
                                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                                    Our platform is supercharged with AI to help you and your team be more productive.
                                </p>
                            </div>
                            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-lg font-medium">AI Chat</CardTitle>
                                        <BotIcon className="w-6 h-6 text-pink-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Engage with an intelligent AI assistant that understands your needs.
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-lg font-medium">Retrieval-Augmented Generation</CardTitle>
                                        <BrainCircuitIcon className="w-6 h-6 text-pink-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Get context-aware answers from your own knowledge base.
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-lg font-medium">Seamless Collaboration</CardTitle>
                                        <ZapIcon className="w-6 h-6 text-pink-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Work together with your team in real-time.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>

                    <section id="how-it-works" className="w-full py-20 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
                        <div className="container mx-auto px-4 md:px-6">
                            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                                <div className="inline-block rounded-lg bg-pink-100 px-3 py-1 text-sm text-pink-600 dark:bg-pink-900/50 dark:text-pink-300">
                                    How It Works
                                </div>
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                                    Get Started in 3 Simple Steps
                                </h2>
                                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                                    Start using Raze today and revolutionize your workflow.
                                </p>
                            </div>
                            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 sm:grid-cols-3">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                                        <div className="text-3xl font-bold">1</div>
                                    </div>
                                    <h3 className="text-xl font-bold">Sign Up</h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Create your account in seconds.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                                        <div className="text-3xl font-bold">2</div>
                                    </div>
                                    <h3 className="text-xl font-bold">Connect Data</h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Connect your knowledge base or documents.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                                        <div className="text-3xl font-bold">3</div>
                                    </div>
                                    <h3 className="text-xl font-bold">Start Chatting</h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Ask questions and get instant, smart answers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer id="about" className="border-t bg-gray-100 py-6 dark:bg-gray-950 dark:border-gray-800">
                    <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
                        <div className="flex items-center gap-2">
                            <AppLogo />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            © {new Date().getFullYear()} Raze Inc. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="text-gray-500 hover:text-pink-500 dark:text-gray-400">
                                <HeartIcon className="h-6 w-6" />
                                <span className="sr-only">GitHub</span>
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
