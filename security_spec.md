# Security Specification & Threat Model for Trip Planner

## 1. Data Invariants

- **User Profile (`/users/{userId}`)**:
  - Only the authenticated owner whose `request.auth.uid == userId` can read or write their own profile.
  - No anonymous access or cross-user profile reading (PII protection: email, names).
  - The `id` in the document must match `request.auth.uid`.

- **User Trips (`/users/{userId}/trips/{tripId}`)**:
  - The parent `/users/{userId}` path must match the caller's `request.auth.uid`.
  - A trip document cannot be created with a mismatched `userId` (`incoming().userId == request.auth.uid`).
  - Document IDs must be valid alphanumeric strings (`isValidId(tripId)`).
  - Unauthenticated users cannot read, list, create, update, or delete trips.
  - Cross-user reading or listing is strictly blocked.
  - Critical invariants: `durationDays` must be a positive integer, title and destination must be non-empty strings within bounded lengths.

- **Contact Messages (`/contactMessages/{messageId}`)**:
  - Anyone can submit a contact message (`create`), but string bounds are enforced (name <= 100, email <= 256, message <= 4000).
  - No one can read, update, or delete contact messages from the client (write-only drop box).

---

## 2. The "Dirty Dozen" Payloads

These 12 malicious or malformed payloads must be rejected by Firestore Security Rules with `PERMISSION_DENIED`:

1. **Unauthenticated Profile Access**:
   Attempt to read `/users/user_victim_123` with `request.auth == null`.
2. **Cross-Tenant Profile Spoofing**:
   Authenticated user `attacker_456` attempts to overwrite `/users/user_victim_123`.
3. **Ghost / Shadow Field Injection in Profile**:
   Authenticated user attempts to inject an unauthorized administrative field `{ role: "admin", isSuperUser: true }`.
4. **Oversized String Buffer Overflow in Profile**:
   Attempt to write a 1MB junk string as `displayName`.
5. **ID Path Variable Poisoning**:
   Attempt to access `/users/user_123/trips/../../../etc/passwd` or an ID longer than 128 characters.
6. **Cross-Tenant Trip Scraping (Query Trust Test)**:
   Authenticated user `attacker_456` attempts to list documents from `/users/user_victim_123/trips`.
7. **Identity Hijack on Trip Creation**:
   Authenticated user `attacker_456` submits a trip into `/users/attacker_456/trips/trip_1` with payload `{ userId: "victim_789" }`.
8. **Negative / Invalid Duration Attack**:
   Attempt to save a trip with `durationDays: -5` or invalid types.
9. **Oversized Payload Denial-of-Wallet Attack**:
   Attempt to write an array of 5,000 artificial places or 500kb destination text.
10. **Unauthorized Contact Message Read**:
    Authenticated user attempts to read `/contactMessages/msg_secret`.
11. **Malicious Contact Message Update/Tamper**:
    Attempt to update or delete a submitted contact message.
12. **Tampering with Immutable Creation Timestamps**:
    Attempt to update an existing trip and change `createdAt` to a different value.
