import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-fuchsia-400 hover:text-fuchsia-300 mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-5xl font-bold text-white mb-6">Contact Us</h1>
        <p className="text-xl text-white/70 mb-12">
          Get in touch with our team
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                placeholder="How can we help you?"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Send Message
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-white/60 text-sm text-center">
              Note: This form is currently inactive. Please reach out via our social channels for now.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
