import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-fuchsia-400 hover:text-fuchsia-300 mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl font-bold text-white mb-6">Terms of Service</h1>
        <p className="text-sm text-white/50 mb-12">Last updated: October 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
            <p className="text-white/70">
              By accessing or using DeepStation, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Use of Service</h2>
            <p className="text-white/70">
              You may use our service only for lawful purposes and in accordance with these Terms. You agree not to use the service to post spam, harmful content, or violate any third-party platform policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">User Accounts</h2>
            <p className="text-white/70">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Content Ownership</h2>
            <p className="text-white/70">
              You retain all rights to the content you create and post through our service. We do not claim ownership of your content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Platforms</h2>
            <p className="text-white/70">
              When posting to third-party platforms (LinkedIn, Instagram, Twitter, Discord), you must comply with their respective terms of service and community guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
            <p className="text-white/70">
              DeepStation is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
            <p className="text-white/70">
              We reserve the right to terminate or suspend your account at any time for violations of these Terms or for any other reason.
            </p>
          </section>

          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/60 text-sm">
              For questions about these terms, please contact us via our <Link href="/contact" className="text-fuchsia-400 hover:text-fuchsia-300">contact page</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
