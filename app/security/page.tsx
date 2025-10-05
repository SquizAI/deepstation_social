import Link from 'next/link'

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-fuchsia-400 hover:text-fuchsia-300 mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl font-bold text-white mb-6">Security</h1>
        <p className="text-xl text-white/70 mb-12">
          How we keep your data safe and secure
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Encryption</h2>
            <p className="text-white/70">
              All sensitive data, including OAuth tokens and API credentials, are encrypted at rest and in transit using industry-standard encryption protocols (AES-256).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Secure Authentication</h2>
            <p className="text-white/70">
              We use Supabase Auth for user authentication with secure password hashing, multi-factor authentication support, and OAuth 2.0 integration for social platforms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Row-Level Security</h2>
            <p className="text-white/70">
              Our database implements Row-Level Security (RLS) policies to ensure users can only access their own data. This provides an additional layer of protection beyond application-level security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Regular Security Audits</h2>
            <p className="text-white/70">
              We conduct regular security audits and penetration testing to identify and address potential vulnerabilities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Integrations</h2>
            <p className="text-white/70">
              All third-party API integrations follow OAuth 2.0 standards and best practices. We never store passwords for connected platforms, only secure access tokens with limited scopes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Reporting Security Issues</h2>
            <p className="text-white/70 mb-4">
              If you discover a security vulnerability, please report it to us immediately. We take all security reports seriously and will respond promptly.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Report a Security Issue
            </Link>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Compliance</h2>
            <p className="text-white/70">
              We are committed to complying with applicable data protection regulations, including GDPR and CCPA.
            </p>
          </section>

          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 className="text-white font-semibold mb-1">Security Best Practices</h3>
                <p className="text-white/60 text-sm">
                  We recommend enabling two-factor authentication, using strong unique passwords, and regularly reviewing your connected accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
