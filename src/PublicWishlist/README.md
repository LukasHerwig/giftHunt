# PublicWishlist Feature

This feature handles the public-facing wishlist view accessible via share tokens, allowing external users to view and claim wishlist items.

## Structure

```
src/PublicWishlist/
├── components/
│   ├── LoadingState.tsx                # Loading state with spinner
│   ├── AccessDeniedState.tsx           # Access denied/invalid link state
│   ├── WishlistHeader.tsx              # Header with title, description, language switcher
│   ├── WishlistItemCard.tsx            # Individual item display with claim button
│   ├── ClaimItemDialog.tsx             # Dialog for claiming items
│   ├── EmptyWishlistState.tsx          # Empty state when no items exist
│   └── index.ts                        # Component exports
├── hooks/
│   └── usePublicWishlist.ts            # Main state management hook
├── services/
│   └── PublicWishlistService.ts        # Data operations service
├── types/
│   └── index.ts                        # TypeScript interfaces
├── index.tsx                           # Main PublicWishlist component
└── README.md                           # This file
```

## Components

### LoadingState

- Displays loading spinner and message
- Used while fetching wishlist data

### AccessDeniedState

- Shows when share token is invalid/expired or missing
- Provides appropriate error messaging

### WishlistHeader

- Displays wishlist title and description
- Includes language switcher
- Branded header with gradient background

### WishlistItemCard

- Individual item display with all properties
- Shows priority badges, price, links when enabled
- Includes claim button for available items
- Responsive design with proper text wrapping

### ClaimItemDialog

- Modal dialog for claiming items
- Form validation with required name field
- Loading states during claim process

### EmptyWishlistState

- Shown when wishlist has no items
- Clean empty state messaging

## Services

### PublicWishlistService

- `loadWishlistByToken(token: string)`: Validates share token and loads wishlist data
- `claimItem({ itemId, buyerName })`: Claims an item for a buyer
- Handles all Supabase interactions with proper error handling

## Hooks

### usePublicWishlist

- Manages all component state: wishlist, items, loading, dialogs
- Provides methods: `loadWishlistByToken`, `claimItem`, `openClaimDialog`, etc.
- Handles local state updates after successful operations
- Integrates with toast notifications for user feedback

## Types

### WishlistItem

- Item data structure with all display properties
- Includes taken status and priority information

### Wishlist

- Wishlist configuration including feature toggles
- Determines which item properties to display

### ShareLink

- Share token validation data
- Includes expiration handling

### PublicWishlistState

- Complete hook state management interface
- Covers all UI state and loading states

## Features

### Share Token Validation

- Validates share tokens against database
- Handles expired links gracefully
- Provides appropriate error messaging

### Item Claiming

- Allows external users to claim items
- Requires buyer name for tracking
- Updates local state immediately
- Prevents double-claiming with optimistic updates

### Responsive Design

- Mobile-friendly layout
- Proper text wrapping for long content
- Touch-friendly buttons and interactions

### Feature Toggles

- Respects wishlist settings for links, prices, priorities
- Conditionally shows/hides item properties
- Maintains consistency with wishlist configuration

### Internationalization

- All text is internationalized using react-i18next
- Supports multiple languages via language switcher
- Consistent with rest of application

## Usage

```tsx
import { PublicWishlist } from '@/PublicWishlist';

// In your router
<Route path="/shared/:token" element={<PublicWishlist />} />;
```

## Dependencies

- React (hooks, components)
- React Router (URL parameters)
- Supabase (database operations)
- react-i18next (internationalization)
- UI components (Card, Button, Dialog, etc.)
- Sonner (toast notifications)
- Lucide React (icons)
