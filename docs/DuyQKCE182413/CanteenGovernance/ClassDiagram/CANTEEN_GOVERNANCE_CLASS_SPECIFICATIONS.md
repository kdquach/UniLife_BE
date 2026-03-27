# Canteen Governance - Class Specifications

## a. System Architecture Overview

The **Canteen Governance** module in this scope includes 2 main admin features:

1. **View List Canteens**
2. **Review Registration**

**Standard Processing Flow:**

```
Routes → Middleware → Controller → Service → Model → MongoDB
```

---

## b. Class Specifications

### CanteenRoutes Class

| No  | Method            | Description                                                                                                                                                                                                                                                                                                                      |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | GET /             | Public endpoint to view canteen list. Input: optional query params `status`, `location`, `campusId`. Output: HTTP 200 + JSON `{ status: "success", results, data: { canteens: Canteen[] } }`. Processing: call `controller.getAllCanteens()`.                                                                                    |
| 02  | PATCH /:id/review | Admin endpoint to review canteen registration. Input: JWT + route param `id` + body `{ decision: "approve" \| "reject" }`. Output: HTTP 200 + JSON `{ status, message, data: { canteen, reviewedBy } }`. Processing: `protect` + `restrictTo("admin")` + `auditLogger(...)`, then call `controller.reviewCanteenRegistration()`. |

---

### CanteenController Class

| No  | Method                              | Description                                                                                                                                                                                                                                                         |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | getAllCanteens(req, res)            | Handles canteen list request. Input: `req.query`. **Return type:** `Promise<void>` (writes HTTP response directly). Output response: HTTP 200 + list of canteens.                                                                                                   |
| 02  | reviewCanteenRegistration(req, res) | Handles registration review request. Input: `req.params.id`, `req.body.decision`, `req.user._id`. **Return type:** `Promise<void>`. Processing: validate `decision` in controller, then call service. Output response: HTTP 200 + reviewed canteen and reviewer ID. |

---

### CanteenService Class

| No                                                                                                                                                                                           | Method                                              | Description                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01                                                                                                                                                                                           | getAllCanteens(query = {})                          | Gets canteen list with simple filtering. Input: `query` (`status`, `location`, `campusId`). **Return type:** `Promise<Canteen[]>`. Processing: build filter, execute `find().populate().sort()`. |
| 02                                                                                                                                                                                           | reviewCanteenRegistration(id, decision, reviewedBy) | Reviews a pending canteen registration. Input: canteen `id`, `decision`, admin user ID `reviewedBy`. **Return type:** `Promise<{ canteen, reviewedBy }>`.                                        |
| Processing: find canteen, validate `pending` state, map decision to status (`approve -> active`, `reject -> inactive`), save canteen, and if rejected update manager accounts to `inactive`. |

---

### CanteenModel Class

| No  | Method        | Description                                                                   |
| --- | ------------- | ----------------------------------------------------------------------------- |
| 01  | find(filter)  | Finds canteen list by filters. **Return type:** `Promise<CanteenDocument[]>`. |
| 02  | findById(id)  | Finds a canteen by ID. **Return type:** `Promise<CanteenDocument \| null>`.   |
| 03  | save(options) | Saves updated canteen document. **Return type:** `Promise<CanteenDocument>`.  |

---

### UserModel Class

| No  | Method                     | Description                                                                                               |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| 01  | updateMany(filter, update) | Updates manager accounts in bulk when registration is rejected. **Return type:** `Promise<UpdateResult>`. |

---

### AuthMiddleware Class

| No  | Method                  | Description                                                                                                 |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| 01  | protect(req, res, next) | Validates JWT token for protected routes. **Return type:** `Promise<void>` (or `void` when calling `next`). |
| 02  | restrictTo(...roles)    | Role-based authorization guard. **Return type:** `(req, res, next) => void`.                                |

---

### AuditLogMiddleware Class

| No  | Method                                   | Description                                                                      |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| 01  | auditLogger(action, module, description) | Writes audit log for review action. **Return type:** `(req, res, next) => void`. |

---

### AppError Class

| No  | Method                           | Description                                                                    |
| --- | -------------------------------- | ------------------------------------------------------------------------------ |
| 01  | constructor(message, statusCode) | Creates custom operational error object. **Return type:** `AppError` instance. |

---

### Canteen Entity

| Field         | Type     | Description                                          |
| ------------- | -------- | ---------------------------------------------------- |
| `_id`         | ObjectId | MongoDB auto-generated ID                            |
| `name`        | String   | Canteen name, required, max 100                      |
| `location`    | String   | Canteen location, required                           |
| `status`      | String   | Enum: `pending`, `active`, `inactive`, `maintenance` |
| `campusId`    | ObjectId | Reference to `Campus`, required                      |
| `offDates`    | String[] | List of off dates (`YYYY-MM-DD`)                     |
| `openingTime` | String   | Opening time (`HH:mm`)                               |
| `closingTime` | String   | Closing time (`HH:mm`)                               |
| `createdAt`   | Date     | Created timestamp                                    |
| `updatedAt`   | Date     | Updated timestamp                                    |

**Indexes:**

- `{ name: 1 }`
- `{ status: 1 }`
- `{ campusId: 1, status: 1 }`

---

## c. Business Rules & Validations

1. **Authorization**
   - `GET /api/canteens` is public.
   - `PATCH /api/canteens/:id/review` requires `admin` role.

2. **Decision Validation**
   - `decision` must be either `approve` or `reject`.

3. **Review State Validation**
   - Only canteens with `status = pending` can be reviewed.

4. **Status Mapping Rule**
   - `approve` → `active`
   - `reject` → `inactive`

5. **Reject Side Effect**
   - When a registration is rejected, manager accounts linked to that canteen are updated to `inactive`.

6. **Not Found Rule**
   - If canteen ID does not exist, return 404.

---

## d. Error Handling

- **400 Bad Request**: invalid `decision`, or review attempted on non-pending canteen
- **401 Unauthorized**: missing/invalid token for protected route
- **403 Forbidden**: user is not admin for review endpoint
- **404 Not Found**: canteen does not exist

---

## e. Performance Considerations

- List query uses indexes on `status` and `campusId`.
- `populate("campusId", "name code")` is limited to required fields.
- Manager status update on reject uses `updateMany()` for a single bulk operation.

---

## f. Dependencies

- **express**: web framework
- **mongoose**: MongoDB ODM
- **catchAsync**: async wrapper for controllers
- **AppError**: custom error class
- **auth.middleware**: authentication and role authorization
- **auditLog.middleware**: audit logging for governance actions
