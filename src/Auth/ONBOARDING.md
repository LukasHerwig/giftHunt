# Onboarding Feature

The onboarding feature ensures that new users complete their profile setup immediately after creating their account. This provides a better user experience and ensures that users have a name set when they interact with wishlists.

## How It Works

1. **After Account Creation**: When a user creates a new account, they are automatically redirected to the onboarding flow if their profile is incomplete.

2. **Name Collection**: The onboarding step prompts users to enter their full name, which is required for:

   - Claiming items on public wishlists (so wishlist owners know who's getting what)
   - General identification throughout the app

3. **Profile Update**: Once the user enters their name, their profile is updated in the `profiles` table.

4. **Completion**: After successful onboarding, users are redirected to the main application.

## Implementation

### Components

- **OnboardingStep**: The main onboarding UI component that collects the user's name
- **Auth/index.tsx**: Updated to include onboarding logic after authentication

### Hooks

- **useOnboarding**: Manages onboarding state and logic
  - `checkOnboardingStatus()`: Checks if user needs onboarding
  - `completeOnboarding(name)`: Updates user profile with name

### Services

- **OnboardingService**: Handles database operations for onboarding
  - `checkIfOnboardingNeeded(userId)`: Returns true if user has no `full_name` set
  - `completeOnboarding(userId, name)`: Updates the user's profile

## Database Schema

The onboarding system uses the existing `profiles` table:

```sql
-- profiles table already has:
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT, -- This is what onboarding sets
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Flow Logic

```
User signs up
      ↓
User is authenticated
      ↓
Check if profile.full_name exists
      ↓
If NO → Show OnboardingStep
      ↓
User enters name → Update profile
      ↓
Redirect to main app
```

## Translations

Onboarding text is fully internationalized:

- English (`en.json`): Complete onboarding translations
- Swedish (`sv.json`): Complete Swedish translations

## Usage

The onboarding flow is automatically triggered by the Auth component - no additional setup needed. Users will see the onboarding step immediately after account creation if they haven't set their name.

## Configuration

To modify onboarding behavior:

1. **Change the check logic**: Edit `OnboardingService.checkIfOnboardingNeeded()`
2. **Add more onboarding steps**: Extend the `OnboardingStep` component
3. **Customize the UI**: Modify the onboarding component styling and layout

## Future Enhancements

Potential improvements for the onboarding flow:

- Multi-step onboarding (profile picture, preferences, etc.)
- Skip option with reminder prompts
- Progress indicators for multi-step flows
- Welcome tutorial after onboarding
