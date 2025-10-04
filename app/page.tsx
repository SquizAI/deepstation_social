import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-[float_30s_ease-in-out_infinite]"></div>
      </div>

      {/* Header */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-11 h-11 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                DeepStation
              </span>
            </Link>
            <div className="flex items-center gap-4">
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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-32">
          {/* Hero Content */}
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-fuchsia-500 rounded-full blur-sm animate-[pulse-glow_2s_ease-in-out_infinite]"></div>
                <div className="relative w-2 h-2 bg-fuchsia-400 rounded-full"></div>
              </div>
              <span className="text-sm text-slate-300 font-medium">Powered by GPT-4, Gemini 2.5 & Claude 4</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight">
              <span className="block bg-gradient-to-r from-white via-purple-100 to-fuchsia-100 bg-clip-text text-transparent pb-2">
                Social Media
              </span>
              <span className="block bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Automation
              </span>
              <span className="block bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Schedule posts across LinkedIn, Instagram, X, and Discord.
              Create stunning content with AI. Analyze performance in real-time.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <Link
                href="/signup"
                className="group relative overflow-hidden bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-105"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Start Free Trial
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-400/20 to-purple-400/20 blur-xl"></div>
                </div>
              </Link>
              <Link
                href="/login"
                className="group bg-white/5 backdrop-blur-sm text-white px-10 py-5 rounded-2xl font-bold text-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                View Demo
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-slate-400">
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

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-32 max-w-6xl mx-auto">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  🤖
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">AI-Powered Creation</h3>
                <p className="text-slate-400 leading-relaxed">
                  Generate engaging posts with GPT-4, Gemini 2.5, and Claude 4. Platform-optimized content in seconds.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Smart Scheduling</h3>
                <p className="text-slate-400 leading-relaxed">
                  Schedule posts weeks in advance. Auto-publish to LinkedIn, Instagram, X, and Discord simultaneously.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  📊
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Advanced Analytics</h3>
                <p className="text-slate-400 leading-relaxed">
                  Track engagement, reach, and performance across all platforms in one beautiful dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Platform Logos */}
          <div className="mt-32 text-center">
            <p className="text-slate-500 font-semibold text-sm mb-8 tracking-wider uppercase">Supported Platforms</p>
            <div className="flex flex-wrap justify-center gap-12 items-center opacity-60 hover:opacity-100 transition-opacity">
              <div className="text-4xl">💼</div>
              <div className="text-4xl">📸</div>
              <div className="text-4xl">🐦</div>
              <div className="text-4xl">💬</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <span className="text-white font-bold">DeepStation</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2025 DeepStation. The future of social media automation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
