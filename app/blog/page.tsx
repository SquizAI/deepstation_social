import Link from 'next/link'

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-fuchsia-400 hover:text-fuchsia-300 mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl font-bold text-white mb-6">Blog</h1>
        <p className="text-xl text-white/70 mb-12">
          Insights, updates, and best practices for social media automation
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-fuchsia-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-white/60">
            We're working on bringing you valuable content about social media automation, AI, and marketing strategies.
          </p>
        </div>
      </div>
    </div>
  )
}
