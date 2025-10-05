# Key Code Snippets - Events & Profile Features

## Event Registration Button Usage

```tsx
import { EventRegistrationButton } from '@/components/events/event-registration-button'

<EventRegistrationButton
  eventId={event.id}
  eventSlug={event.slug}
  isRegistered={isRegistered}
  isLoggedIn={!!user}
  isFull={event.attendee_count >= event.max_attendees}
/>
```

## Simple Event Card Usage

```tsx
import { SimpleEventCard } from '@/components/events/simple-event-card'

<SimpleEventCard
  event={{
    id: '123',
    title: 'AI Workshop',
    description: 'Learn AI fundamentals',
    slug: 'ai-workshop-2025',
    event_date: '2025-03-15',
    event_time: '6:00 PM EST',
    image_url: '/events/workshop.jpg',
    location: 'New York, NY',
    max_attendees: 50,
    attendee_count: 32
  }}
  showRegisterButton={true}
/>
```

## Events Calendar Section (Homepage)

```tsx
import { EventsCalendarSection } from '@/components/events/events-calendar-section'

export default async function Home() {
  return (
    <div>
      {/* Other homepage sections */}

      <EventsCalendarSection />

      {/* CTA Section */}
    </div>
  )
}
```

## Profile Page Implementation

```tsx
import { createClient } from '@/lib/supabase/server'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileTabs } from '@/components/profile/profile-tabs'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('*, events(*)')
    .eq('user_id', user.id)

  return (
    <div>
      <ProfileHeader user={user} profile={profile} />
      <ProfileTabs
        user={user}
        profile={profile}
        registrations={registrations || []}
      />
    </div>
  )
}
```

## Fetching Events (Server-Side)

```tsx
const supabase = await createClient()

// Get upcoming published events
const { data: events } = await supabase
  .from('events')
  .select('*')
  .gte('event_date', new Date().toISOString())
  .eq('is_published', true)
  .order('event_date', { ascending: true })
  .limit(6)
```

## Registering for Event (Client-Side)

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

const handleRegister = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      user_id: user.id,
      status: 'registered'
    })

  if (!error) {
    // Registration successful
    router.refresh()
  }
}
```

## Checking Registration Status

```tsx
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: registration } = await supabase
  .from('event_registrations')
  .select('id')
  .eq('event_id', eventId)
  .eq('user_id', user.id)
  .eq('status', 'registered')
  .single()

const isRegistered = !!registration
```

## Navigation Links

### Sidebar Profile Link
```tsx
{
  name: 'Profile',
  href: '/dashboard/profile',
  icon: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
}
```

### Navbar My Events Dropdown
```tsx
<DropdownMenuItem
  icon={<svg>...</svg>}
  onClick={() => router.push('/dashboard/profile?tab=events')}
>
  My Events
</DropdownMenuItem>
```

## Glassmorphism Styling Pattern

```tsx
// Card Background
className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl"

// Hover State
className="hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"

// Gradient Button
className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-xl"

// Gradient Text
className="bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent"
```

## Date Formatting with date-fns

```tsx
import { format } from 'date-fns'

const eventDate = new Date(event.event_date)
const formattedDate = format(eventDate, 'MMMM dd, yyyy')  // "March 15, 2025"
const dayOfMonth = format(eventDate, 'd')                  // "15"
const month = format(eventDate, 'MMM')                     // "Mar"
const shortDate = format(eventDate, 'MMM dd, yyyy')        // "Mar 15, 2025"
```

## Empty State Example

```tsx
{events.length === 0 && (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
    <svg className="w-16 h-16 mx-auto text-slate-500 mb-4">...</svg>
    <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
    <p className="text-slate-400 mb-6">Check back soon for new events!</p>
    <Link href="/" className="bg-gradient-to-r from-fuchsia-500 to-purple-600...">
      Back to Home
    </Link>
  </div>
)}
```

## Profile Edit Form

```tsx
'use client'
const [formData, setFormData] = useState({
  full_name: profile?.full_name || '',
  bio: profile?.bio || ''
})

const handleSave = async () => {
  const supabase = createClient()

  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: formData.full_name,
      bio: formData.bio,
      updated_at: new Date().toISOString()
    })

  router.refresh()
}
```

## Filter Events by Status

```tsx
const now = new Date()
const eventDate = new Date(event.event_date)

// Upcoming events
const upcomingEvents = events.filter(event =>
  new Date(event.event_date) >= now
)

// Past events
const pastEvents = events.filter(event =>
  new Date(event.event_date) < now
)
```

## Login Redirect Flow

```tsx
// If not logged in, redirect to login with return URL
if (!user) {
  router.push(`/login?redirect=/events/${slug}`)
  return
}

// On login page, handle redirect
const searchParams = useSearchParams()
const redirect = searchParams.get('redirect')

// After successful login
router.push(redirect || '/dashboard')
```

## Responsive Grid Layout

```tsx
{/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
  {events.map(event => (
    <EventCard key={event.id} event={event} />
  ))}
</div>
```

## Loading State

```tsx
const [loading, setLoading] = useState(false)

<button disabled={loading} className="...">
  {loading ? 'Processing...' : 'Register for Event'}
</button>
```

## Conditional Rendering

```tsx
{isRegistered ? (
  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
    <p className="text-green-400">You're Registered!</p>
  </div>
) : (
  <button onClick={handleRegister}>Register Now</button>
)}
```

## Avatar Display with Fallback

```tsx
{profile?.avatar_url ? (
  <img
    src={profile.avatar_url}
    alt={userName}
    className="w-full h-full rounded-full object-cover"
  />
) : (
  <span className="text-white font-bold text-3xl">
    {userInitials}
  </span>
)}
```

## Tab Navigation

```tsx
const [activeTab, setActiveTab] = useState<'events' | 'settings'>('events')

<button
  onClick={() => setActiveTab('events')}
  className={activeTab === 'events'
    ? 'border-fuchsia-500 text-white'
    : 'border-transparent text-slate-400'
  }
>
  My Events
</button>

{activeTab === 'events' && <EventsList />}
{activeTab === 'settings' && <SettingsPanel />}
```

## Error Handling

```tsx
try {
  const { error } = await supabase.from('events').insert(data)

  if (error) {
    console.error('Error:', error)
    alert('Failed to register. Please try again.')
    return
  }

  // Success
  router.refresh()
} catch (error) {
  console.error('Unexpected error:', error)
  alert('An unexpected error occurred.')
}
```

## Type-Safe Props

```tsx
interface EventCardProps {
  event: {
    id: string
    title: string
    description: string
    slug: string
    event_date: string
    event_time?: string
    image_url?: string
    location?: string
    max_attendees?: number
    attendee_count?: number
  }
  showRegisterButton?: boolean
}

export function EventCard({ event, showRegisterButton = true }: EventCardProps) {
  // Component implementation
}
```
