# Firebase Architecture: Tigoo MVP

## 1. Collections & Fields

### `users` (Collection)
Stores parent account information linked to Firebase Auth.
*   **Document ID**: `auth.uid`
*   **Fields**:
    *   `email` (string): Parent's email address.
    *   `displayName` (string): Parent's name (from Google Auth).
    *   "authProvider" (string): 'google_only' (Strict enforcement).
    *   `createdAt` (timestamp): Account creation time.
    *   `trialStartAt` (timestamp): Start of trial period.
    *   `trialEndsAt` (timestamp): End of trial period.
    *   `subscriptionStatus` (string): 'trial', 'active', 'expired' (default: 'trial').

### `users/{userId}/profiles` (Sub-collection)
Stores child profiles managed by the parent.
*   **Document ID**: Auto-generated User ID (UUID or Firestore Auto-ID).
*   **Fields**:
    *   `name` (string): Child's display name.
    *   `age` (number): Child's age (4-8).
    *   `avatarId` (string): Identifier for local asset or URL (e.g., "tiger_1").
    *   `createdAt` (timestamp).

### `users/{userId}/profiles/{profileId}/progress` (Sub-collection)
Tracks activity completion for a specific child.
*   **Document ID**: `activityId` (Matches the ID in `activities` collection).
*   **Fields**:
    *   `status` (string): 'completed'.
    *   `score` (number): Optional, for future use.
    *   `completedAt` (timestamp): When the activity was finished.

### `activities` (Collection)
Static content library for games and videos.
*   **Document ID**: specific-slug (e.g., `math-counting-1`) or Auto-ID.
*   **Fields**:
    *   `title` (string): Display title.
    *   `description` (string): Short text for parents/kids.
    *   `thumbnailUrl` (string): Cloud storage URL for cover image.
    *   `mediaUrl` (string): Cloud storage URL for video or game bundle.
    *   `type` (string): 'video' | 'game'.
    *   `category` (string): 'math', 'reading', 'logic'.
    *   `ageTags` (array of number): e.g., `[4, 5]` matches children of age 4 or 5.
    *   `isPremium` (boolean): If true, requires active subscription.

---

## 2. Query Patterns

### Authentication
*   **Observer**: Listen to `onAuthStateChanged`.
*   **Logic**:
    *   If User is NULL -> Redirect to Welcome.
    *   If User Exists -> Check `subscriptionStatus` in `users` collection.
        *   If 'expired' -> Redirect to Paywall/Settings (HARD BLOCK).
        *   Else -> Proceed to Profile Select.

### Profile Management
*   **Fetch Profiles**:
    ```javascript
    db.collection('users').doc(auth.uid).collection('profiles').get()
    ```

### Home Screen (Activity Feed)
*   **Fetch Relevant Activities**:
    Query activities targeting the child's specific age.
    ```javascript
    db.collection('activities')
      .where('ageTags', 'array-contains', currentProfile.age)
      .limit(20)
    ```

### Activity Detail / Completion
*   **Mark Complete**:
    ```javascript
    db.collection('users').doc(auth.uid)
      .collection('profiles').doc(currentProfile.id)
      .collection('progress').doc(activity.id)
      .set({
        status: 'completed',
        completedAt: serverTimestamp()
      })
    ```
*   **Check History (Optional for MVP visual cues)**:
    Fetch the `progress` sub-collection IDs to show "Done" checkmarks on the Home screen.

---

## 3. Environment Variables Needed (Expo)

Required in `.env` (and exposed via `app.config.ts` or `FiebaseConfig.ts`).

*   `EXPO_PUBLIC_FIREBASE_API_KEY`
*   `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
*   `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `EXPO_PUBLIC_FIREBASE_APP_ID`
*   `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (For Google Sign-In config)
*   `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (If using native Google Sign-In)
*   `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (If using native Google Sign-In)

---

## 4. Security Rules Outline

**Plan**: Default deny all. Open explicit paths for owner-only access. Public read for content.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Users: Owner can read/write their own record
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      // Profiles: Owner (Parent) manages sub-profiles
      match /profiles/{profileId} {
        allow read, write: if isOwner(userId);
        
        // Progress: Owner (Parent/App acting as child) writes progress
        match /progress/{activityId} {
          allow read, write: if isOwner(userId);
        }
      }
    }

    // Activities: Public read, Admin write (locked down for MVP)
    match /activities/{activityId} {
      allow read: if true; // Or restriction: if request.auth != null
      allow write: if false; // Admin SDK only
    }
  }
}
```

---

## 5. Tasks for Orchestrator

**Setup & Configuration**
1.  [ ] Create Firebase Project "Tigoo-MVP".
2.  [ ] Enable **Authentication** (Google Provider).
3.  [ ] Enable **Firestore Database** (Start in Test Mode, then apply rules).
4.  [ ] Enable **Storage** (for activity assets).
5.  [ ] Create `firebaseConfig.ts` and initialize Firebase App instance.
6.  [ ] Configure `google-signin` plugin for Expo (configure scheme and detailed build props).

**Database & Seeding**
7.  [ ] Write a script (or manual entry) to seed `activities` collection with 5-10 placeholder items (mix of ages 4-8).
8.  [ ] (Optional) Create a 'god-mode' user or admin script to easily upload assets.

**Integration (Frontend)**
9.  [ ] Implement `AuthService`: LoginWithGoogle(), Logout().
10. [ ] Implement `UserService`: createUserDoc(), createProfile(), getProfiles().
11. [ ] Implement `ContentService`: getActivities(age).
12. [ ] Implement `ProgressService`: saveProgress(activityId).

**Indexes**
13. [ ] Create index for `activities` collection: `ageTags` (Arrays) for efficient querying.
