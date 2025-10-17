# Profile Feature

This feature handles user profile management and account information display.

## Structure

```
src/Profile/
├── components/
│   ├── PersonalInformationCard.tsx    # Main profile information display
│   ├── ProfileLoadingState.tsx        # Loading state component
│   ├── ProfileNotFoundState.tsx       # Not found state component
│   └── index.ts                       # Component exports
├── hooks/
│   └── useProfile.ts                  # Profile data management hook
├── services/
│   └── ProfileService.ts              # Profile data operations
├── types/
│   └── index.ts                       # TypeScript interfaces
├── index.tsx                          # Main Profile component
└── README.md                          # This file
```

## Components

### PersonalInformationCard

- Displays user profile information (email, created date)
- Handles profile loading and error states
- Uses internationalization for all text

### ProfileLoadingState

- Skeleton loading state for profile data
- Provides visual feedback during data fetching

### ProfileNotFoundState

- Error state when profile cannot be loaded
- Provides user feedback with appropriate messaging

## Services

### ProfileService

- `loadProfile(userId: string)`: Loads user profile data
- Handles Supabase database interactions
- Provides error handling and type safety

## Hooks

### useProfile

- Manages profile state and loading
- Provides `profile`, `loading`, and `error` states
- Handles profile data fetching lifecycle

## Types

### ProfileData

- User profile information structure
- Includes email and created_at fields

### ProfileState

- Hook state management interface
- Defines profile, loading, and error states

## Usage

```tsx
import { Profile } from '@/Profile';

// In your router or app
<Route path="/profile" element={<Profile />} />;
```

## Dependencies

- React (hooks, components)
- React Router (navigation)
- Supabase (database operations)
- react-i18next (internationalization)
- UI components (Card, Button, etc.)
