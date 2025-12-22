# GitHub Copilot Instructions for Wishlist App

## Project Overview

This is a React + TypeScript wishlist application using Supabase as the backend, with a sophisticated admin invitation system. The app follows modern development practices with proper database management, internationalization, and security considerations.

## 🌍 Internationalization (i18n)

- **Framework**: Uses `react-i18next` for internationalization
- **File Structure**: Translation files should be in `src/locales/` (e.g., `en.json`, `de.json`)
- **Usage Pattern**: Always use `const { t } = useTranslation();` and `t('key.path')` for all user-facing text
- **Key Naming**: Use nested keys like `'manageWishlist.addItem'` or `'messages.failedToLoad'`
- **Best Practice**: Never hardcode strings in JSX - everything should be translatable
- **Example**:
  ```tsx
  const { t } = useTranslation();
  <Button>{t('manageWishlist.addItem')}</Button>;
  ```

## 🗄️ Database Architecture & Migration Strategy

### Environment Setup

- **Local Development**: Uses Docker via `npx supabase start` (localhost:54321)
- **Production**: Remote Supabase cloud database
- **Environment Files**:
  - `.env.local` - Local development (Docker)
  - `.env.prod` - Production (Cloud)

### Migration Workflow

1. **Always test locally first**: Develop and test all changes in local Docker environment
2. **Migration naming**: Use timestamp format `YYYYMMDDHHMMSS_descriptive_name.sql`
3. **Local application**: `npx supabase db reset` applies all migrations to local DB
4. **Production deployment**: `npx supabase db push` applies migrations to remote DB
5. **Feature branch workflow**: Test locally → merge to main → deploy migrations

### Data Synchronization

- **Script available**: `./sync-remote-data.sh` syncs production data to local
- **Manual process**:
  ```bash
  npx supabase db dump --data-only -f remote_data.sql
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f remote_data.sql
  ```

## 🔐 Security & RLS (Row Level Security)

### RLS Policy Patterns

- **User data**: `auth.uid() = user_id` for personal data access
- **Wishlist access**: Creators get full access, admins get read access
- **Admin invitations**: Complex policies allowing invitation acceptance workflow
- **Cross-table policies**: Avoid circular references - use simple auth.uid() checks when possible

### Common RLS Policy Template

```sql
-- Simple ownership check
CREATE POLICY "users_own_data" ON table_name
FOR ALL USING (auth.uid() = user_id);

-- Admin access pattern
CREATE POLICY "admin_access" ON table_name
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM wishlist_admins
    WHERE wishlist_id = table_name.wishlist_id
    AND admin_id = auth.uid()
  )
);
```

## �️ Feature-Based Architecture

This application follows a **feature-based architecture** where code is organized by business features rather than technical concerns. Each feature is self-contained with its own components, services, hooks, and types.

### Feature Structure

```
src/
├── FeatureName/
│   ├── components/          # UI components specific to this feature
│   │   ├── Component1.tsx
│   │   ├── Component2.tsx
│   │   └── index.ts        # Component exports
│   ├── hooks/              # Custom hooks for state management
│   │   └── useFeature.ts
│   ├── services/           # Business logic and API operations
│   │   └── FeatureService.ts
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts
│   ├── index.tsx           # Main feature component
│   └── README.md           # Feature documentation
├── components/             # Shared/system components
├── pages/                  # System pages (404, etc.)
└── lib/                    # Utilities and configurations
```

### Current Features

- **ManageWishlist** - Wishlist management with items, admins, settings
- **Dashboard** - Main app dashboard with wishlists overview
- **AdminWishlist** - Admin view for wishlist oversight
- **AcceptInvitation** - Invitation acceptance workflow
- **PublicWishlist** - Public-facing wishlist view with item claiming
- **Profile** - User profile management
- **Auth** - Authentication state management

### Feature Development Guidelines

1. **Separation of Concerns**: Each feature contains only related functionality
2. **Self-Contained**: Features should be independent and reusable
3. **Consistent Structure**: All features follow the same organizational pattern
4. **Service Layer**: Business logic isolated in service classes
5. **Custom Hooks**: State management centralized in feature-specific hooks
6. **Component Composition**: Break complex UIs into focused components
7. **Type Safety**: Comprehensive TypeScript interfaces for all data

### When to Create a New Feature

✅ **Create a feature folder when:**

- Building a distinct business capability
- Component will have multiple sub-components
- Requires its own state management
- Has specific business logic/services
- Will be reused or extended

❌ **Keep in shared locations when:**

- Simple utility components
- System/infrastructure components (404 pages, error boundaries)
- Single-purpose components without complex logic

## 🔄 State Management Patterns

### Data Loading

- **Use useCallback**: For functions that might be dependencies
- **Error boundaries**: Wrap async operations in try/catch
- **Loading states**: Always show loading indicators for better UX
- **Example**:
  ```tsx
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('table').select('*');
      if (error) throw error;
      setData(data || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [dependencies]);
  ```

### Admin System Logic

- **One admin per wishlist**: Business rule enforced by database constraints
- **Invitation workflow**:
  1. Creator sends invitation
  2. Recipient gets email with token
  3. Recipient accepts → creates admin record + marks invitation accepted
- **Visibility logic**: Hide invite button when admin exists OR pending invitation exists

## 🐛 Debugging & Troubleshooting

### Database Issues

- **RLS errors**: Check policies allow the operation for current user
- **Missing data**: Verify joins and foreign key relationships
- **Policy conflicts**: Use simple auth.uid() checks to avoid circular references

### Common Debug Patterns

```tsx
// Add comprehensive logging
console.log('Debug - admins:', admins, 'admins.length:', admins.length);
console.log('Debug - invitations:', invitations);
console.log('Debug - should show button:', shouldShow);

// Test queries in Supabase dashboard first
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', value);
console.log('Query result:', { data, error });
```

## 🚀 Development Workflow

### Daily Development

1. **Start local services**: `npx supabase start`
2. **Sync data** (if needed): `./sync-remote-data.sh`
3. **Start dev server**: `npm run dev`
4. **Make changes**: Always test locally first
5. **Migration changes**: Create migration files for schema changes

## 🌐 Switching Between Local and Production Environments

To safely develop and test against either your local Supabase database or the production (remote) Supabase instance, use the following workflow:

### Quick Environment Switching with NPM Scripts

You can use these scripts for fast switching and running the dev server:

- **Local DB:**

  ```bash
  npm run dev:local
  ```

  Switches to your local DB and starts the dev server in one step.

- **Production DB:**
  ```bash
  npm run dev:prod
  ```
  Switches to your production DB and starts the dev server in one step.

Manual steps are still available below if you want more control.

### Switching to Local Development (Local DB)

1. **Ensure `.env.local` exists** with your local Supabase settings (URL: `http://127.0.0.1:54321`).
2. **If you are currently using production**, restore your local environment:

```bash
mv .env.local.backup .env.local 2>/dev/null || echo "Already using local"
```

3. **Start local Supabase** (if not running):

```bash
npx supabase start
```

4. **Start the dev server:**

```bash
npm run dev
```

5. **Visual indicator:** You should see the orange banner "🚧 LOCAL DEVELOPMENT MODE" in the app.

### Switching to Production (Remote DB)

1. **Backup your local env and switch to production:**

```bash
mv .env.local .env.local.backup 2>/dev/null || echo "Already using production"
```

2. **Start the dev server:**

```bash
npm run dev
```

3. **Visual indicator:** The orange banner will be gone. The app is now using the production Supabase instance.

### How to Check Which Environment is Active

- **Banner:** Orange banner = local, no banner = production
- **Console:**
  ```js
  console.log(import.meta.env.VITE_SUPABASE_URL);
  // Local: http://127.0.0.1:54321
  // Production: https://pjiofxvhzcengexymoms.supabase.co
  ```
- **Network tab:** API calls go to `127.0.0.1:54321` (local) or `pjiofxvhzcengexymoms.supabase.co` (production)

### Safety Tips

- **Never push migrations directly to production.**
- **Always test locally first.**
- **Switch back to local after testing production:**
  ```bash
  mv .env.local.backup .env.local
  ```

See `DEVELOPMENT.md` for more details and troubleshooting.

### Feature Branch Deployment

1. **Local testing**: Complete all testing in local environment
2. **Create migration**: If schema changes needed
3. **Commit changes**: Include both code and migration files
4. **Merge to main**: Only after local testing is complete
5. **Deploy migrations**: `npx supabase db push` to production

### Testing Strategy

- **Local first**: Always test changes in local Docker environment
- **Real data testing**: Use `./sync-remote-data.sh` to test with production data
- **Migration testing**: Test both up and rollback scenarios
- **Cross-browser**: Test UI components in multiple browsers

## 🛠️ Supabase Best Practices

### Query Patterns

```tsx
// Good: Specific selection with joins
const { data, error } = await supabase
  .from('wishlist_admins')
  .select(
    `
    id,
    admin_id,
    created_at,
    profiles!admin_id (
      email
    )
  `
  )
  .eq('wishlist_id', id);

// Good: Error handling
if (error) throw error;
```

## 🌐 Base URL, Invitation Link, and GitHub Pages Deployment Handling

### Base URL Management

- **Always use a centralized utility** for generating the app's base URL. In this project, use `getBaseUrl()` from `src/lib/urlUtils.ts`.
- The base URL is determined by the `VITE_APP_BASE_URL` environment variable, with a fallback to `window.location.origin` for local development.
- **Never hardcode URLs**—always use the utility to ensure correct paths in all environments (local, production, GitHub Pages).

### Invitation Link Generation

- **All invitation links** (for emails, sharing, etc.) must be generated using `getBaseUrl()` to ensure the `/giftHunt/` base path is included in production.
- Example:
  ```ts
  const invitationLink = `${getBaseUrl()}/accept-invitation?token=${token}`;
  ```
- The invitation link is passed to the Supabase Edge Function, which uses it directly in the email template.
- **Do not generate or modify the base URL in the Edge Function**—it should always receive the full, correct link from the client.

### Email Template Handling

- The Edge Function (`supabase/functions/send-invitation/index.ts`) receives the full invitation link and inserts it into the email template.
- The email template uses the provided link for the "Accept Invitation" button. No further modification is needed in the function.

### GitHub Pages Deployment & Environment Variables

- **Set the `VITE_APP_BASE_URL` repository variable** in GitHub to the full production URL (e.g., `https://lukasherwig.github.io/giftHunt`).
- Steps:
  1. Go to your GitHub repository → Settings → Secrets and variables → Actions → Variables
  2. Add a variable:
     - Name: `VITE_APP_BASE_URL`
     - Value: `https://lukasherwig.github.io/giftHunt`
- The GitHub Actions workflow will use this variable for production builds, ensuring all links are correct.

### Testing and Verification

- After deployment, always test:
  - Invitation emails (check that links include `/giftHunt/` and work in production)
  - Shared/public wishlist links
  - Navigation and redirects
- If links are broken or missing the base path, verify the environment variable and that all code uses `getBaseUrl()`.

### Summary Checklist

- [x] All URLs generated with `getBaseUrl()`
- [x] `VITE_APP_BASE_URL` set in GitHub repository variables
- [x] Edge Function receives and uses full invitation link
- [x] Email template uses provided link directly
- [x] All deployments tested for correct link behavior

### Authentication

- **Check auth state**: Always verify user is authenticated
- **Handle sessions**: Properly manage session state
- **RLS reliance**: Let RLS handle data access control

## 📦 Package Management & Dependencies

### Key Dependencies

- **UI**: `@radix-ui/react-*` components with Tailwind CSS
- **Forms**: React Hook Form for complex forms
- **State**: React built-in state management
- **Database**: Supabase client
- **i18n**: react-i18next
- **Icons**: Lucide React

### Development Dependencies

- **Database**: Supabase CLI for local development
- **Linting**: ESLint with TypeScript support
- **Building**: Vite for fast development and building

## 🔍 Code Quality Guidelines

### TypeScript Usage

- **Interface definitions**: Create proper interfaces for all data types
- **Type safety**: Use TypeScript strictly, avoid `any`
- **Database types**: Generate types from Supabase schema

### Code Organization

- **Feature-based structure**: Organize by business features, not technical concerns
- **Component files**: One component per file within feature folders
- **Hooks**: Custom hooks in feature `hooks/` directories for state management
- **Services**: Business logic in feature `services/` directories
- **Types**: Feature-specific types in feature `types/` directories
- **Shared utilities**: Common utilities in `/lib` directory
- **Database types**: Global types in `/integrations/supabase/types.ts`

### Error Handling

- **Graceful degradation**: App should work even if some features fail
- **User feedback**: Always inform users about errors and successes
- **Logging**: Comprehensive logging for debugging

## 🎨 UI/UX Guidelines (iOS Design System)

This application follows a strict **iOS-inspired design system** to provide a premium, native-like experience.

### Design Tokens

- **Backgrounds**: Pure black (`#000000`) for main backgrounds, dark gray (`#1C1C1E`) for secondary surfaces.
- **Accents**: iOS Blue (`#007AFF`) for primary actions, iOS Green (`#34C759`) for success states.
- **Radii**: Large corner radii (typically `24px` or `rounded-[24px]`) for cards and dialogs.
- **Typography**: Bold, tracking-tight headers (`tracking-tight`) and standard system font sizes (17px for body, 13px for labels).

### Layout Patterns

- **Grid Systems**:
  - Item lists: `grid-cols-2` on mobile, `md:grid-cols-3` on desktop.
  - Dashboard sections: `grid-cols-1` on mobile, `md:grid-cols-2` on desktop.
- **Immersive Headers**: Large, high-contrast headers with backdrop blurs (`backdrop-blur-xl`) and gradient overlays.
- **Card Design**: Square aspect ratios (`aspect-square`) for item cards with centered content or bottom-aligned labels.

### Responsive Overlays

- **Mobile**: Always use **Bottom Sheets** (`Drawer` from `@/components/ui/drawer`) for forms and settings.
- **Desktop**: Use centered **Dialogs** (`Dialog` from `@/components/ui/dialog`).
- **Implementation**: Use the `useIsMobile` hook to switch between `Drawer` and `Dialog` dynamically.

### Accessibility

- **Semantic HTML**: Use proper HTML elements
- **ARIA labels**: Add labels for screen readers
- **Keyboard navigation**: Ensure all features work with keyboard
- **Focus management**: Proper focus handling in dialogs and forms. **Crucial**: Define form content outside the main component to prevent focus loss during re-renders.

## 🏗️ Component Architecture & Stability

### Preventing Focus Loss in Forms

A critical pattern in this app is ensuring that input fields do not lose focus during re-renders.

- **Rule**: Never define a sub-component (like `FormContent`) inside the body of another component.
- **Pattern**: Define the `FormContent` as a standalone component outside the main component file or at the top level of the file.
- **Reason**: Defining components inline causes React to treat them as new types on every render, destroying the DOM state and focus.

### Dialog/Drawer Structure

```tsx
// 1. Define FormContent OUTSIDE the main component
const FormContent = ({ ...props }) => <form>/* inputs here */</form>;

// 2. Main component handles the responsive wrapper
export const MyDialog = ({ open, onOpenChange, ...props }) => {
  const isMobile = useIsMobile();
  const formProps = { ...props, onOpenChange };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <FormContent {...formProps} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FormContent {...formProps} />
      </DialogContent>
    </Dialog>
  );
};
```

### Action Placement

- **Primary Actions**: Top right of the header (e.g., "Save" or "Check" icon).
- **Cancel/Close**: Top left of the header (e.g., "X" icon).
- **Destructive Actions**: Full-width button at the very bottom of the form/scrollable area (e.g., "Remove Item").

## 📝 Documentation Standards

### Code Comments

- **Complex logic**: Explain why, not just what
- **Database queries**: Document the purpose of complex queries
- **Business rules**: Document important business logic

### Migration Comments

```sql
-- Clear description of what this migration does
-- Include the business reason for the change
-- Note any data migration or breaking changes
```

This comprehensive guide should be referenced for all future development to maintain consistency and quality across the application.
