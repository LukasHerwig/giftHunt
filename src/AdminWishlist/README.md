# AdminWishlist Feature

This feature provides an admin view for managing wishlist items, viewing statistics, and managing share links.

## Structure

```
src/AdminWishlist/
├── index.tsx                     # Main AdminWishlist component
├── components/
│   ├── index.ts                  # Component exports
│   ├── LoadingState.tsx          # Loading spinner component
│   ├── AccessDeniedState.tsx     # Access denied message
│   ├── AdminWishlistHeader.tsx   # Header with navigation and share button
│   ├── ShareLinkInfo.tsx         # Share link display card
│   ├── SummaryStats.tsx          # Statistics overview card
│   ├── AvailableItemsCard.tsx    # Available items listing
│   ├── TakenItemsCard.tsx        # Taken items with untake functionality
│   └── UntakeItemDialog.tsx      # Confirmation dialog for untaking items
├── hooks/
│   └── useAdminWishlist.ts       # Main hook for admin wishlist state
├── services/
│   └── AdminWishlistService.ts   # API service for admin operations
└── types/
    └── index.ts                  # TypeScript interfaces
```

## Key Components

### AdminWishlistHeader

- Navigation back button
- Share link generation and copying functionality
- Consistent header layout with AppHeader and PageSubheader

### ShareLinkInfo

- Displays active share link when available
- Copy to clipboard functionality
- Styled with accent colors to highlight importance

### SummaryStats

- Overview of total, available, and taken items
- Grid layout with clear metrics
- Color-coded statistics (primary for available, accent for taken)

### AvailableItemsCard & TakenItemsCard

- Displays wishlist items with all relevant information
- Respects wishlist settings (enable_links, enable_price, enable_priority)
- TakenItemsCard includes untake functionality for admins
- Consistent styling with priority indicators and badges

### UntakeItemDialog

- Confirmation dialog for untaking items
- Shows item title and who took it
- Loading state during the operation

## Hook: useAdminWishlist

Manages all admin wishlist state and operations:

- **Access Control**: Verifies admin access to the wishlist
- **Data Loading**: Loads wishlist, items, and share link information
- **Share Link Management**: Generates and manages share links
- **Item Management**: Handles untaking items with optimistic updates
- **Dialog State**: Manages untake confirmation dialog state

## Service: AdminWishlistService

Handles all API interactions:

- `checkAdminAccess()`: Verifies user has admin access to wishlist
- `getWishlist()`: Fetches wishlist details
- `getWishlistItems()`: Fetches all items for the wishlist
- `getShareLink()`: Retrieves existing share link
- `createShareLink()`: Creates new share link or returns existing one
- `untakeItem()`: Marks item as not taken

## Key Features

1. **Admin Access Control**: Verifies user has admin privileges
2. **Statistics Overview**: Shows total, available, and taken items count
3. **Share Link Management**: Generate and copy share links
4. **Item Management**: View all items and untake taken items
5. **Responsive Design**: Works on desktop and mobile
6. **Loading States**: Proper loading indicators for all operations
7. **Error Handling**: Comprehensive error handling with user feedback

## Usage

```tsx
import AdminWishlist from '@/AdminWishlist';

// Used in routing
<Route path="/wishlist/:id/admin" element={<AdminWishlist />} />;
```

The component automatically handles URL parameter extraction and authentication checks.

## Dependencies

- React Router for navigation and URL parameters
- react-i18next for internationalization
- Supabase for backend operations
- Sonner for toast notifications
- Radix UI components for consistent styling
