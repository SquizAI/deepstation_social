import Link from 'next/link'

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-fuchsia-400 hover:text-fuchsia-300 mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl font-bold text-white mb-6">Careers at DeepStation</h1>
        <p className="text-xl text-white/70 mb-12">
          Join us in building the future of social media automation
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-fuchsia-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">No Open Positions Yet</h2>
          <p className="text-white/60 mb-6">
            We're not currently hiring, but we're always interested in connecting with talented individuals.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  )
}
