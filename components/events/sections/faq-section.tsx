'use client'

import type { Event } from '@/lib/types/event'

interface FAQSectionProps {
  event: Event
  customFAQs?: Array<{ question: string; answer: string }>
}

export function FAQSection({ event, customFAQs }: FAQSectionProps) {
  const defaultFAQs = [
    {
      q: 'What platform will the event be hosted on?',
      a: event.location_type === 'online'
        ? 'This is a virtual event. Meeting link will be sent to registered attendees before the event.'
        : `This event will be held in person at ${event.location_name || 'the specified location'}.`
    },
    {
      q: 'Will I receive a recording?',
      a: 'Yes! All registered attendees will receive access to the event recording and materials.'
    },
    {
      q: 'Can I get a refund?',
      a: event.is_free
        ? 'This is a free event. You can cancel your registration anytime.'
        : 'Refunds are available up to 48 hours before the event start time.'
    },
    {
      q: 'Who should attend this event?',
      a: 'This event is perfect for anyone interested in the topic, from beginners to experienced professionals.'
    },
  ]

  const faqs = customFAQs || defaultFAQs

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-fuchsia-500 to-purple-600 rounded-full" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 hover:border-purple-700/50 transition-all"
          >
            <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
            <p className="text-slate-300">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
