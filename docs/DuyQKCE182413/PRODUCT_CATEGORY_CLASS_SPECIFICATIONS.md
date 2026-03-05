# Product Category Management - Class Specifications

## a. System Architecture Overview

The **Product Category Management** module manages product categories in the system, allowing creation, viewing, updating, and deletion of product categories. This module is separated by canteen and uses permission-based authorization to ensure each canteen can independently manage its own product categories with detailed permissions.

**Standard Processing Flow:**

```
Routes → Middleware (protect + requirePermission) → Controller → Service → Model → MongoDB
```

---

## b. Class Specifications

### ProductCategoryRoutes Class

| No  | Method      | Description                                                                                                                                                                                                                                                 |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | GET /       | Route to get list of all product categories with pagination. Input: query params (page, limit, search), JWT token. Output: paginated list. Processing: Require PRODUCT_READ or PRODUCT_CATEGORY_READ permission, call controller.getAllProductCategories()  |
| 02  | GET /active | Route to get list of active categories. Input: JWT token. Output: active categories array. Processing: Require PRODUCT_READ or PRODUCT_CATEGORY_READ permission, call controller.getActiveProductCategories()                                               |
| 03  | GET /:id    | Route to get details of a product category by ID. Input: id param, JWT token. Output: category object. Processing: Require PRODUCT_READ or PRODUCT_CATEGORY_READ permission, call controller.getProductCategoryById()                                       |
| 04  | POST /      | Route to create new product category (Protected). Input: JWT token, category data (name, description, icon). Output: new category object. Processing: Require PRODUCT_CREATE or PRODUCT_CATEGORY_CREATE permission, call controller.createProductCategory() |
| 05  | PATCH /:id  | Route to update product category (Protected). Input: JWT token, id param, update data. Output: updated category object. Processing: Require PRODUCT_UPDATE or PRODUCT_CATEGORY_UPDATE permission, call controller.updateProductCategory()                   |
| 06  | DELETE /:id | Route to delete product category (Restricted). Input: JWT token, id param. Output: success message. Processing: Require PRODUCT_DELETE or PRODUCT_CATEGORY_DELETE permission, call controller.deleteProductCategory()                                       |

---

### ProductCategoryController Class

| No  | Method                               | Description                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | createProductCategory(req, res)      | Handle request to create new product category. Input: req.body (name, description, icon), req.user.canteenId. Output: HTTP 201 with category data. Processing: Validate canteenId exists, throw 400 if missing canteenId, call service.createProductCategory(), format response with message "Tạo danh mục sản phẩm thành công"    |
| 02  | getAllProductCategories(req, res)    | Handle request to get list of categories with pagination. Input: req.query (page, limit, search), req.user.canteenId. Output: HTTP 200 with paginated data. Processing: Extract query params and canteenId, call service.getAllProductCategories(), use formatPaginatedResponse() with message "Lấy danh sách sản phẩm thành công" |
| 03  | getActiveProductCategories(req, res) | Handle request to get list of active categories. Input: req.user.canteenId. Output: HTTP 200 with categories array. Processing: Extract canteenId, call service.getActiveProductCategories(), format response with status "success", results count and data                                                                        |
| 04  | getProductCategoryById(req, res)     | Handle request to get category details. Input: req.params.id, req.user.canteenId. Output: HTTP 200 with category data. Processing: Extract id and canteenId, call service.getProductCategoryById(), format response with message "Lấy chi tiết danh mục sản phẩm thành công"                                                       |
| 05  | updateProductCategory(req, res)      | Handle request to update category. Input: req.params.id, req.body (update data), req.user.canteenId. Output: HTTP 200 with updated category. Processing: Extract all params, call service.updateProductCategory(), format response with message "Cập nhật danh mục sản phẩm thành công"                                            |
| 06  | deleteProductCategory(req, res)      | Handle request to delete category. Input: req.params.id, req.user.canteenId. Output: HTTP 200 with success message. Processing: Extract id and canteenId, call service.deleteProductCategory(), format response with message "Xóa danh mục sản phẩm thành công" and data: null                                                     |

---

### ProductCategoryService Class

| No  | Method                                           | Description                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | createProductCategory(data)                      | Tạo mới product category với validation. Input: data object {name, description, icon, canteenId}. Output: category object. Processing: Kiểm tra duplicate name trong canteen với regex case-insensitive, throw AppError("Danh mục sản phẩm [name] đã tồn tại trong canteen này", 400) nếu duplicate, gọi Model.create(), return result                                       |
| 02  | getAllProductCategories(queryParams, canteenId)  | Lấy danh sách categories với phân trang và filter theo canteen. Input: queryParams {page, limit, search}, canteenId. Output: {data: [], pagination: {}}. Processing: Build options với baseFilter {canteenId} nếu có canteenId, gọi paginatedQuery(ProductCategory, queryParams, options)                                                                                    |
| 03  | getProductCategoryById(id, canteenId)            | Lấy chi tiết category với validation canteen. Input: id, canteenId. Output: category object. Processing: Build filter {\_id: id}, thêm canteenId vào filter nếu có, gọi Model.findOne(filter), throw AppError("Product category not found", 404) nếu không tìm thấy                                                                                                          |
| 04  | updateProductCategory(id, updateData, canteenId) | Cập nhật category với validation. Input: id, updateData, canteenId. Output: updated category. Processing: Build filter {\_id: id, canteenId}, find current category, throw 404 nếu không tìm thấy, check duplicate name nếu updateData.name thay đổi (exclude chính nó với $ne), throw 400 nếu duplicate, gọi Model.findByIdAndUpdate() với {new: true, runValidators: true} |
| 05  | deleteProductCategory(id, canteenId)             | Xóa category. Input: id, canteenId. Output: deleted category. Processing: Build filter {\_id: id}, thêm canteenId nếu có, gọi Model.findOneAndDelete(filter), throw AppError("Product category not found", 404) nếu không tìm thấy                                                                                                                                           |
| 06  | getActiveProductCategories(canteenId)            | Lấy danh sách categories active. Input: canteenId. Output: categories array sorted by name. Processing: Build filter {isActive: true}, thêm canteenId nếu có, gọi Model.find(filter).sort({name: 1})                                                                                                                                                                         |

---

### ProductCategoryModel Class

| No  | Method                               | Description                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | create(data)                         | Create new document in collection. Input: category data object. Output: Promise<ProductCategory>. Processing: Validate according to schema, insert into MongoDB collection productcategories, return created document                                                                                         |
| 02  | find(filter)                         | Find multiple documents. Input: filter object. Output: Promise<Array<ProductCategory>>. Processing: Query MongoDB with filter, can chain with sort(), return array of documents                                                                                                                               |
| 03  | findOne(filter)                      | Find one document. Input: filter object. Output: Promise<ProductCategory or null>. Processing: Query MongoDB with filter, return first matching document or null if not found                                                                                                                                 |
| 04  | findById(id)                         | Find document by ID. Input: id string or ObjectId. Output: Promise<ProductCategory or null>. Processing: Query MongoDB with \_id, return document or null                                                                                                                                                     |
| 05  | findByIdAndUpdate(id, data, options) | Find and update document. Input: id, update data, options {new: true, runValidators: true}. Output: Promise<ProductCategory or null>. Processing: Find document by id, validate update data according to schema if runValidators: true, update document, return updated document if new: true or old document |
| 06  | findOneAndDelete(filter)             | Find and delete document. Input: filter object. Output: Promise<ProductCategory or null>. Processing: Find and delete document from MongoDB by filter, return deleted document or null                                                                                                                        |
| 07  | countDocuments(filter)               | Count documents. Input: filter object. Output: Promise<Number>. Processing: Count documents matching filter in MongoDB collection                                                                                                                                                                             |

---

### ProductCategory Entity

| Field       | Type     | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| \_id        | ObjectId | MongoDB auto-generated ID                                |
| canteenId   | ObjectId | Reference to Canteen (required, indexed)                 |
| name        | String   | Product category name (required, max 100 chars, trimmed) |
| description | String   | Category description (optional, max 500 chars, trimmed)  |
| icon        | String   | Icon/image URL (optional, trimmed)                       |
| isActive    | Boolean  | Active status (default: true)                            |
| createdAt   | Date     | Creation timestamp (auto generated)                      |
| updatedAt   | Date     | Update timestamp (auto generated)                        |

**Indexes:**

- `{canteenId: 1, name: 1}` - Unique compound index, ensures no duplicate name within same canteen
- `{canteenId: 1, isActive: 1}` - Compound index for efficient querying of active categories by canteen
- `{isActive: 1}` - Single field index for querying all active categories

**Validation Rules:**

- name: required, cannot be empty after trim, max 100 characters
- description: optional, max 500 characters if provided
- canteenId: required, must be a valid ObjectId reference to Canteen collection
- isActive: defaults to true if not specified

---

### AuthMiddleware Class

| No  | Method                            | Description                                                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | protect(req, res, next)           | Middleware for JWT token authentication. Input: JWT token in Authorization header (Bearer token). Output: req.user with decoded data {userId, canteenId, role, permissions}. Processing: Extract token from header, verify with JWT_SECRET, decode user info, attach to req.user, call next() if success or throw 401 Unauthorized if token invalid/expired |
| 02  | requirePermission(...permissions) | Middleware for permission-based authorization. Input: permissions array (e.g., ['PRODUCT_READ', 'PRODUCT_CATEGORY_READ']). Output: Function middleware. Processing: Check if req.user.permissions contains at least one of the required permissions, allow continuation if authorized or throw 403 Forbidden if not authorized                              |

---

### AppError Class

| No  | Method                           | Description                                                                                                                                                                                                                                                                      |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | constructor(message, statusCode) | Create custom error object. Input: message string, statusCode number. Output: AppError instance. Processing: Set message, statusCode, status (computed from statusCode: 'fail' if 4xx, 'error' if 5xx), isOperational = true, capture stack trace with Error.captureStackTrace() |

---

### QueryHelper Utilities

| No  | Method                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | paginatedQuery(Model, queryParams, options) | Execute paginated query. Input: Mongoose Model, queryParams {page, limit, search, sort, ...otherFilters}, options {baseFilter, populate, select}. Output: Promise<{data: [], pagination: {page, limit, totalPages, totalItems}}>. Processing: Parse page/limit defaults (page=1, limit=10), build search filter if search text exists, merge with baseFilter and otherFilters, execute query with skip((page-1)\*limit).limit(limit), apply populate and select if provided, count total documents, calculate totalPages, return formatted result |
| 02  | formatPaginatedResponse(result, message)    | Format response for paginated data. Input: result object {data, pagination}, success message string. Output: {success: true, message: string, data: [], pagination: {}}. Processing: Wrap result in standard API response format with success flag and custom message                                                                                                                                                                                                                                                                             |

---

### CatchAsync Utility

| No  | Method         | Description                                                                                                                                                                                                                                                                  |
| --- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | catchAsync(fn) | Wrapper function to catch async errors. Input: async function (req, res, next). Output: Express middleware function. Processing: Return function that wraps async fn in Promise, catch errors and forward to next(error) for centralized error handler middleware to process |

---

## c. Business Rules & Validations

1. **Unique Name per Canteen**: Product category name must be unique within the same canteen (case-insensitive check with regex)
2. **Canteen Association**: Every product category must be assigned to a canteen. User must have canteenId in token
3. **Permission-Based Authorization**:
   - READ routes require PRODUCT_READ or PRODUCT_CATEGORY_READ permission
   - CREATE routes require PRODUCT_CREATE or PRODUCT_CATEGORY_CREATE permission
   - UPDATE routes require PRODUCT_UPDATE or PRODUCT_CATEGORY_UPDATE permission
   - DELETE routes require PRODUCT_DELETE or PRODUCT_CATEGORY_DELETE permission
4. **Data Isolation**: Users can only see and operate on categories of their assigned canteen
5. **Soft Delete**: Use isActive flag instead of hard delete (physical delete is still available but only used when necessary)
6. **Name Validation**: Name cannot be duplicate (case-insensitive), cannot be empty, max 100 characters
7. **Update Validation**: When updating name, must check for duplicates but exclude the document being updated

---

## d. Error Handling

- **400 Bad Request**:
  - Duplicate name: "Danh mục sản phẩm [name] đã tồn tại trong canteen này"
  - Missing canteenId: "User không được gán vào canteen nào"
  - Validation errors: Schema validation messages
- **401 Unauthorized**: Invalid, expired, or missing token
- **403 Forbidden**:
  - Does not have required permission to perform action
  - Message: "You do not have permission to perform this action"
- **404 Not Found**:
  - "Product category not found" - Category does not exist or does not belong to user's canteen
- **500 Internal Server Error**: Server error, database connection, or unexpected errors

---

## e. Performance Considerations

1. **Database Indexes**:
   - Compound index {canteenId: 1, name: 1} helps with fast queries and unique checks
   - Index {canteenId: 1, isActive: 1} optimizes filtering of active categories by canteen
   - Single index {isActive: 1} for global active queries
2. **Pagination**: Limits the number of records returned per request, default 10 items/page
3. **Lean Queries**: Can use .lean() for read-only queries to increase performance
4. **Query Optimization**:
   - Only select necessary fields
   - Avoid N+1 queries with proper population
   - Cache active categories if they change infrequently
5. **Connection Pooling**: MongoDB connection pool size appropriate for the load

---

## f. Security Considerations

1. **Input Sanitization**: Trim input strings, validate lengths
2. **NoSQL Injection Prevention**: Mongoose schema validation automatically escapes
3. **JWT Verification**: Token must be valid and not expired
4. **Permission Checking**: All protected routes check permissions
5. **Data Isolation**: Filter by canteenId ensures users cannot access cross-canteen data
6. **Rate Limiting**: Should implement to prevent abuse (if not already at API level)

---

## g. Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM, version >= 6.0
- **jsonwebtoken**: Authentication (in middleware)
- **catchAsync**: Error handling utility (custom)
- **AppError**: Custom error class (custom)
- **queryHelper**: Pagination utilities (custom)
- **authMiddleware**: protect and requirePermission (custom)

---

## h. API Response Format

**Success Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách sản phẩm thành công",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Product category not found",
  "statusCode": 404
}
```

---

## i. Testing Considerations

1. **Unit Tests**: Test each service method with mocked Model
2. **Integration Tests**: Test routes with real database (test DB)
3. **Test Cases**:
   - Create category with valid data
   - Create with duplicate name in same canteen
   - Create with duplicate name in different canteen (should success)
   - Update name to existing name (should fail)
   - Get categories of different canteen (should return empty)
   - Delete non-existent category
   - Pagination with different page sizes
4. **Permission Tests**: Test each route with missing/invalid permissions

---

## j. Migration Notes

- If there are old categories without canteenId, a migration script is needed to assign them to a default canteen
- Script: `migrateCategoriesToCanteen.js` already available in codebase
