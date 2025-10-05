import Link from 'next/link'
import { EventsCalendarSection } from '@/components/events/events-calendar-section'

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#0a0513]">
      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0a0513] via-[#15092b] to-[#0a0513] opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-fuchsia-600/8 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="relative sticky top-0 z-50 backdrop-blur-xl bg-[#0a0513]/90 border-b border-purple-900/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#9333ea" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Outer ring - Station */}
                  <circle cx="20" cy="20" r="18" fill="none" stroke="url(#logo-gradient)" strokeWidth="2" opacity="0.3" />
                  {/* Middle ring */}
                  <circle cx="20" cy="20" r="13" fill="none" stroke="url(#logo-gradient)" strokeWidth="2.5" opacity="0.6" />
                  {/* Inner core - representing depth */}
                  <circle cx="20" cy="20" r="7" fill="url(#logo-gradient)" filter="url(#glow)" />
                  {/* Connection nodes - representing network/station */}
                  <circle cx="20" cy="6" r="1.5" fill="#d946ef" opacity="0.8" />
                  <circle cx="34" cy="20" r="1.5" fill="#d946ef" opacity="0.8" />
                  <circle cx="20" cy="34" r="1.5" fill="#d946ef" opacity="0.8" />
                  <circle cx="6" cy="20" r="1.5" fill="#d946ef" opacity="0.8" />
                  {/* Energy waves */}
                  <path d="M 20 20 L 20 6" stroke="#d946ef" strokeWidth="1" opacity="0.4" />
                  <path d="M 20 20 L 34 20" stroke="#d946ef" strokeWidth="1" opacity="0.4" />
                  <path d="M 20 20 L 20 34" stroke="#d946ef" strokeWidth="1" opacity="0.4" />
                  <path d="M 20 20 L 6 20" stroke="#d946ef" strokeWidth="1" opacity="0.4" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                DeepStation
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#capabilities" className="text-slate-400 hover:text-white font-medium transition-colors">
                Capabilities
              </a>
              <a href="#channels" className="text-slate-400 hover:text-white font-medium transition-colors">
                Channels
              </a>
              <a href="#demo" className="text-slate-400 hover:text-white font-medium transition-colors">
                Demo
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-slate-400 hover:text-white font-medium transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all hover:from-fuchsia-500 hover:to-purple-600"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-purple-950/30 backdrop-blur-sm border border-purple-900/30 rounded-full px-5 py-2.5">
                <div className="w-2 h-2 bg-fuchsia-500 rounded-full"></div>
                <span className="text-sm text-slate-300 font-medium">AI-Powered Orchestration Engine</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
                The Brain Behind Your
                <br />
                <span className="bg-gradient-to-r from-fuchsia-400 to-purple-500 bg-clip-text text-transparent">
                  Marketing Automation
                </span>
              </h1>

              <p className="text-xl text-slate-400 leading-relaxed">
                Centralized intelligence layer that orchestrates social posting, newsletters, events, chatbots, and every communication channel from a single automation platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:from-fuchsia-500 hover:to-purple-600 flex items-center justify-center gap-2"
                >
                  Start Building
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#demo"
                  className="bg-purple-950/30 backdrop-blur-sm text-white px-10 py-4 rounded-lg font-semibold text-lg border border-purple-900/30 hover:bg-purple-950/50 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </a>
              </div>
            </div>

            {/* Right: Architecture Diagram */}
            <div className="relative">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9333ea" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Architecture Visual */}
              <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-8">
                <div className="space-y-6">
                  {/* Top Layer: Output Channels */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Output Channels</div>
                    <div className="grid grid-cols-4 gap-3">
                      {/* LinkedIn */}
                      <div className="bg-blue-950/30 border border-blue-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="#0A66C2" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">LinkedIn</span>
                      </div>

                      {/* Instagram */}
                      <div className="bg-pink-950/30 border border-pink-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="url(#instagram-gradient)" viewBox="0 0 24 24">
                          <defs>
                            <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#FD5949"/>
                              <stop offset="50%" stopColor="#D6249F"/>
                              <stop offset="100%" stopColor="#285AEB"/>
                            </linearGradient>
                          </defs>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">Instagram</span>
                      </div>

                      {/* X (Twitter) */}
                      <div className="bg-slate-950/30 border border-slate-700/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="#ffffff" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">X</span>
                      </div>

                      {/* Discord */}
                      <div className="bg-indigo-950/30 border border-indigo-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="#5865F2" viewBox="0 0 24 24">
                          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">Discord</span>
                      </div>
                    </div>
                  </div>

                  {/* Animated Connection Lines - Output */}
                  <div className="flex justify-center relative h-8">
                    <div className="w-px h-full bg-gradient-to-b from-purple-600/30 to-fuchsia-600/30"></div>
                    <div className="absolute inset-0 flex justify-center">
                      <div className="w-px h-full bg-gradient-to-b from-purple-500 to-fuchsia-500 opacity-0 animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>

                  {/* Middle Layer: DeepStation Orchestration */}
                  <div>
                    <div className="bg-gradient-to-r from-fuchsia-950/40 to-purple-950/40 border-2 border-fuchsia-600/50 rounded-xl p-6 relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0a0513] px-3">
                        <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider">Orchestration</span>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10">
                          <svg viewBox="0 0 40 40" className="w-full h-full">
                            <defs>
                              <linearGradient id="hero-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#d946ef" />
                                <stop offset="100%" stopColor="#9333ea" />
                              </linearGradient>
                            </defs>
                            <circle cx="20" cy="20" r="18" fill="none" stroke="url(#hero-logo-gradient)" strokeWidth="2" opacity="0.3" />
                            <circle cx="20" cy="20" r="13" fill="none" stroke="url(#hero-logo-gradient)" strokeWidth="2.5" opacity="0.6" />
                            <circle cx="20" cy="20" r="7" fill="url(#hero-logo-gradient)" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">DeepStation</div>
                          <div className="text-xs text-slate-400">Automation Engine</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Animated Connection Lines - Intelligence */}
                  <div className="flex justify-center relative h-8">
                    <div className="w-px h-full bg-gradient-to-b from-fuchsia-600/30 to-purple-600/30"></div>
                    <div className="absolute inset-0 flex justify-center">
                      <div className="w-px h-full bg-gradient-to-b from-fuchsia-500 to-purple-500 opacity-0 animate-[pulse_2s_ease-in-out_infinite_0.5s]"></div>
                    </div>
                  </div>

                  {/* Bottom Layer: Agents */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">AI Agents</div>
                    <div className="grid grid-cols-4 gap-3">
                      {/* Brain Agent */}
                      <div className="bg-purple-950/30 border border-purple-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="#a855f7" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">Brain</span>
                      </div>

                      {/* Database Agent */}
                      <div className="bg-purple-950/30 border border-purple-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="#a855f7" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">Database</span>
                      </div>

                      {/* Intelligence Agent */}
                      <div className="bg-purple-950/30 border border-purple-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="#a855f7" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">Intelligence</span>
                      </div>

                      {/* Workflow Agent */}
                      <div className="bg-purple-950/30 border border-purple-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="#a855f7" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">Workflow</span>
                      </div>
                    </div>
                  </div>

                  {/* Animated Connection Lines - Data Input */}
                  <div className="flex justify-center relative h-8">
                    <div className="w-px h-full bg-gradient-to-b from-purple-600/30 to-slate-600/30"></div>
                    <div className="absolute inset-0 flex justify-center">
                      <div className="w-px h-full bg-gradient-to-b from-purple-500 to-slate-500 opacity-0 animate-[pulse_2s_ease-in-out_infinite_1s]"></div>
                    </div>
                  </div>

                  {/* Data Input Layer */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Input</div>
                    <div className="grid grid-cols-4 gap-3">
                      {/* Email */}
                      <div className="bg-emerald-950/30 border border-emerald-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">Email</span>
                      </div>

                      {/* Events */}
                      <div className="bg-amber-950/30 border border-amber-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">Events</span>
                      </div>

                      {/* Webhooks */}
                      <div className="bg-violet-950/30 border border-violet-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">API</span>
                      </div>

                      {/* Chat */}
                      <div className="bg-cyan-950/30 border border-cyan-900/30 rounded-lg p-3 flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="#06b6d4" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/>
                        </svg>
                        <span className="text-[10px] text-slate-400 font-medium">Chat</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities Section */}
        <section id="capabilities" className="relative py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Orchestration Infrastructure
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Backend services that power your entire marketing automation ecosystem
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Workflow Orchestration */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-8 rounded-xl hover:border-purple-700/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-fuchsia-900/50">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Workflow Engine</h3>
                <p className="text-slate-400 leading-relaxed">
                  Build cross-channel automation workflows that orchestrate content, events, and communications.
                </p>
              </div>

              {/* AI Content Generation */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-8 rounded-xl hover:border-purple-700/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-900/50">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Generation</h3>
                <p className="text-slate-400 leading-relaxed">
                  GPT-5, Gemini 2.5 Pro, and Claude Sonnet 4.5 power intelligent content creation across all formats.
                </p>
              </div>

              {/* Event Automation */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-8 rounded-xl hover:border-purple-700/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-900/50">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Event Orchestration</h3>
                <p className="text-slate-400 leading-relaxed">
                  Automate marketing events, workshops, webinars, and registrations with intelligent scheduling.
                </p>
              </div>

              {/* Newsletter Automation */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-8 rounded-xl hover:border-purple-700/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/50">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Newsletter Engine</h3>
                <p className="text-slate-400 leading-relaxed">
                  Automated newsletter creation, distribution, and optimization across subscriber segments.
                </p>
              </div>

              {/* Chatbot Integration */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-8 rounded-xl hover:border-purple-700/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-violet-900/50">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Chatbot Orchestration</h3>
                <p className="text-slate-400 leading-relaxed">
                  Integrate ManyChat and conversational flows into unified automation sequences.
                </p>
              </div>

              {/* Social Publishing */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-8 rounded-xl hover:border-purple-700/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-pink-900/50">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Social Publishing</h3>
                <p className="text-slate-400 leading-relaxed">
                  Cross-platform social distribution with platform-specific optimization and scheduling.
                </p>
              </div>

              {/* Media Studio */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-8 rounded-xl hover:border-purple-700/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-rose-900/50">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Media Studio</h3>
                <p className="text-slate-400 leading-relaxed">
                  AI-powered image and video generation with Imagen 4, Gemini Flash, and Veo 3.
                </p>
              </div>

              {/* Analytics Intelligence */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-8 rounded-xl hover:border-purple-700/50 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-orange-900/50">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Analytics Intelligence</h3>
                <p className="text-slate-400 leading-relaxed">
                  Unified metrics and insights across all channels, campaigns, and automation workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Channel Integrations */}
        <section id="channels" className="relative py-24 border-t border-purple-900/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Every Channel, One Platform
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Connect and automate across all your communication channels from a unified backend
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {/* LinkedIn */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-blue-700/50 transition-all">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50 mb-3">
                  <svg className="w-8 h-8" fill="#ffffff" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-center text-sm">LinkedIn</p>
              </div>

              {/* Instagram */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-pink-700/50 transition-all">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-900/50 mb-3">
                  <svg className="w-8 h-8" fill="#ffffff" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-center text-sm">Instagram</p>
              </div>

              {/* X (Twitter) */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-slate-700/50 transition-all">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/50 mb-3">
                  <svg className="w-8 h-8" fill="#ffffff" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-center text-sm">X (Twitter)</p>
              </div>

              {/* Discord */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-indigo-700/50 transition-all">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50 mb-3">
                  <svg className="w-8 h-8" fill="#ffffff" viewBox="0 0 24 24">
                    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-center text-sm">Discord</p>
              </div>

              {/* Email/Newsletters */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-emerald-700/50 transition-all">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/50 mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-center text-sm">Email</p>
              </div>

              {/* ManyChat */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-cyan-700/50 transition-all">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/50 mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-center text-sm">ManyChat</p>
              </div>

              {/* Events */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-amber-700/50 transition-all">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/50 mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-center text-sm">Events</p>
              </div>

              {/* Webhooks/API */}
              <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-violet-700/50 transition-all">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/50 mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-center text-sm">Webhooks</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white px-8 py-4 rounded-lg font-semibold transition-all hover:from-fuchsia-500 hover:to-purple-600"
              >
                Connect Your Stack
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Demo Video Section */}
        <section id="demo" className="relative py-24 border-t border-purple-900/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                See the Platform in Action
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Watch how DeepStation orchestrates your entire marketing automation infrastructure
              </p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 rounded-2xl blur-3xl opacity-50"></div>
              <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-4 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-[#0a0513] to-[#15092b] rounded-xl flex items-center justify-center group cursor-pointer hover:bg-gradient-to-br hover:from-[#15092b] hover:to-[#0a0513] transition-all">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-full flex items-center justify-center shadow-2xl shadow-purple-900/50 group-hover:scale-105 transition-transform">
                      <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Events Calendar Section */}
        <EventsCalendarSection />

        {/* CTA Section */}
        <section className="relative py-24 border-t border-purple-900/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 rounded-2xl blur-3xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-purple-950/40 to-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-12 md:p-16 text-center">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                  Ready to Automate Your
                  <br />
                  Entire Marketing Stack?
                </h2>
                <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto">
                  Build the automation backbone that orchestrates every channel, campaign, and communication.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:from-fuchsia-500 hover:to-purple-600 flex items-center justify-center gap-2"
                  >
                    Get Started
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/login"
                    className="bg-purple-950/30 backdrop-blur-sm text-white px-10 py-4 rounded-lg font-semibold text-lg border border-purple-900/30 hover:bg-purple-950/50 transition-all"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-purple-900/20 bg-[#0a0513]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10">
                  <svg viewBox="0 0 40 40" className="w-full h-full">
                    <defs>
                      <linearGradient id="footer-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#9333ea" />
                      </linearGradient>
                      <filter id="footer-glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Outer ring - Station */}
                    <circle cx="20" cy="20" r="18" fill="none" stroke="url(#footer-logo-gradient)" strokeWidth="2" opacity="0.3" />
                    {/* Middle ring */}
                    <circle cx="20" cy="20" r="13" fill="none" stroke="url(#footer-logo-gradient)" strokeWidth="2.5" opacity="0.6" />
                    {/* Inner core - representing depth */}
                    <circle cx="20" cy="20" r="7" fill="url(#footer-logo-gradient)" filter="url(#footer-glow)" />
                    {/* Connection nodes - representing network/station */}
                    <circle cx="20" cy="6" r="1.5" fill="#d946ef" opacity="0.8" />
                    <circle cx="34" cy="20" r="1.5" fill="#d946ef" opacity="0.8" />
                    <circle cx="20" cy="34" r="1.5" fill="#d946ef" opacity="0.8" />
                    <circle cx="6" cy="20" r="1.5" fill="#d946ef" opacity="0.8" />
                    {/* Energy waves */}
                    <path d="M 20 20 L 20 6" stroke="#d946ef" strokeWidth="1" opacity="0.4" />
                    <path d="M 20 20 L 34 20" stroke="#d946ef" strokeWidth="1" opacity="0.4" />
                    <path d="M 20 20 L 20 34" stroke="#d946ef" strokeWidth="1" opacity="0.4" />
                    <path d="M 20 20 L 6 20" stroke="#d946ef" strokeWidth="1" opacity="0.4" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">
                  DeepStation
                </span>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed">
                The intelligence layer for marketing automation orchestration.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#capabilities" className="text-slate-500 hover:text-white transition-colors text-sm">
                    Capabilities
                  </a>
                </li>
                <li>
                  <a href="#channels" className="text-slate-500 hover:text-white transition-colors text-sm">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#demo" className="text-slate-500 hover:text-white transition-colors text-sm">
                    Demo
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-slate-500 hover:text-white transition-colors text-sm">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-slate-500 hover:text-white transition-colors text-sm">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-slate-500 hover:text-white transition-colors text-sm">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-500 hover:text-white transition-colors text-sm">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-slate-500 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-500 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-slate-500 hover:text-white transition-colors text-sm">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-purple-900/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-600 text-sm">
                © 2025 DeepStation. Marketing automation orchestration platform.
              </p>
              <div className="flex items-center gap-6">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
