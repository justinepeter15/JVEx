# Security Specification - EduVault

## Data Invariants
1. A user can only read their own private profile data (if any PII exists), but basic profile info might be public if we want community features. For now, users can only read/write their own `/users/{userId}`.
2. Only authenticated users can list resources.
3. Only users with `isPremium` true can access resources where `isPremium` is true.
4. Users cannot change their own `isPremium` status (this should be handled by a server-side process or admin, but for this demo where we might mock a "payment", we'll be careful).
5. Resources can ONLY be created/updated by admins (we'll define a list of admin UIDs or a check).

## The Dirty Dozen (Threat Vectors)
1. **Identity Spoofing**: User A attempts to update User B's profile.
2. **Premium Bypass**: User without subscription attempts to get the `fileUrl` of a premium resource.
3. **Admin Privilege Escalation**: User attempts to update their own `isPremium` to `true`.
4. **Illegal Resource Creation**: Non-admin user attempts to upload a new resource.
5. **Path Poisoning**: Injecting 1MB strings as document IDs.
6. **Shadow Update**: Adding a `hidden_admin: true` field to a resource.
7. **Timestamp Spoofing**: Setting `createdAt` to a future date manually.
8. **Resource Deletion**: Non-author/Non-admin attempting to delete a resource.
9. **Blanket List Read**: Authenticated user trying to skip filters and list ALL user private data.
10. **Type Mismatch**: Sending a string for `isPremium` (boolean).
11. **Orphaned Registration**: Creating a user profile without a valid UID.
12. **Denial of Wallet**: Bombarding the `resources` collection with millions of small read requests.

## Test Runner (Draft)
A `firestore.rules.test.ts` would verify these, but since I can't run a real test environment easily without more setup, I'll focus on the rules logic.
