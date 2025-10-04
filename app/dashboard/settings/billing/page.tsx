'use client';

import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const currentPlan = {
    name: 'Pro Plan',
    price: '$29',
    period: 'month',
    features: [
      'Unlimited posts across all platforms',
      'AI-powered content generation',
      'Advanced analytics & insights',
      'Priority support',
      'Custom branding options',
    ],
  };

  const billingHistory = [
    {
      id: '1',
      date: '2025-09-04',
      description: 'Pro Plan - Monthly',
      amount: '$29.00',
      status: 'Paid',
    },
    {
      id: '2',
      date: '2025-08-04',
      description: 'Pro Plan - Monthly',
      amount: '$29.00',
      status: 'Paid',
    },
    {
      id: '3',
      date: '2025-07-04',
      description: 'Pro Plan - Monthly',
      amount: '$29.00',
      status: 'Paid',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Billing & Subscription</h2>
        <p className="text-slate-400">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 backdrop-blur-sm border border-fuchsia-500/20 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-white">{currentPlan.name}</h3>
              <span className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 text-xs font-medium rounded-full border border-fuchsia-500/30">
                Active
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Next billing date: <span className="text-white font-medium">October 4, 2025</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{currentPlan.price}</div>
            <div className="text-sm text-slate-400">per {currentPlan.period}</div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-white mb-3">Plan Features:</h4>
          <ul className="space-y-2">
            {currentPlan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                <svg
                  className="h-5 w-5 text-fuchsia-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 mt-6">
          <Button className="bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
            Change Plan
          </Button>
          <Button
            variant="outline"
            className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50"
          >
            Cancel Subscription
          </Button>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-white">•••• •••• •••• 4242</div>
              <div className="text-xs text-slate-400">Expires 12/2026</div>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-white/20 text-slate-300 hover:bg-white/5"
          >
            Update
          </Button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Billing History</h3>
        <div className="space-y-3">
          {billingHistory.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium text-white">{invoice.description}</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      invoice.status === 'Paid'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(invoice.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-white">{invoice.amount}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-slate-300 hover:bg-white/5"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">247</div>
            <div className="text-sm text-slate-400">Posts This Month</div>
            <div className="text-xs text-fuchsia-400 mt-2">Unlimited</div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">4</div>
            <div className="text-sm text-slate-400">Connected Platforms</div>
            <div className="text-xs text-fuchsia-400 mt-2">All Available</div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">15.2K</div>
            <div className="text-sm text-slate-400">Total Reach</div>
            <div className="text-xs text-green-400 mt-2">+12% vs last month</div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-2">Billing Questions?</h3>
            <p className="text-xs text-slate-400 mb-3">
              Need help with your subscription or have billing questions? Our support team is
              here to help.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
            >
              Contact Billing Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
