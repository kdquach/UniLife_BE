# Banner Management - Class Specifications

## a. System Architecture Overview

The **Banner Management** module handles the complete banner lifecycle, including list view, detail view, create, update, delete, and reorder operations.

**Standard Processing Flow:**

```
Routes → Middleware → Controller → Service → Model → MongoDB
```

---

## b. Class Specifications

### BannerRoutes Class

| No  | Method        | Description |
| --- | ------------- | ----------- |
| 01  | GET /active   | Public endpoint to get active banners. Input: optional query param `canteenId`. Output: JSON `{ status: "success", results: number, data: { banners: Banner[] } }`. Processing: call `controller.getActiveBanners()`. |
| 02  | GET /         | Admin endpoint to get paginated banner list. Input: JWT + query params (`page`, `limit`, `search`, `isActive`, `canteenId`). Output: paginated JSON from `formatPaginatedResponse()`. Processing: `protect` + `restrictTo("admin")`, then call `controller.getAllBanners()`. |
| 03  | POST /        | Admin endpoint to create a new banner. Input: JWT + request body with banner fields. Output: HTTP 201 + JSON `{ status: "success", data: { banner: Banner } }`. Processing: call `controller.createBanner()`. |
| 04  | POST /reorder | Admin endpoint to update display order in bulk. Input: JWT + body `{ bannerOrders: { id, order }[] }`. Output: HTTP 200 + JSON `{ status: "success", data: { banners: Banner[] } }`. Processing: call `controller.reorderBanners()`. |
| 05  | GET /:id      | Admin endpoint to get banner detail by ID. Input: JWT + route param `id`. Output: HTTP 200 + JSON `{ status: "success", data: { banner: Banner } }`. Processing: call `controller.getBannerById()`. |
| 06  | PATCH /:id    | Admin endpoint to update banner by ID. Input: JWT + route param `id` + update payload. Output: HTTP 200 + JSON `{ status: "success", data: { banner: Banner } }`. Processing: call `controller.updateBanner()`. |
| 07  | DELETE /:id   | Admin endpoint to delete banner by ID. Input: JWT + route param `id`. Output: HTTP 204 + JSON `{ status: "success", data: null }`. Processing: call `controller.deleteBanner()`. |

---

### BannerController Class

| No  | Method                     | Description |
| --- | -------------------------- | ----------- |
| 01  | createBanner(req, res)     | Handles create request. Input: `req.body`, `req.user._id`. **Return type:** `Promise<void>` (writes HTTP response directly). Output response: HTTP 201 with created banner object. |
| 02  | getAllBanners(req, res)    | Handles admin list request. Input: `req.query`. **Return type:** `Promise<void>`. Output response: HTTP 200 with paginated result `{ success, message, data: Banner[], pagination }`. |
| 03  | getActiveBanners(req, res) | Handles public active-list request. Input: `req.query.canteenId`. **Return type:** `Promise<void>`. Output response: HTTP 200 with `{ status, results, data: { banners: Banner[] } }`. |
| 04  | getBannerById(req, res)    | Handles detail request. Input: `req.params.id`. **Return type:** `Promise<void>`. Output response: HTTP 200 with `{ data: { banner: Banner } }`. |
| 05  | updateBanner(req, res)     | Handles update request. Input: `req.params.id`, `req.body`. **Return type:** `Promise<void>`. Output response: HTTP 200 with `{ data: { banner: Banner } }`. |
| 06  | deleteBanner(req, res)     | Handles delete request. Input: `req.params.id`. **Return type:** `Promise<void>`. Output response: HTTP 204 with `data: null`. |
| 07  | reorderBanners(req, res)   | Handles reorder request. Input: `req.body.bannerOrders`. **Return type:** `Promise<void>`. Output response: HTTP 200 with `{ data: { banners: Banner[] } }`. |

---

### BannerService Class

| No  | Method                             | Description |
| --- | ---------------------------------- | ----------- |
| 01  | createBanner(bannerData, userId)   | Creates a new banner. Input: `bannerData`, `userId`. **Return type:** `Promise<Banner>`. Processing: validate payload, set `createdBy`, then call `Banner.create()`. |
| 02  | getAllBanners(query = {})          | Gets banner list with basic filters. Input: `query` (`canteenId`, `isActive`). **Return type:** `Promise<Banner[]>`. Processing: build filter + `find().populate().sort()`. |
| 03  | getActiveBanners(canteenId = null) | Gets currently active banners by effective time. Input: optional `canteenId`. **Return type:** `Promise<Banner[]>`. Processing: filter `isActive=true`, apply date-window logic, include global and canteen-scoped banners. |
| 04  | getBannerById(id)                  | Gets banner detail by ID. Input: `id`. **Return type:** `Promise<Banner>`. Processing: `findById().populate()`, throw `AppError(404)` if not found. |
| 05  | updateBanner(id, updateData)       | Updates banner by ID. Input: `id`, `updateData`. **Return type:** `Promise<Banner>`. Processing: validate payload, call `findByIdAndUpdate({ new:true, runValidators:true })`, throw `AppError(404)` if not found. |
| 06  | deleteBanner(id)                   | Deletes banner by ID. Input: `id`. **Return type:** `Promise<void>`. Processing: call `findByIdAndDelete()`, throw `AppError(404)` if not found. |
| 07  | reorderBanners(bannerOrders)       | Updates multiple banner orders. Input: `bannerOrders: Array<{id: string, order: number}>`. **Return type:** `Promise<Banner[]>`. Processing: build bulk ops, execute `bulkWrite()`, then return active banners after reorder. |
| 08  | validateBannerPayload(payload)     | Internal payload validator. Input: payload object. **Return type:** `Promise<void>`. Processing: validate date fields, enforce `startDate <= endDate`, and validate `canteenId` existence when provided. |

---

### BannerModel Class

| No  | Method                               | Description |
| --- | ------------------------------------ | ----------- |
| 01  | create(data)                         | Creates a new banner document. Input: data object. **Return type:** `Promise<BannerDocument>`. |
| 02  | find(filter)                         | Finds multiple banners. Input: filter object. **Return type:** `Promise<BannerDocument[]>`. |
| 03  | findById(id)                         | Finds one banner by ID. Input: `id`. **Return type:** `Promise<BannerDocument \| null>`. |
| 04  | findByIdAndUpdate(id, data, options) | Updates one banner by ID. Input: `id`, update data, options. **Return type:** `Promise<BannerDocument \| null>`. |
| 05  | findByIdAndDelete(id)                | Deletes one banner by ID. Input: `id`. **Return type:** `Promise<BannerDocument \| null>`. |
| 06  | bulkWrite(ops)                       | Executes bulk write operations for reorder. Input: bulk operations array. **Return type:** `Promise<BulkWriteResult>`. |
| 07  | countDocuments(filter)               | Counts banner documents by filter. Input: filter object. **Return type:** `Promise<number>`. |

---

### Banner Entity

| Field       | Type     | Description |
| ----------- | -------- | ----------- |
| `_id`       | ObjectId | MongoDB auto-generated ID |
| `canteenId` | ObjectId | Reference to `Canteen`, optional (global banner if null) |
| `title`     | String   | Banner title, required, max 200 |
| `imageUrl`  | String   | Banner image URL, required |
| `linkUrl`   | String   | Redirect URL, optional |
| `order`     | Number   | Display order, default 0 |
| `isActive`  | Boolean  | Active state, default true |
| `startDate` | Date     | Effective start datetime, optional |
| `endDate`   | Date     | Effective end datetime, optional |
| `createdBy` | ObjectId | Reference to `User` who created the banner |
| `createdAt` | Date     | Created timestamp (Mongoose timestamps) |
| `updatedAt` | Date     | Updated timestamp (Mongoose timestamps) |

**Indexes:**

- `{ canteenId: 1 }`
- `{ isActive: 1 }`
- `{ order: 1 }`

---

### CanteenModel Class

| No  | Method       | Description |
| --- | ------------ | ----------- |
| 01  | findById(id) | Finds canteen by ID for payload validation. **Return type:** `Promise<CanteenDocument \| null>`. |

---

### AuthMiddleware Class

| No  | Method                  | Description |
| --- | ----------------------- | ----------- |
| 01  | protect(req, res, next) | Validates JWT token. Input: Authorization header. **Return type:** `Promise<void>` (or `void` when calling `next`). Output: attaches `req.user` if valid. |
| 02  | restrictTo(...roles)    | Role-based authorization guard. Input: role list. **Return type:** `(req, res, next) => void`. Output: allows request flow or throws 403 error. |

---

### QueryHelper Utilities

| No  | Method                                      | Description |
| --- | ------------------------------------------- | ----------- |
| 01  | paginatedQuery(Model, queryParams, options) | Executes paginated query for admin list. **Return type:** `Promise<{ data: any[], pagination: { page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean } }>` |
| 02  | formatPaginatedResponse(result, message)    | Formats paginated API response. **Return type:** `{ success: boolean, message: string, data: any[], pagination: object }` |

---

### AppError Class

| No  | Method                           | Description |
| --- | -------------------------------- | ----------- |
| 01  | constructor(message, statusCode) | Creates a custom operational error object. **Return type:** `AppError` instance. |

---

## c. Business Rules & Validations

1. **Authorization**
   - `GET /api/banners/active` is public.
   - All banner management endpoints require `admin` role.

2. **Date Validation**
   - If both `startDate` and `endDate` are provided, both must be valid dates.
   - `startDate` must be less than or equal to `endDate`.

3. **Canteen Validation**
   - If `canteenId` is present in payload, that canteen must exist.

4. **Active Banner Rule**
   - Only banners with `isActive=true` and within effective date range are returned.
   - When `canteenId` is provided, result includes both global banners (`canteenId=null`) and canteen-specific banners.

5. **Not Found Rule**
   - `getBannerById`, `updateBanner`, and `deleteBanner` must throw 404 when the banner does not exist.

---

## d. Error Handling

- **400 Bad Request**: invalid date values, `startDate > endDate`, invalid/non-existing `canteenId`
- **401 Unauthorized**: missing or invalid token (for protected routes)
- **403 Forbidden**: user is not admin
- **404 Not Found**: banner does not exist

---

## e. Performance Considerations

- Indexes on `canteenId`, `isActive`, and `order` optimize banner queries.
- Admin list endpoint uses pagination to control payload size.
- Reorder operation uses `bulkWrite()` to reduce database round trips.

---

## f. Dependencies

- **express**: web framework
- **mongoose**: MongoDB ODM
- **catchAsync**: async error wrapper for controllers
- **AppError**: custom error class
- **queryHelper**: pagination and response formatting utilities
