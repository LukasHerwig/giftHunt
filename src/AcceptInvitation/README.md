# AcceptInvitation Feature

This directory contains the complete AcceptInvitation feature organized using a feature-based (co-location) architecture pattern.

## 📁 Structure

```
AcceptInvitation/
├── index.tsx                    # Main component
├── types.ts                     # TypeScript interfaces and types
├── components/                  # UI components
│   ├── index.ts                # Component exports
│   ├── LoadingState.tsx        # Loading spinner component
│   ├── ErrorState.tsx          # Error display component  
│   ├── SuccessState.tsx        # Main invitation display
│   ├── WishlistInfo.tsx        # Wishlist information display
│   ├── InviterInfo.tsx         # Inviter information display
│   ├── AdminPrivileges.tsx     # Admin privileges explanation
│   └── SignInActions.tsx       # Sign in call-to-action
├── hooks/                       # Custom React hooks
│   ├── index.ts                # Hook exports
│   └── useAcceptInvitation.ts  # Main feature hook
└── services/                    # Data layer and API calls
    ├── index.ts                # Service exports
    └── AcceptInvitationService.ts # Supabase service methods
```

## 🎯 Architecture Pattern

This feature uses **co-location** (also known as **feature-based architecture**) where:

- All related code for the AcceptInvitation feature is grouped together
- Components, hooks, services, and types are organized by feature rather than by type
- Each feature is self-contained and can be easily moved or refactored
- Dependencies are clear and explicit

## 📋 Components

### Main Component (`index.tsx`)
- Orchestrates state management and component rendering
- Uses the main hook for business logic
- Handles different UI states (loading, error, success)

### State Components
- **LoadingState**: Shows loading spinner while processing invitation
- **ErrorState**: Displays error messages with home navigation
- **SuccessState**: Main invitation acceptance interface

### Display Components
- **WishlistInfo**: Shows wishlist title and description
- **InviterInfo**: Displays who sent the invitation
- **AdminPrivileges**: Explains what admin access provides
- **SignInActions**: Call-to-action buttons for authentication

## 🔧 Hooks

### `useAcceptInvitation`
The main custom hook that:
- Manages invitation validation state
- Handles data loading from multiple sources
- Processes navigation logic
- Manages session storage for pending invitations
- Provides action handlers for UI interactions

## 🔌 Services

### `AcceptInvitationService`
Static class containing all Supabase operations:
- `getInvitationByToken()`: Fetch invitation by token
- `getCurrentUser()`: Check authentication status
- `validateInvitation()`: Validate invitation status
- `buildInvitationData()`: Combine data from multiple sources
- `storeInvitationToken()`: Manage session storage

## 📝 Types

All TypeScript interfaces and types used throughout the feature:
- `InvitationData`: Complete invitation information
- `CurrentUser`: Authenticated user data
- `AcceptInvitationState`: Component state structure
- `InvitationQueryResult`: Raw invitation query data

## 🔄 Data Flow

1. **URL parsing**: Extract token from search parameters
2. **Hook initialization**: `useAcceptInvitation` starts validation
3. **Service calls**: Single `get_invitation_by_token` RPC call (invitation, wishlist and inviter data)
4. **Data validation**: Check invitation status and expiration
5. **State updates**: Update component state based on results
6. **Component rendering**: Display appropriate UI state
7. **User actions**: Handle sign-in navigation and token storage

## 🎨 Benefits of This Structure

### ✅ Advantages
- **Maintainability**: Clear separation of concerns
- **Reusability**: Components can be used independently
- **Testability**: Each part can be tested in isolation
- **Readability**: Smaller, focused components
- **Scalability**: Easy to extend with new features

### 📦 Clean Architecture
```tsx
// Clean, organized imports
import { useAcceptInvitation } from './hooks';
import { LoadingState, ErrorState, SuccessState } from './components';
```

## 🔄 Migration from Monolithic Component

This structure was refactored from a single 200+ line component into:
- **7 focused components** (20-80 lines each)
- **1 custom hook** (80 lines) for state management
- **1 service class** (120 lines) for data operations
- **Type definitions** separated and organized

The refactoring improved:
- Code organization and readability
- Component reusability
- Error handling consistency
- Testing capabilities

## 🚀 Usage

```tsx
// In your router or parent component
import AcceptInvitation from '@/pages/AcceptInvitation';

// The component handles all internal state management
<Route path="/accept-invitation" element={<AcceptInvitation />} />
```

## 🔍 Key Features

- **Token validation**: Secure invitation token processing
- **Multi-state UI**: Loading, error, and success states
- **Data aggregation**: Combines invitation, user, and wishlist data
- **Navigation handling**: Redirects authenticated users appropriately
- **Session management**: Stores tokens for post-auth processing
- **Internationalization**: Full i18n support throughout
- **Error handling**: Comprehensive error states and messaging

This structure provides a solid foundation for invitation-based features while maintaining excellent developer experience and user interface consistency.