# Agent_xk Firebase Security Specification

## 1. Data Invariants
- An `Experience` must have a valid type.
- A `Project` is owned by a single user.
- Users can only read/write their own projects.
- `Experiences` are globally readable for authenticated users (to allow cross-project learning) but can only be modified by the system or creator under strict conditions.

## 2. The Dirty Dozen Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attempt to create a project with another user's `ownerId`.
2. **Resource Poisoning**: Inject a 1MB string into an `experienceId`.
3. **State Shortcutting**: Update a project status directly to `completed` without required intermediate steps (if applicable).
4. **PII Leak**: An unauthenticated user attempts to list the `/users` collection.
5. **Ghost Field**: Adding `isAdmin: true` to a user profile payload.
6. **Overwrite Attack**: User A attempts to delete User B's project.
7. **Timestamp Fraud**: Sending a client-side `createdAt` that doesn't match `request.time`.
8. **Invalid Enum**: Creating an experience with type `Magic_Spell`.
9. **Orphaned Write**: Creating a project task without a valid project ID (if tasks were a separate root collection).
10. **Query Scraper**: Attempting `db.collection('projects').get()` without a `where` clause for `ownerId`.
11. **Shadow Update**: Updating a project and trying to change the `ownerId`.
12. **Malicious Experience**: Creating a 1MB content string in an experience to bloat memory.

## 3. Test Runner Blueprint
I will use `firestore.rules.test.ts` to verify these in the next turn.
