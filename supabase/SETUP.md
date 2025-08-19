# Supabase Setup Guide for MONA B2B

## Prerequisites
1. Create a Supabase project at https://supabase.com
2. Get your project URL and API keys from the project settings

## Database Setup

### 1. Run Migrations
Execute the SQL files in order in your Supabase SQL editor:

1. `migrations/20240119_initial_schema.sql` - Creates all tables and indexes
2. `migrations/20240119_rls_policies.sql` - Sets up Row Level Security policies
3. `migrations/20240119_storage_buckets.sql` - Creates storage buckets

### 2. Enable Authentication Providers

In Supabase Dashboard > Authentication > Providers:

#### Email Authentication
- Already enabled by default
- Configure email templates as needed

#### Google OAuth
1. Enable Google provider
2. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
3. Add redirect URLs to Google Console

#### Kakao OAuth
1. Enable Kakao provider (if available) or use generic OAuth
2. Add Kakao app credentials:
   - Client ID
   - Client Secret
3. Configure redirect URLs

### 3. Environment Variables
Copy the following to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Storage Buckets

The following buckets are created:

1. **business-licenses** (private)
   - Stores business registration documents
   - Access: Business owners and admins only

2. **donation-photos** (public)
   - Stores donation item photos
   - Access: Public read, authenticated write

3. **tax-documents** (private)
   - Stores tax receipts and documents
   - Access: Related business and admins

4. **esg-reports** (private)
   - Stores ESG impact reports
   - Access: Related business and admins

5. **post-donation-media** (public)
   - Stores post-donation photos/videos
   - Access: Public read, admin write

## Database Schema

### Tables
- **profiles**: User profiles with roles (business/admin)
- **businesses**: Business registration and details
- **donations**: Donation submissions and tracking
- **quotes**: Handling fee quotations
- **notifications**: User notifications
- **subscriber_donations**: Offline donation records

### User Roles
- **business**: Regular business users
- **admin**: Platform administrators

## RLS (Row Level Security) Policies

All tables have RLS enabled with the following access patterns:

- **Business users** can:
  - View and update their own data
  - Create donations after approval
  - Accept/reject quotes

- **Admin users** can:
  - View all data
  - Update business approvals
  - Create quotes
  - Manage offline donations

## Testing

### Test Database Connection
```typescript
import { createClient } from '@/lib/supabase'

const supabase = createClient()
const { data, error } = await supabase.from('businesses').select('*')
```

### Test Authentication
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
})
```

### Test Storage
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('donation-photos')
  .upload('path/to/file.jpg', file)
```

## Admin User Setup

To create an admin user:

1. Create a user through Supabase Auth
2. Update their profile role in SQL:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

## Troubleshooting

### Common Issues

1. **RLS policies blocking access**
   - Check user authentication status
   - Verify user role in profiles table
   - Check specific policy conditions

2. **Storage upload fails**
   - Verify bucket exists
   - Check file size limits
   - Ensure proper authentication

3. **Migration errors**
   - Run migrations in order
   - Check for existing tables/types
   - Verify PostgreSQL extensions

## Next Steps

1. Set up email templates in Supabase
2. Configure OAuth redirect URLs
3. Set up webhook endpoints for real-time updates
4. Configure email service (Resend) for notifications