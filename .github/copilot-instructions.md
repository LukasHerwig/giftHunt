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
  - `.env.dev` - Local development (Docker)
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

## 🎯 Component Architecture

### Dialog Components Pattern

- **Structure**: Always wrap DialogTrigger in Dialog component
- **State management**: Use separate state for dialog open/close
- **Error handling**: Use try/catch with proper user feedback via `toast`
- **Example**:
  ```tsx
  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogTrigger asChild>
      <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>{/* Dialog content */}</DialogContent>
  </Dialog>
  ```

### Form Handling

- **Validation**: Always validate on both client and server
- **Loading states**: Use loading state for buttons during async operations
- **Error feedback**: Use `toast.error()` and `toast.success()` for user feedback
- **Reset**: Clear form state after successful submission

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

- **Component files**: One component per file
- **Hooks**: Extract reusable logic into custom hooks
- **Utils**: Shared utilities in `/lib` directory
- **Types**: Database types in `/integrations/supabase/types.ts`

### Error Handling

- **Graceful degradation**: App should work even if some features fail
- **User feedback**: Always inform users about errors and successes
- **Logging**: Comprehensive logging for debugging

## 🎨 UI/UX Guidelines

### Design System

- **Consistent spacing**: Use Tailwind spacing scale
- **Color scheme**: Stick to defined color palette
- **Typography**: Consistent font sizes and weights
- **Interactive states**: Proper hover, focus, and disabled states

### Accessibility

- **Semantic HTML**: Use proper HTML elements
- **ARIA labels**: Add labels for screen readers
- **Keyboard navigation**: Ensure all features work with keyboard
- **Focus management**: Proper focus handling in dialogs and forms

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
