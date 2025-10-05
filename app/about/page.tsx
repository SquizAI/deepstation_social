import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-fuchsia-400 hover:text-fuchsia-300 mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl font-bold text-white mb-6">About DeepStation</h1>

        <div className="prose prose-invert max-w-none">
          <p className="text-xl text-white/80 mb-8">
            DeepStation is an AI-powered social media automation and orchestration platform that helps you manage your entire content workflow.
          </p>

          <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-white/70 mb-6">
            We're building the future of social media management by combining powerful automation with AI capabilities to help creators, marketers, and businesses streamline their content strategy.
          </p>

          <h2 className="text-3xl font-bold text-white mb-4">What We Offer</h2>
          <ul className="text-white/70 mb-6 space-y-2">
            <li>Multi-platform social media scheduling and publishing</li>
            <li>AI-powered content generation and optimization</li>
            <li>Email marketing and newsletter management</li>
            <li>Event management and promotion</li>
            <li>Analytics and performance tracking</li>
            <li>Workflow automation</li>
          </ul>

          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/60 text-center">
              More content coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
