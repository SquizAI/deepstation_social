import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function OrganizationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's organizations
  const { data: memberships, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      joined_at,
      organizations (
        id,
        name,
        slug,
        logo_url,
        brand_color,
        website_url,
        stripe_account_id,
        stripe_onboarding_completed,
        is_active,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const organizations = memberships?.map((m) => ({
    ...m.organizations,
    role: m.role,
    joinedAt: m.joined_at,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Organizations</h1>
          <p className="text-gray-400 mt-1">
            Manage your organizations and create events
          </p>
        </div>
        <Link href="/dashboard/organization/new">
          <Button className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Organization
          </Button>
        </Link>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Organizations Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create your first organization to start hosting events, selling tickets, and growing your community.
          </p>
          <Link href="/dashboard/organization/new">
            <Button className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700">
              Create Your First Organization
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org: any) => (
            <div
              key={org.id}
              className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden hover:border-fuchsia-500/50 transition-all duration-300 group"
            >
              {/* Organization Header */}
              <div className="relative h-24 bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20">
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={org.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-12 w-12 text-fuchsia-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Organization Info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-fuchsia-400 transition-colors">
                      {org.name}
                    </h3>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${org.role === 'owner' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : ''}
                      ${org.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}
                      ${org.role === 'member' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : ''}
                    `}>
                      {org.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">@{org.slug}</p>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-3 mb-4">
                  {org.stripe_onboarding_completed ? (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Payments Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-400 text-xs">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Setup Required</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/organization/${org.slug}`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full border-white/10 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10"
                    >
                      View Dashboard
                    </Button>
                  </Link>
                  {(org.role === 'owner' || org.role === 'admin') && (
                    <Link href={`/dashboard/organization/${org.slug}/settings`}>
                      <Button
                        variant="outline"
                        className="border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
