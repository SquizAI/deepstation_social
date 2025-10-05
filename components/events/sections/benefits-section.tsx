'use client'

interface BenefitsSectionProps {
  benefits?: Array<{ icon: string; title: string; description: string }>
}

const defaultBenefits = [
  { icon: '🎯', title: 'Expert Insights', description: 'Learn from industry leaders and practitioners' },
  { icon: '🤝', title: 'Networking', description: 'Connect with like-minded professionals' },
  { icon: '📚', title: 'Resources', description: 'Access to exclusive materials and recordings' },
  { icon: '🏆', title: 'Certificate', description: 'Receive a certificate of participation' },
]

export function BenefitsSection({ benefits = defaultBenefits }: BenefitsSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-fuchsia-500 to-purple-600 rounded-full" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          What You'll Get
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {benefits.map((item, index) => (
          <div
            key={index}
            className="group relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-fuchsia-500/50 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/0 to-purple-500/0 group-hover:from-fuchsia-500/5 group-hover:to-purple-500/5 rounded-xl transition-all" />
            <div className="relative">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
