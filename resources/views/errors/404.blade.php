<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 - Not Found</title>

    @vite(['resources/css/app.css'])

    <style>
        html {
            font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-100 selection:bg-neutral-700 selection:text-neutral-100 p-6 antialiased">
    <div class="w-full max-w-lg mx-auto text-center">
        <div class="mb-10">
            <svg class="mx-auto h-20 w-20 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:rgb(82,82,82);stop-opacity:1" />
                        <stop offset="100%" style="stop-color:rgb(38,38,38);stop-opacity:1" />
                    </linearGradient>
                </defs>
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#grad1)"></path>
                <path d="M2 17L12 22L22 17" stroke="url(#grad1)"></path>
                <path d="M2 12L12 17L22 12" stroke="url(#grad1)"></path>
                <circle cx="12" cy="12" r="3" fill="rgb(250 250 250 / 0.1)" />
            </svg>
        </div>

        <h1 class="text-7xl md:text-8xl font-black text-neutral-50 tracking-tighter leading-none">
            404
        </h1>
        <p class="mt-4 text-xl md:text-2xl font-medium text-neutral-300">
            Page Not Found
        </p>
        <p class="mt-5 text-base text-neutral-500 max-w-sm mx-auto">
            The page you are trying to access could not be located. It might have been moved, deleted, or the URL might be incorrect.
        </p>

        <div class="mt-12">
            <a href="{{ url('/') }}"
               class="inline-flex items-center justify-center rounded-lg text-base font-semibold transition-colors duration-300
                      bg-neutral-50 text-neutral-900 hover:bg-neutral-200
                      focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-950
                      h-12 px-10 py-3 shadow-lg hover:shadow-neutral-50/10
                      transform hover:-translate-y-1 active:translate-y-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Go to Homepage
            </a>
        </div>

        <footer class="mt-20 border-t border-neutral-800/50 pt-8">
            <p class="text-xs text-neutral-600 hover:text-neutral-500 transition-colors">
                &copy; {{ date('Y') }} Your App Name &mdash; Status: <span class="font-semibold">Lost in Cyberspace</span>
            </p>
        </footer>
    </div>
</body>
</html>
