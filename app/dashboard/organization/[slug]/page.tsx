import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function OrganizationDashboardPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();
  const slug = params.slug;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get organization with member info
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select(`
      *,
      organization_members!inner (
        role,
        user_id
      )
    `)
    .eq('slug', slug)
    .eq('organization_members.user_id', user.id)
    .single();

  if (orgError || !org) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Organization not found or you do not have access</p>
      </div>
    );
  }

  const userRole = org.organization_members[0]?.role;

  // Get organization's events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(`
      id,
      title,
      slug,
      start_date,
      end_date,
      cover_image_url,
      location_type,
      status
    `)
    .eq('organization_id', org.id)
    .order('start_date', { ascending: false });

  // Get recent registrations
  const { data: registrations, error: regsError } = await supabase
    .from('event_registrations')
    .select(`
      id,
      email,
      first_name,
      last_name,
      status,
      payment_status,
      created_at,
      events!inner (
        id,
        title,
        organization_id
      )
    `)
    .eq('events.organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get stats
  const totalEvents = events?.length || 0;
  const upcomingEvents = events?.filter(e => new Date(e.start_date) > new Date()).length || 0;
  const totalRegistrations = registrations?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="h-16 w-16 rounded-lg object-cover border border-white/10"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20 flex items-center justify-center border border-white/10">
              <svg className="h-8 w-8 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{org.name}</h1>
            <p className="text-gray-400">@{org.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(userRole === 'owner' || userRole === 'admin') && (
            <Link href={`/dashboard/organization/${slug}/settings`}>
              <Button
                variant="outline"
                className="border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
            </Link>
          )}
          <Link href="/dashboard/events/new">
            <Button className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Events</p>
            <svg className="h-8 w-8 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white">{totalEvents}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Upcoming</p>
            <svg className="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white">{upcomingEvents}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Registrations</p>
            <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-white">{totalRegistrations}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Payments</p>
            {org.stripe_onboarding_completed ? (
              <svg className="h-8 w-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium text-white">
            {org.stripe_onboarding_completed ? 'Active' : 'Setup Required'}
          </p>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Events</h2>
          <Link href="/dashboard/events">
            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
              View All
            </Button>
          </Link>
        </div>

        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 5).map((event: any) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.slug}`}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-fuchsia-500/50 transition-all duration-300 group"
              >
                {event.cover_image_url ? (
                  <img
                    src={event.cover_image_url}
                    alt={event.title}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20 flex items-center justify-center">
                    <svg className="h-8 w-8 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-fuchsia-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {new Date(event.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`
                  px-2 py-1 text-xs font-medium rounded-full
                  ${event.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                  ${event.status === 'draft' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : ''}
                `}>
                  {event.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="text-gray-400 mb-4">No events yet</p>
            <Link href="/dashboard/events/new">
              <Button className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700">
                Create Your First Event
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
