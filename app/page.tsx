import Link from 'next/link'
import { EventsCalendarSection } from '@/components/events/events-calendar-section'

export default async function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-[float_30s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/3 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-[float_35s_ease-in-out_infinite]"></div>
      </div>

      {/* Header */}
      <header className="relative sticky top-0 z-50 backdrop-blur-md bg-[#201033]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-500/50">
                  <span className="text-3xl drop-shadow-lg">⚡</span>
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                DeepStation
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white font-medium transition-colors">
                Features
              </a>
              <a href="#platforms" className="text-slate-300 hover:text-white font-medium transition-colors">
                Platforms
              </a>
              <a href="#pricing" className="text-slate-300 hover:text-white font-medium transition-colors">
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-slate-300 hover:text-white font-medium transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="group relative overflow-hidden bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-fuchsia-500/50 hover:scale-105"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24">
          {/* Hero Content */}
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2.5 animate-[float_6s_ease-in-out_infinite]">
              <div className="relative">
                <div className="absolute inset-0 bg-fuchsia-500 rounded-full blur-sm animate-[pulse-glow_2s_ease-in-out_infinite]"></div>
                <div className="relative w-2 h-2 bg-fuchsia-400 rounded-full"></div>
              </div>
              <span className="text-sm text-slate-300 font-medium">Powered by GPT-5, Gemini 2.5 Pro & Claude Sonnet 4.5</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold leading-tight">
              <span className="block bg-gradient-to-r from-white via-purple-100 to-fuchsia-100 bg-clip-text text-transparent pb-2 animate-[shimmer_3s_ease-in-out_infinite]">
                Social Media
              </span>
              <span className="block bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite_0.5s]">
                Automation
              </span>
              <span className="block bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite_1s]">
                Reimagined
              </span>
            </h1>

            <p className="text-xl md:text-2xl lg:text-3xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
              Schedule posts across LinkedIn, Instagram, X, and Discord.
              Create stunning content with AI. Analyze performance in real-time.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <Link
                href="/signup"
                className="group relative overflow-hidden bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-12 py-6 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-2xl shadow-fuchsia-500/30"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Start Free Trial
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-400/20 to-purple-400/20 blur-xl"></div>
                </div>
              </Link>
              <a
                href="#demo"
                className="group bg-white/5 backdrop-blur-sm text-white px-12 py-6 rounded-2xl font-bold text-lg border-2 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-8 pt-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-fuchsia-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-fuchsia-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free forever plan
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-fuchsia-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="mt-24 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-3xl p-4 shadow-2xl shadow-purple-500/20">
              <div className="bg-gradient-to-br from-[#201033] to-[#15092b] rounded-2xl overflow-hidden">
                {/* Mock Dashboard Header */}
                <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>
                  <div className="flex-1 max-w-md mx-auto bg-white/5 rounded-lg px-4 py-2">
                    <div className="h-2 bg-white/10 rounded w-3/4"></div>
                  </div>
                </div>
                {/* Mock Dashboard Content */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 h-24"></div>
                    <div className="bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-4 h-24"></div>
                    <div className="bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 h-24"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 h-48"></div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 h-48"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="relative py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-6">
                Everything You Need
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Powerful features to automate your social media workflow and grow your audience
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* AI Content Generation */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-fuchsia-500/30 transition-all group-hover:transform group-hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
                    🤖
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">AI-Powered Content</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Generate engaging posts, images, and videos with GPT-5, Gemini 2.5 Pro, and Claude Sonnet 4.5.
                  </p>
                </div>
              </div>

              {/* Smart Scheduling */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-fuchsia-500/30 transition-all group-hover:transform group-hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-fuchsia-500/50">
                    📅
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Smart Scheduling</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Schedule posts weeks in advance across all platforms with optimal timing recommendations.
                  </p>
                </div>
              </div>

              {/* Analytics Dashboard */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-cyan-500/30 transition-all group-hover:transform group-hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/50">
                    📊
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Advanced Analytics</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Track engagement, reach, and performance across all platforms in one beautiful dashboard.
                  </p>
                </div>
              </div>

              {/* Workflow Automation */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-indigo-500/30 transition-all group-hover:transform group-hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/50">
                    ⚡
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Workflow Automation</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Build custom workflows to automate content creation, scraping, and multi-platform posting.
                  </p>
                </div>
              </div>

              {/* Multi-Platform Publishing */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-violet-500/30 transition-all group-hover:transform group-hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/50">
                    🚀
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Multi-Platform</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Publish to LinkedIn, Instagram, X, and Discord simultaneously with platform-specific optimization.
                  </p>
                </div>
              </div>

              {/* AI Image Generation */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-pink-500/30 transition-all group-hover:transform group-hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/50">
                    🎨
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">AI Image Studio</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Create stunning visuals with Imagen 4, Gemini Flash, and other leading AI image models.
                  </p>
                </div>
              </div>

              {/* AI Video Generation */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-orange-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-rose-500/30 transition-all group-hover:transform group-hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-rose-500/50">
                    🎬
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">AI Video Studio</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Generate professional videos with Veo 3 and cutting-edge AI video generation technology.
                  </p>
                </div>
              </div>

              {/* Real-Time Collaboration */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-orange-500/30 transition-all group-hover:transform group-hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/50">
                    👥
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Team Collaboration</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Work together with your team in real-time with role-based permissions and approval workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Integrations */}
        <section id="platforms" className="relative py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-6">
                Connect All Your Platforms
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Seamlessly integrate with all major social media platforms
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {/* LinkedIn */}
              <div className="group relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-blue-500/30 transition-all group-hover:scale-105">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-5xl shadow-lg shadow-blue-500/50">
                    💼
                  </div>
                  <p className="text-white font-bold text-center mt-4">LinkedIn</p>
                </div>
              </div>

              {/* Instagram */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-pink-500/30 transition-all group-hover:scale-105">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center text-5xl shadow-lg shadow-pink-500/50">
                    📸
                  </div>
                  <p className="text-white font-bold text-center mt-4">Instagram</p>
                </div>
              </div>

              {/* X (Twitter) */}
              <div className="group relative">
                <div className="absolute inset-0 bg-slate-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-slate-500/30 transition-all group-hover:scale-105">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center text-5xl shadow-lg shadow-slate-500/50">
                    🐦
                  </div>
                  <p className="text-white font-bold text-center mt-4">X (Twitter)</p>
                </div>
              </div>

              {/* Discord */}
              <div className="group relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-indigo-500/30 transition-all group-hover:scale-105">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-5xl shadow-lg shadow-indigo-500/50">
                    💬
                  </div>
                  <p className="text-white font-bold text-center mt-4">Discord</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-16">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/30"
              >
                Connect Your Accounts
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="relative py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Start free, upgrade when you need more power
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Free Tier */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                    <p className="text-slate-400">Perfect for getting started</p>
                  </div>
                  <div className="mb-8">
                    <span className="text-5xl font-bold text-white">$0</span>
                    <span className="text-slate-400 ml-2">/ forever</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300">Up to 10 scheduled posts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300">Connect 2 platforms</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300">Basic analytics</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-slate-300">5 AI generations/month</span>
                    </li>
                  </ul>
                  <Link
                    href="/signup"
                    className="block w-full text-center bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-all"
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>

              {/* Pro Tier */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-[#201033] to-[#15092b] rounded-3xl p-8 border-2 border-fuchsia-500/50">
                  <div className="absolute top-0 right-8 -translate-y-1/2">
                    <span className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                      POPULAR
                    </span>
                  </div>
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                    <p className="text-slate-400">For serious creators</p>
                  </div>
                  <div className="mb-8">
                    <span className="text-5xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">$29</span>
                    <span className="text-slate-400 ml-2">/ month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white font-medium">Unlimited scheduled posts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white font-medium">Connect all platforms</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white font-medium">Advanced analytics & insights</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white font-medium">Unlimited AI generations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white font-medium">Unlimited workflows</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white font-medium">Team collaboration</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-fuchsia-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white font-medium">Priority support</span>
                    </li>
                  </ul>
                  <Link
                    href="/signup"
                    className="block w-full text-center bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/50"
                  >
                    Start Pro Trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-6">
                Loved by Creators
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                See what our users are saying about DeepStation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-fuchsia-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  "DeepStation has completely transformed my social media workflow. The AI generation is incredible and saves me hours every week!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                    👨‍💼
                  </div>
                  <div>
                    <p className="text-white font-bold">Alex Johnson</p>
                    <p className="text-slate-400 text-sm">Content Creator</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-fuchsia-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  "The workflow automation is a game-changer. I set it up once and my content goes out automatically across all platforms."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full flex items-center justify-center text-xl">
                    👩‍💼
                  </div>
                  <div>
                    <p className="text-white font-bold">Sarah Martinez</p>
                    <p className="text-slate-400 text-sm">Marketing Manager</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-fuchsia-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  "Best investment I've made for my business. The analytics alone are worth it, but the AI features are next level."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-pink-600 rounded-full flex items-center justify-center text-xl">
                    👨‍💻
                  </div>
                  <div>
                    <p className="text-white font-bold">Michael Chen</p>
                    <p className="text-slate-400 text-sm">Entrepreneur</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Video Section */}
        <section id="demo" className="relative py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-6">
                See It In Action
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Watch how DeepStation can transform your social media workflow
              </p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/30 to-purple-500/30 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-3xl p-4 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-[#201033] to-[#15092b] rounded-2xl flex items-center justify-center group cursor-pointer hover:scale-[1.02] transition-transform">
                  <div className="relative">
                    <div className="absolute inset-0 bg-fuchsia-500/20 rounded-full blur-3xl group-hover:blur-2xl transition-all"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-fuchsia-500/50 group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
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
        <section className="relative py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-3xl p-12 md:p-20 text-center">
                <h2 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-6">
                  Ready to Transform Your Social Media?
                </h2>
                <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
                  Join thousands of creators and businesses using DeepStation to automate their social media and grow their audience.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href="/signup"
                    className="group relative overflow-hidden bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-12 py-6 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-2xl shadow-fuchsia-500/30"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Start Free Today
                      <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                  <Link
                    href="/login"
                    className="bg-white/10 backdrop-blur-sm text-white px-12 py-6 rounded-2xl font-bold text-lg border-2 border-white/20 hover:bg-white/20 transition-all"
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
      <footer className="relative border-t border-white/5 bg-[#0a0513]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
                  <span className="text-2xl">⚡</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  DeepStation
                </span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed">
                The future of social media automation. Powered by cutting-edge AI.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#platforms" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#demo" className="text-slate-400 hover:text-white transition-colors text-sm">
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
                  <Link href="/about" className="text-slate-400 hover:text-white transition-colors text-sm">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">
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
                  <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm">
                © 2025 DeepStation. The future of social media automation.
              </p>
              <div className="flex items-center gap-6">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
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
