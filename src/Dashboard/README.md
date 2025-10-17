# Dashboard Feature

This feature provides the main dashboard functionality where users can view their wishlists, admin wishlists, pending invitations, and create new wishlists.

## Structure

```
src/Dashboard/
├── index.tsx                       # Main Dashboard component
├── components/
│   ├── index.ts                    # Component exports
│   ├── DashboardLoadingState.tsx   # Loading spinner during data fetch
│   ├── EnvironmentIndicator.tsx    # Development environment indicator
│   ├── CreateWishlistDialog.tsx    # Modal for creating new wishlists
│   ├── PendingInvitationsSection.tsx # Displays pending admin invitations
│   ├── CreateWishlistButton.tsx    # Button to open create dialog
│   ├── MyWishlistsSection.tsx      # User's owned wishlists
│   └── AdminWishlistsSection.tsx   # Wishlists where user is admin
├── hooks/
│   └── useDashboard.ts             # Main hook for dashboard state
├── services/
│   └── DashboardService.ts         # API service for dashboard operations
└── types/
    └── index.ts                    # TypeScript interfaces
```

## Key Components

### DashboardLoadingState

- Simple loading spinner with text
- Displayed while fetching dashboard data
- Full-screen centered loading indicator

### EnvironmentIndicator

- Shows orange banner in local development mode
- Only visible when using local Supabase (127.0.0.1)
- Helps distinguish between production and development

### CreateWishlistDialog

- Complete form for creating new wishlists
- Title and description inputs
- Feature toggles (links, price, priority)
- Loading state during creation
- Form validation and error handling

### PendingInvitationsSection

- Displays admin invitations awaiting acceptance
- Shows inviter information and wishlist details
- One-click invitation acceptance
- Only visible when invitations exist

### CreateWishlistButton

- Prominent call-to-action button
- Gradient styling for visual emphasis
- Opens the create wishlist dialog

### MyWishlistsSection

- Grid layout of user's owned wishlists
- Item count badges
- Creation date information
- Click to navigate to management view
- Empty state with encouragement to create first wishlist

### AdminWishlistsSection

- Grid layout of wishlists where user has admin access
- Shows owner information
- Different styling (blue theme) to distinguish from owned lists
- Click to navigate to admin view
- Only visible when admin wishlists exist

## Hook: useDashboard

Manages all dashboard state and operations:

- **Data Loading**: Fetches owned wishlists, admin wishlists, and pending invitations
- **Wishlist Creation**: Handles new wishlist form and creation process
- **Invitation Management**: Processes invitation acceptance
- **Authentication Integration**: Works with useAuth hook
- **State Management**: Centralized state for all dashboard data
- **Error Handling**: Comprehensive error handling with user feedback

## Service: DashboardService

Handles all API interactions:

- `getOwnedWishlists()`: Fetches user's created wishlists with item counts
- `getAdminWishlists()`: Fetches wishlists where user has admin access
- `getPendingInvitations()`: Retrieves pending admin invitations
- `createWishlist()`: Creates new wishlist with configuration
- `acceptInvitation()`: Processes invitation acceptance and creates admin relationship
- `signOut()`: Handles user sign out

## Key Features

1. **Comprehensive Dashboard**: Shows all user's wishlist-related data in one place
2. **Invitation System**: Seamless admin invitation acceptance workflow
3. **Wishlist Creation**: Full-featured wishlist creation with configuration options
4. **Multi-Role Support**: Distinguishes between owned and admin wishlists
5. **Responsive Design**: Works on desktop and mobile devices
6. **Loading States**: Proper loading indicators for all operations
7. **Error Handling**: User-friendly error messages and recovery
8. **Environment Awareness**: Visual indicator for development mode

## Data Flow

1. **Initial Load**: Hook fetches all dashboard data in parallel
2. **Wishlist Creation**: Form validation → API call → Optimistic update → Success feedback
3. **Invitation Acceptance**: Find invitation → Create admin relationship → Mark accepted → Reload data
4. **Navigation**: Click handlers route to appropriate management/admin views

## Usage

```tsx
import Dashboard from '@/Dashboard';

// Used as main dashboard (via Index.tsx)
<Route path="/" element={<Index />} />;
```

The component automatically handles:

- Authentication state checking
- Data loading and refreshing
- Form state management
- Navigation to sub-features

## Dependencies

- React Router for navigation
- react-i18next for internationalization
- Supabase for backend operations
- Sonner for toast notifications
- useAuth hook for authentication state
- Radix UI components for consistent styling

## Integration Points

- **Authentication**: Integrates with useAuth for user state
- **Navigation**: Routes to ManageWishlist and AdminWishlist features
- **Backend**: Complex database queries with relationships and counts
- **Internationalization**: Full i18n support for all text content

## Performance Considerations

- **Parallel Loading**: Fetches owned wishlists, admin wishlists, and invitations simultaneously
- **Optimistic Updates**: Updates UI immediately on wishlist creation
- **Efficient Queries**: Separate queries avoid complex joins that might fail
- **Count Aggregation**: Efficiently counts items for each wishlist
