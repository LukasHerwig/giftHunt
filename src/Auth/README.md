# Auth Feature

This feature handles authentication state management, session checking, and routing based on authentication status and pending invitations.

## Structure

```
src/Auth/
├── index.tsx                   # Main Auth component
├── components/
│   ├── index.ts               # Component exports
│   ├── AuthLoadingState.tsx   # Loading spinner during session check
│   └── AuthFormWrapper.tsx    # Wrapper for the AuthPage component
├── hooks/
│   └── useAuth.ts             # Main hook for auth state management
├── services/
│   └── AuthService.ts         # Service for auth-related operations
└── types/
    └── index.ts               # TypeScript interfaces
```

## Key Components

### AuthLoadingState

- Simple loading spinner component
- Displayed while checking authentication status
- Full-screen centered loading indicator

### AuthFormWrapper

- Thin wrapper around the existing AuthPage component
- Maintains separation of concerns
- Could be extended with additional auth-specific logic

## Hook: useAuth

Manages authentication state and navigation logic:

- **Session Checking**: Verifies if user is already authenticated
- **Invitation Handling**: Manages pending invitation tokens in session storage
- **Navigation Logic**: Routes users appropriately based on auth state
- **Auth State Listening**: Subscribes to auth state changes
- **Cleanup**: Properly unsubscribes from auth listeners

## Service: AuthService

Handles all authentication-related operations:

- `getCurrentSession()`: Gets current session from Supabase
- `getPendingInvitationToken()`: Retrieves pending invitation token from session storage
- `removePendingInvitationToken()`: Cleans up invitation token from session storage
- `createAuthStateChangeListener()`: Sets up auth state change subscription

## Key Features

1. **Session Management**: Checks and manages user sessions
2. **Invitation Flow**: Handles pending invitation tokens for seamless user experience
3. **Automatic Navigation**: Routes authenticated users appropriately
4. **Loading States**: Provides feedback during session checks
5. **Auth State Listening**: Responds to authentication changes in real-time
6. **Clean Separation**: Separates auth logic from UI components

## Authentication Flow

1. **Initial Load**: Component checks if user has existing session
2. **Session Found**:
   - Check for pending invitation token
   - Navigate to invitation acceptance or dashboard
3. **No Session**: Show authentication form
4. **Auth State Changes**: Listen for login/logout events and react accordingly
5. **Invitation Handling**: Seamlessly redirect to invitation acceptance after login

## Usage

```tsx
import Auth from '@/Auth';

// Used in routing
<Route path="/auth" element={<Auth />} />;
```

The component automatically handles:

- Session checking
- Authentication state management
- Navigation based on auth status
- Pending invitation token management

## Dependencies

- React Router for navigation
- Supabase for authentication
- Session storage for invitation token management
- Existing AuthPage component for the actual auth form

## Integration Points

- **AuthPage Component**: Uses existing auth form component
- **Session Storage**: Manages pending invitation tokens
- **Navigation**: Integrates with React Router for seamless redirects
- **Supabase Auth**: Leverages Supabase authentication system
