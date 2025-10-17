# Feature-Based Architecture

This project uses a **feature-based (co-location) architecture** where related functionality is organized by feature rather than by technical concern.

## 📁 Project Structure

```
src/
├── components/          # Shared/global UI components
├── contexts/           # React contexts
├── hooks/              # Shared custom hooks
├── integrations/       # External service integrations
├── lib/                # Utility libraries
├── locales/            # Internationalization files
├── pages/              # Simple page components
│   ├── Index.tsx
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Profile.tsx
│   └── ...
├── ManageWishlist/     # 🎯 Feature: Manage Wishlist
│   ├── index.tsx       # Main component
│   ├── types.ts        # Feature-specific types
│   ├── components/     # Feature components
│   ├── hooks/          # Feature hooks
│   └── services/       # Feature services
├── AcceptInvitation/   # 🎯 Feature: Accept Invitation
│   ├── index.tsx       # Main component
│   ├── types.ts        # Feature-specific types
│   ├── components/     # Feature components
│   ├── hooks/          # Feature hooks
│   └── services/       # Feature services
└── App.tsx             # Main app component
```

## 🎯 Feature Organization

Each feature follows this consistent structure:

### Feature Root

- `index.tsx` - Main component exported as default
- `types.ts` - All TypeScript interfaces and types
- `README.md` - Feature documentation (optional)

### `/components/`

- UI components specific to this feature
- Dialog components, display components, etc.
- `index.ts` - Clean exports for easy importing

### `/hooks/`

- Custom React hooks for state management
- Business logic and side effects
- `index.ts` - Hook exports

### `/services/`

- Data layer and API interactions
- Supabase operations, external API calls
- Static service classes
- `index.ts` - Service exports

## ✅ Benefits

### 🎯 **Co-location**

- All related code is grouped together
- Easy to find and modify feature-specific code
- Clear feature boundaries

### 📦 **Scalability**

- Easy to add new features
- Features can be moved or extracted easily
- Parallel development on different features

### 🧪 **Testability**

- Each feature can be tested independently
- Clear separation of concerns
- Mock dependencies easily

### 🔄 **Maintainability**

- Smaller, focused components
- Clear responsibilities
- Easy to understand and modify

## 🚀 Usage Examples

### Importing Features

```tsx
// In App.tsx or router
import ManageWishlist from './ManageWishlist';
import AcceptInvitation from './AcceptInvitation';

<Route path="/wishlist/:id/manage" element={<ManageWishlist />} />
<Route path="/accept-invitation" element={<AcceptInvitation />} />
```

### Feature Components

```tsx
// Clean imports within features
import { useManageWishlist } from './hooks';
import { AddItemDialog, SettingsDialog } from './components';
import { ManageWishlistService } from './services';
```

## 🆚 Traditional vs Feature-Based

### Traditional Structure (by type)

```
src/
├── components/
│   ├── AddItemDialog.tsx
│   ├── EditItemDialog.tsx
│   ├── SettingsDialog.tsx
│   └── WishlistItems.tsx
├── hooks/
│   ├── useManageWishlist.ts
│   └── useAcceptInvitation.ts
├── services/
│   ├── ManageWishlistService.ts
│   └── AcceptInvitationService.ts
└── pages/
    ├── ManageWishlist.tsx
    └── AcceptInvitation.tsx
```

### Feature-Based Structure (by feature) ✅

```
src/
├── ManageWishlist/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── index.tsx
└── AcceptInvitation/
    ├── components/
    ├── hooks/
    ├── services/
    └── index.tsx
```

## 🔧 When to Use Each Approach

### Feature-Based (Recommended for)

- ✅ Complex features with multiple components
- ✅ Features with unique business logic
- ✅ Features that may be extracted or moved
- ✅ Large applications with multiple developers

### Traditional (Still good for)

- ✅ Simple, single-component pages
- ✅ Shared/global components
- ✅ Utility functions and helpers
- ✅ Small projects

## 📋 Migration Strategy

When converting a large component to feature-based:

1. **Create feature directory** with proper structure
2. **Extract types** to `types.ts`
3. **Break down UI** into focused components
4. **Extract business logic** to custom hooks
5. **Move data operations** to service classes
6. **Create clean exports** with index files
7. **Update imports** in router/parent components
8. **Remove old monolithic files**

This approach scales well and makes the codebase much more maintainable!
