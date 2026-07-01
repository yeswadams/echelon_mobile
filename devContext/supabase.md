# Echelon Realty — Supabase Backend Reference

This document is the authoritative reference for implementing the Echelon Realty Supabase backend in any client (mobile app, second web app, etc.). It covers the full schema, auth flows, all CRUD operations, real-time subscriptions, role-based access, and the exact conventions the web app uses.

---

## 1. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

The anon key is safe to embed in client-side code. It is scoped by Row-Level Security (RLS) policies on each table.

---

## 2. Client Initialisation

### Browser / Mobile Client

Use `@supabase/supabase-js` (or the platform-specific Supabase SDK):

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
```

On Next.js web the app uses `@supabase/ssr`'s `createBrowserClient` for cookie-based session persistence. On a mobile app, use the standard `@supabase/supabase-js` client — it handles token storage automatically via AsyncStorage (React Native) or equivalent.

### Server-Side (Next.js only — not needed for mobile)

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      ),
    },
  })
}
```

---

## 3. Database Schema

### 3.1 `profiles`

Auto-created by a Supabase trigger on `auth.users`. One row per authenticated user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK — matches `auth.users.id` |
| `full_name` | `text` | Combined first + last name |
| `avatar_url` | `text` | URL to avatar image |
| `role` | `text` | One of: `"buyer"`, `"agent"`, `"Admin"`, `"Super Admin"` |
| `phone` | `text` | Optional phone number |
| `created_at` | `timestamptz` | Auto-set |

**Role meanings:**
- `buyer` — Default role for all new sign-ups. Redirected to `/buyer/listings`.
- `agent` — Real estate agent. Queryable via `getAgents()`.
- `Admin` — Access to admin dashboard. Email must also be whitelisted.
- `Super Admin` — Same as Admin with elevated permissions.

**How the profile row is created:**
Supabase is configured with a trigger that runs `INSERT INTO profiles (id, full_name, avatar_url) VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')` on every new `auth.users` insert. The mobile app should pass `first_name`, `last_name`, and `full_name` in the `data` field of `signUp()` options so the trigger populates the row correctly.

---

### 3.2 `properties`

Used by the **admin dashboard** for internal property management. This is separate from the Sanity CMS which serves the public-facing website. The mobile app should read from this table for buyer-facing property detail pages.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `title` | `text` | Property name |
| `address` | `text` | Full address string |
| `city` | `text` | City name |
| `status` | `text` | `"published"`, `"draft"`, `"archived"` |
| `listing_type` | `text` | `"sale"`, `"rent"`, `"lease"`, `"short-let"`, `"off-plan"` |
| `type` | `text` | `"apartment"`, `"villa"`, `"townhouse"`, `"penthouse"`, `"plot"`, etc. |
| `price` | `numeric` | Price in KES |
| `price_period` | `text` | `"month"` for rentals, `null` for sale |
| `bedrooms` | `int` | |
| `bathrooms` | `int` | |
| `area_sqft` | `numeric` | Size in square feet |
| `images` | `text[]` | Array of image URLs |
| `amenities` | `text[]` | Array of amenity strings |
| `views_count` | `int` | Used for "featured" heuristic (> 100 = featured) |
| `agent_id` | `uuid` | FK → `profiles.id` |
| `created_at` | `timestamptz` | |

**Foreign-key joins used in web app:**
- `agent:profiles!properties_agent_id_fkey(full_name, avatar_url)` — The agent assigned to the property
- `agency:agencies(name, logo_url)` — The agency (if applicable)

---

### 3.3 `units`

Sub-units within a property (e.g. individual apartments in a block).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `property_id` | `uuid` | FK → `properties.id` |
| `unit_number` | `text` | E.g. `"A1"`, `"101"` |
| `status` | `text` | `"Available"`, `"Occupied"`, `"Maintenance"` |
| `bedrooms` | `int` | |
| `bathrooms` | `int` | |
| `price` | `numeric` | Monthly rent or sale price in KES |
| `area_sqft` | `numeric` | |
| `created_at` | `timestamptz` | |

When a `lease` is created, the linked unit's `status` is automatically updated to `"Occupied"`.

---

### 3.4 `tenants`

Tenants managed via the admin dashboard.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `full_name` | `text` | |
| `email` | `text` | |
| `phone` | `text` | |
| `created_at` | `timestamptz` | |

Tenants join to `leases` (which join to `units` → `properties`) and to `payments`.

---

### 3.5 `leases`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `unit_id` | `uuid` | FK → `units.id` |
| `tenant_id` | `uuid` | FK → `tenants.id` |
| `start_date` | `date` | |
| `end_date` | `date` | |
| `rent_amount` | `numeric` | Monthly rent in KES |
| `created_at` | `timestamptz` | |

---

### 3.6 `payments`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `lease_id` | `uuid` | FK → `leases.id` |
| `tenant_id` | `uuid` | FK → `tenants.id` (also linked via `profiles.id` for display) |
| `amount` | `numeric` | Amount paid in KES |
| `created_at` | `timestamptz` | Payment date |

---

### 3.7 `maintenance_tickets`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `property_id` | `uuid` | FK → `properties.id` |
| `status` | `text` | `"Open"`, `"In Progress"`, `"Closed"` |
| `assigned_to` | `uuid` | FK → `profiles.id` (admin/staff) |
| `created_at` | `timestamptz` | |

---

### 3.8 `property_likes` (Favorites)

Tracks which buyers have liked/saved which properties.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `buyer_id` | `uuid` | FK → `profiles.id` |
| `property_id` | `uuid` | FK → `properties.id` |
| `created_at` | `timestamptz` | |

Unique constraint: `(buyer_id, property_id)` — one like per buyer per property.

---

### 3.9 `tours`

Scheduled property viewings.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `buyer_id` | `uuid` | FK → `profiles.id` |
| `agent_id` | `uuid` | FK → `profiles.id` |
| `property_id` | `uuid` | FK → `properties.id` |
| `scheduled_at` | `timestamptz` | The date/time of the tour |
| `status` | `text` | `"pending"`, `"confirmed"`, `"cancelled"` |
| `created_at` | `timestamptz` | |

**Join used in web app:**
```js
.select('*, properties(*), active_agent:profiles!tours_agent_id_fkey(*)')
```

---

### 3.10 `messages`

Direct messaging between buyers and agents.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `sender_id` | `uuid` | FK → `profiles.id` |
| `receiver_id` | `uuid` | FK → `profiles.id` |
| `content` | `text` | Message body |
| `read` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | |

Messages are a simple two-party model — no group threads. A "conversation" between two users is queried by filtering on both `sender_id` and `receiver_id` simultaneously.

---

### 3.11 `agencies`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | |
| `logo_url` | `text` | |
| `created_at` | `timestamptz` | |

---

## 4. Authentication Flows

All auth uses Supabase Auth (`supabase.auth.*`). OAuth tokens go through `/auth/callback` on the web; on mobile use deep link handling with the same `exchangeCodeForSession` pattern.

### 4.1 Sign Up (Email + Password)

```ts
// Step 1: Register — triggers email verification OTP
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
    },
  },
})

// Step 2: Verify 8-digit OTP sent to email
const { error } = await supabase.auth.verifyOtp({
  email,
  token: otp,           // 8-digit code
  type: 'signup',
})

// On success: user is now authenticated. Redirect to /buyer/listings.
```

**After sign-up:** The profile row is created automatically via the DB trigger. The default role is `"buyer"`.

### 4.2 Sign In (Email + Password)

```ts
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Then fetch role to decide where to redirect:
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single()

// Role → redirect:
// "Admin" | "Super Admin" → /admin/dashboard
// "buyer" | null           → /buyer/listings
```

### 4.3 OAuth (Google / Facebook)

```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',  // or 'facebook'
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    // On mobile: redirectTo should be your deep link, e.g. 'com.echelon://auth/callback'
  },
})
```

**Callback handler** — After OAuth redirect, exchange the code:

```ts
// Web: handled by /auth/callback/route.js
// Mobile: handle the deep link and call:
const { error } = await supabase.auth.exchangeCodeForSession(code)

// Then fetch profile.role and redirect accordingly
```

### 4.4 Password Reset Flow

```ts
// Step 1: Send OTP to email
await supabase.auth.resetPasswordForEmail(email)

// Step 2: Verify OTP (8-digit code, type = 'recovery')
await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' })

// Step 3: Set new password (user is now in recovery session)
await supabase.auth.updateUser({ password: newPassword })
```

### 4.5 Sign Out

```ts
await supabase.auth.signOut()
// Then clear local state and navigate to home/login
```

### 4.6 Observing Auth State

```ts
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (_event, session) => {
    const user = session?.user ?? null
    // If user exists, fetch profile from 'profiles' table
    // If user is null, clear profile state
  }
)

// Clean up on unmount:
subscription.unsubscribe()
```

---

## 5. Role-Based Access Control

### User Roles

| Role | Default | Access |
|---|---|---|
| `buyer` | Yes (all new sign-ups) | Buyer portal: listings, favorites, tours, messages, profile |
| `agent` | No (set manually) | Same as buyer + agent-specific property management |
| `Admin` | No (set manually + email whitelist) | Admin dashboard |
| `Super Admin` | No (set manually + email whitelist) | Admin dashboard with elevated permissions |

### Admin Access Gate

The admin area enforces **two** checks (both must pass):

1. Email is in the whitelist: `["hello@echelonrealty.org"]`
2. Profile `role` is `"Admin"` or `"Super Admin"`

On mobile, implement the same double-check before rendering any admin screen:

```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return navigateToLogin()

const ADMIN_WHITELIST = ['hello@echelonrealty.org']
if (!ADMIN_WHITELIST.includes(user.email)) return navigateToBuyer()

const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (!['Admin', 'Super Admin'].includes(profile?.role)) return navigateToBuyer()
// Safe to render admin screen
```

---

## 6. All Database Operations

All operations in `src/lib/db/index.js`. Replicate these exactly in the mobile app.

### 6.1 Properties

```ts
// Get all published properties (with optional filters)
const getPublicProperties = async (filters = {}) => {
  let query = supabase
    .from('properties')
    .select(`*, agent:profiles!properties_agent_id_fkey(full_name, avatar_url), agency:agencies(name, logo_url)`)
    .eq('status', 'published')

  if (filters.listing_type && filters.listing_type !== 'All')
    query = query.eq('listing_type', filters.listing_type.toLowerCase())
  if (filters.type && filters.type !== 'All')
    query = query.eq('type', filters.type.toLowerCase())
  if (filters.minPrice) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice) query = query.lte('price', filters.maxPrice)
  if (filters.bedrooms && filters.bedrooms !== 'Any') {
    const beds = parseInt(filters.bedrooms)
    query = filters.bedrooms.includes('+')
      ? query.gte('bedrooms', beds)
      : query.eq('bedrooms', beds)
  }
  if (filters.city) query = query.ilike('city', `%${filters.city.trim()}%`)
  if (filters.amenities?.length > 0) query = query.contains('amenities', filters.amenities)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Get single property with units
const getProperty = async (id) => {
  const { data, error } = await supabase
    .from('properties')
    .select('*, units(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Get single property with agent + agency (buyer detail view)
const getPropertyById = async (id) => {
  const { data, error } = await supabase
    .from('properties')
    .select(`*, agent:profiles!properties_agent_id_fkey(*), agency:agencies(*)`)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Admin: get all properties
const getProperties = async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Admin: get properties by agent
const getAgentProperties = async (agentId, status = null) => {
  let query = supabase.from('properties').select('*').eq('agent_id', agentId)
  if (status && status !== 'All') query = query.eq('status', status.toLowerCase())
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Admin: create
const createProperty = async (property) => {
  const { data, error } = await supabase
    .from('properties').insert(property).select().single()
  if (error) throw error
  return data
}

// Admin: update
const updateProperty = async (id, updates) => {
  const { data, error } = await supabase
    .from('properties').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}
```

---

### 6.2 Units

```ts
const getUnitsByProperty = async (propertyId) => {
  const { data, error } = await supabase
    .from('units').select('*').eq('property_id', propertyId)
    .order('unit_number', { ascending: true })
  if (error) throw error
  return data
}

const createUnit = async (unit) => {
  const { data, error } = await supabase
    .from('units').insert(unit).select().single()
  if (error) throw error
  return data
}

const updateUnit = async (id, updates) => {
  const { data, error } = await supabase
    .from('units').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

const deleteUnit = async (id) => {
  const { error } = await supabase.from('units').delete().eq('id', id)
  if (error) throw error
  return true
}
```

---

### 6.3 Tenants

```ts
const getTenants = async () => {
  const { data, error } = await supabase
    .from('tenants').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Get tenant with full lease + payment history
const getTenant = async (id) => {
  const { data, error } = await supabase
    .from('tenants')
    .select('*, leases(*, units(*, properties(*))), payments(*)')
    .eq('id', id).single()
  if (error) throw error
  return data
}

const createTenant = async (tenant) => {
  const { data, error } = await supabase
    .from('tenants').insert(tenant).select().single()
  if (error) throw error
  return data
}
```

---

### 6.4 Leases

```ts
// Creating a lease also sets the unit status to 'Occupied'
const createLease = async (lease) => {
  const { data, error } = await supabase
    .from('leases').insert(lease).select().single()
  if (error) throw error
  if (lease.unit_id) {
    await updateUnit(lease.unit_id, { status: 'Occupied' })
  }
  return data
}

const getLeasesByUnit = async (unitId) => {
  const { data, error } = await supabase
    .from('leases').select('*, tenants(*)')
    .eq('unit_id', unitId).order('start_date', { ascending: false })
  if (error) throw error
  return data
}
```

---

### 6.5 Payments

```ts
const recordPayment = async (payment) => {
  const { data, error } = await supabase
    .from('payments').insert(payment).select().single()
  if (error) throw error
  return data
}

const getPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, profiles(full_name), leases(units(unit_number))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
```

---

### 6.6 Favorites (`property_likes`)

```ts
// Get all favorites for a buyer (includes full property data)
const getFavorites = async (userId) => {
  const { data, error } = await supabase
    .from('property_likes')
    .select('*, properties(*)')
    .eq('buyer_id', userId)
  if (error) throw error
  return data
}

// Toggle: removes if exists, adds if not. Returns true if now liked.
const toggleFavorite = async (userId, propertyId) => {
  const { data: existing } = await supabase
    .from('property_likes').select('*')
    .eq('buyer_id', userId).eq('property_id', propertyId)
    .maybeSingle()

  if (existing) {
    await supabase.from('property_likes').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('property_likes')
      .insert({ buyer_id: userId, property_id: propertyId })
    return true
  }
}
```

---

### 6.7 Tours

```ts
// Get upcoming tours for a buyer
const getScheduledTours = async (userId) => {
  const { data, error } = await supabase
    .from('tours')
    .select('*, properties(*), active_agent:profiles!tours_agent_id_fkey(*)')
    .eq('buyer_id', userId)
    .order('scheduled_at', { ascending: true })
  if (error) throw error
  return data
}

// Schedule a new tour
const scheduleTour = async (tourData) => {
  // tourData: { buyer_id, agent_id, property_id, scheduled_at, status: 'pending' }
  const { data, error } = await supabase
    .from('tours').insert(tourData).select().single()
  if (error) throw error
  return data
}
```

---

### 6.8 Messages

```ts
// Get all messages between two users (ordered ascending by time)
const getMessages = async (userId, partnerId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),` +
      `and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// Send a message
const sendMessage = async (messageData) => {
  // messageData: { sender_id, receiver_id, content, read: false }
  const { data, error } = await supabase
    .from('messages').insert(messageData).select().single()
  if (error) throw error
  return data
}
```

---

### 6.9 Profiles

```ts
// Get profile by user ID
const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).single()
  if (error) return null
  return data
}

// Update profile fields (full_name, avatar_url, phone, etc.)
const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles').update(updates).eq('id', userId).select().single()
  if (error) throw error
  return data
}
```

---

### 6.10 Agents

```ts
const getAgents = async () => {
  const { data, error } = await supabase
    .from('profiles').select('*')
    .eq('role', 'agent')
    .order('full_name', { ascending: true })
  if (error) throw error
  return data
}
```

---

### 6.11 Buyer Dashboard Stats

```ts
const getBuyerDashboardStats = async (userId) => {
  const [favRes, tourRes, msgRes] = await Promise.all([
    supabase.from('property_likes')
      .select('*', { count: 'exact', head: true }).eq('buyer_id', userId),
    supabase.from('tours')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', userId)
      .gte('scheduled_at', new Date().toISOString()),
    supabase.from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId).eq('read', false),
  ])

  return {
    favoriteCount: favRes.count ?? 0,
    tourCount: tourRes.count ?? 0,
    unreadCount: msgRes.count ?? 0,
  }
}
```

---

## 7. Real-Time Subscriptions

The web app uses Supabase Realtime for live message delivery. Use the same pattern in mobile.

### 7.1 Live Messages

```ts
// Subscribe to new messages in the current conversation
const channel = supabase
  .channel('realtime_messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      // Only events where the message involves BOTH users
      filter: `or(and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),` +
              `and(sender_id.eq.${partnerId},receiver_id.eq.${userId}))`,
    },
    (payload) => {
      // Append new message to local state
      // Guard against duplicates from optimistic updates:
      // if (messages.find(m => m.id === payload.new.id)) return
      appendMessage(payload.new)
    }
  )
  .subscribe()

// Clean up when leaving the conversation screen:
supabase.removeChannel(channel)
```

### 7.2 Extending Realtime

The same pattern works for any table. Common extensions for mobile:
- Subscribe to `tours` `UPDATE` events to notify buyers when a tour is confirmed
- Subscribe to `property_likes` to sync favorites across devices
- Subscribe to `properties` `UPDATE` for listing status changes

---

## 8. Auth Context (State Management Pattern)

The web app's `AuthContext` is the reference for how auth state should be managed. Implement equivalent logic in your mobile state management:

```ts
// State shape:
// { user: User | null, profile: Profile | null, isLoaded: boolean }

// On app start:
// 1. Call supabase.auth.getUser() to restore session
// 2. If user exists, fetch profile from 'profiles' table
// 3. Set isLoaded = true

// Subscribe to changes:
supabase.auth.onAuthStateChange(async (_event, session) => {
  const user = session?.user ?? null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    // update state
  } else {
    // clear state
  }
})

// Sign out:
await supabase.auth.signOut()
// clear local user/profile state
// navigate to home/login
```

---

## 9. Property Filter Reference

The `getPublicProperties` function supports these filter keys:

| Filter Key | Type | Behaviour |
|---|---|---|
| `listing_type` | `string` | Exact match (lowercased). Values: `sale`, `rent`, `lease`, `short-let`, `off-plan` |
| `type` | `string` | Exact match (lowercased). Values: `apartment`, `villa`, `townhouse`, `penthouse`, `plot`, etc. |
| `types` | `string[]` | Multi-select via `.in()`. Takes priority over `type` if both present |
| `minPrice` | `number` | `price >= minPrice` (KES) |
| `maxPrice` | `number` | `price <= maxPrice` (KES) |
| `bedrooms` | `string` | `"3"` = exact, `"3+"` = minimum. `"Any"` = no filter |
| `bathrooms` | `string` | Same pattern as `bedrooms` |
| `city` | `string` | Case-insensitive partial match via `ilike` |
| `minArea` | `number` | `area_sqft >= minArea` |
| `maxArea` | `number` | `area_sqft <= maxArea` |
| `amenities` | `string[]` | All listed amenities must be present (array `@>` containment) |

---

## 10. Data Aliases

When the web app returns property data to components, it remaps some column names:

| DB Column | Alias Used in App |
|---|---|
| `address` | `location` |
| `area_sqft` | `sqft` |
| `bedrooms` | `beds` |
| `bathrooms` | `baths` |

Apply the same mapping in the mobile app's data layer for consistency.

---

## 11. Key Conventions

1. **All prices are stored and returned in KES (Kenyan Shillings).** Currency conversion (KES ↔ USD) happens at the display layer via a `CurrencyContext` that calls `ipapi.co` to detect the user's country. Never store or query USD values.

2. **The `featured` flag is derived, not stored.** A property is "featured" if `views_count > 100`. There is no `is_featured` boolean column.

3. **Soft deletes are not used.** Properties use a `status` field (`published`, `draft`, `archived`). Never hard-delete a property — update `status` to `"archived"` instead.

4. **Public queries filter on `status = "published"`.** Always include `.eq('status', 'published')` on any buyer-facing property query.

5. **Messages use `read: false` by default.** When a buyer opens a conversation, mark messages as read:
   ```ts
   await supabase.from('messages')
     .update({ read: true })
     .eq('receiver_id', currentUserId)
     .eq('sender_id', partnerId)
     .eq('read', false)
   ```

6. **The `profiles` table is the single source of truth for user display data.** Always join or separately fetch `profiles` when you need a user's name or avatar — never rely on `auth.users` metadata directly.

7. **OTP codes are 8 digits long** (both signup verification and password recovery). The Supabase project is configured for 8-digit OTPs, not the default 6.

8. **Admin email whitelist is hardcoded** in the web app as `["hello@echelonrealty.org"]`. Replicate this check in mobile before granting admin access, even if the DB role check passes.
