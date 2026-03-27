# Business Rule Table (English)

| ID    | Business Rule                             | Business Rule Description                                                                                                                       |
| ----- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | JWT Required                              | The system must require a valid Bearer JWT for all protected APIs.                                                                              |
| BR-02 | Token Blacklist Enforcement               | The system must reject any blacklisted token after logout.                                                                                      |
| BR-03 | Token Version Revocation                  | The system must invalidate sessions when the JWT `tokenVersion` does not match the current user `tokenVersion`.                                 |
| BR-04 | Inactive/Banned Account Blocking          | The system must deny business access for users in `inactive` or `banned` status.                                                                |
| BR-05 | Pending Account Restricted Access         | The system must allow `pending` users to access only approved activation-related endpoints.                                                     |
| BR-06 | Role-Based Route Access                   | The system must enforce role-based route access using allowed roles per endpoint.                                                               |
| BR-07 | Permission-Based Feature Access           | The system must allow feature execution only when the user has at least one required permission code.                                           |
| BR-08 | Domain-Specific Role Restrictions         | The system must enforce module-level role restrictions (e.g., dashboard, notifications, vouchers, product management).                          |
| BR-09 | Admin-Only Governance Actions             | The system must restrict critical governance actions (e.g., role/permission administration) to authorized admin scope.                          |
| BR-10 | Audit Logging for Sensitive Actions       | The system must audit sensitive create/update/delete operations.                                                                                |
| BR-11 | Email Format and Uniqueness               | The system must validate email format and enforce uniqueness for user accounts.                                                                 |
| BR-12 | Phone Validation and Uniqueness           | The system must validate phone format and enforce uniqueness where applicable.                                                                  |
| BR-13 | Password Policy                           | The system must enforce minimum password length and require valid confirmation rules for password changes.                                      |
| BR-14 | OTP Structure and Expiration              | The system must issue 6-digit OTPs with a fixed expiration window.                                                                              |
| BR-15 | OTP Resend Cooldown                       | The system must enforce resend cooldown and request rate limiting for OTP operations.                                                           |
| BR-16 | Reset Token Validity                      | The system must accept password reset only with a valid and unexpired reset token.                                                              |
| BR-17 | Request Data Validation                   | The system must validate IDs, dates, query parameters, and filters; invalid input must return 4xx errors.                                       |
| BR-18 | Upload File Validation                    | The system must restrict uploads to allowed image MIME types and configured size/count limits.                                                  |
| BR-19 | Category Name Uniqueness per Canteen      | The system must enforce case-insensitive uniqueness of category names within the same canteen.                                                  |
| BR-20 | Cart/Wishlist Uniqueness Constraints      | The system must keep one cart per `(userId, canteenId)` and one wishlist per user without duplicate wishlist items.                             |
| BR-21 | Feedback Uniqueness                       | The system must allow only one feedback per `(userId, orderId, productId)` tuple.                                                               |
| BR-22 | Order/Payment Enum Integrity              | The system must enforce valid enum values for order and payment states/methods and non-negative monetary fields.                                |
| BR-23 | Non-Negative Inventory                    | The system must prevent negative inventory and restore inventory on failed deduction flows.                                                     |
| BR-24 | Soft-Deleted Product Exclusion            | The system must exclude soft-deleted products from default business views.                                                                      |
| BR-25 | Voucher Code Normalization and Uniqueness | The system must normalize voucher codes (uppercase) and enforce uniqueness.                                                                     |
| BR-26 | Concurrency Safety                        | The system must use atomic/optimistic updates for conflict-prone operations to prevent double processing.                                       |
| BR-27 | Local vs Social Authentication Separation | The system must block local password flows for social-auth-only accounts and apply provider-specific login rules.                               |
| BR-28 | OTP-Gated Completion Flows                | The system must complete registration/recovery flows only after successful OTP verification.                                                    |
| BR-29 | Reliable Session Cleanup on Logout        | The system must invalidate server session token and allow client-side session cleanup even when logout API fails.                               |
| BR-30 | Profile Update Whitelist                  | The system must update only approved profile fields and replace old avatar resources during avatar updates.                                     |
| BR-31 | Public Data Availability Rules            | The system must expose only active/available entities in public-facing listings.                                                                |
| BR-32 | Cart/Order/Reorder Availability Rules     | The system must validate product availability, menu-day applicability, canteen context, and current pricing for cart/order/reorder.             |
| BR-33 | Voucher Validation Chain                  | The system must validate voucher applicability (time/scope/quota/minimum conditions) before discount calculation.                               |
| BR-34 | Payment Callback Signature Verification   | The system must update online payment outcomes only after valid callback signature verification.                                                |
| BR-35 | Rating Eligibility and Ownership          | The system must allow rating only after completed purchase and restrict feedback edits/deletes to the owner.                                    |
| BR-36 | Scheduling and Shift Conflict Rules       | The system must prevent shift overlap, over-capacity assignment, and invalid past-time shift operations.                                        |
| BR-37 | State Machine Compliance                  | The system must enforce legal state transitions across core domains (order, payment, voucher, schedule, shift-change).                          |
| BR-38 | Time-Driven Automatic Transitions         | The system must support scheduled automatic transitions (e.g., expired orders, missing checkout, voucher state transitions, QR validity rules). |
| BR-39 | Personal Data Ownership                   | The system must allow users to access and modify only their own personal-domain records.                                                        |
| BR-40 | Canteen Scope Isolation                   | The system must isolate staff/manager operations to assigned canteen scope and block cross-canteen access.                                      |
