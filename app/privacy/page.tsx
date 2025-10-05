import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-fuchsia-400 hover:text-fuchsia-300 mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl font-bold text-white mb-6">Privacy Policy</h1>
        <p className="text-sm text-white/50 mb-12">Last updated: October 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
            <p className="text-white/70">
              We collect information you provide directly to us, including when you create an account, connect social media platforms, schedule posts, or contact our support team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
            <p className="text-white/70">
              We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
            <p className="text-white/70">
              We implement appropriate security measures to protect your personal information. All sensitive data, including API credentials and OAuth tokens, are encrypted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
            <p className="text-white/70">
              We integrate with third-party services (LinkedIn, Instagram, Twitter, Discord) to provide our social media posting features. Please review their privacy policies for more information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
            <p className="text-white/70">
              You have the right to access, update, or delete your personal information at any time through your account settings.
            </p>
          </section>

          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/60 text-sm">
              For questions about our privacy practices, please contact us via our <Link href="/contact" className="text-fuchsia-400 hover:text-fuchsia-300">contact page</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
