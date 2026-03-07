# Ingredient Category Management - Class Specifications

## a. System Architecture Overview

The **Ingredient Category Management** module manages ingredient groups in the system, allowing creation, viewing, updating, and deletion of ingredient categories. This module is separated by canteen to ensure each canteen can independently manage its own ingredient groups.

**Standard Processing Flow:**

```
Routes → Middleware → Controller → Service → Model → MongoDB
```

---

## b. Class Specifications

### IngredientCategoryRoutes Class

| No  | Method      | Description                                                                                                                                                                                                                 |
| --- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | GET /       | Route to get list of all ingredient categories with pagination. Input: query params (page, limit, search). Output: paginated list. Processing: Call controller.getAllIngredientCategories()                                 |
| 02  | GET /active | Route to get list of active categories. Input: none. Output: active categories array. Processing: Call controller.getActiveIngredientCategories()                                                                           |
| 03  | GET /:id    | Route to get details of an ingredient category by ID. Input: id param. Output: category object. Processing: Call controller.getIngredientCategoryById()                                                                     |
| 04  | POST /      | Route to create new ingredient category (Protected). Input: JWT token, category data (name, description, icon). Output: new category object. Processing: Use protect middleware, call controller.createIngredientCategory() |
| 05  | PATCH /:id  | Route to update ingredient category (Protected). Input: JWT token, id param, update data. Output: updated category object. Processing: Use protect middleware, call controller.updateIngredientCategory()                   |
| 06  | DELETE /:id | Route to delete ingredient category (Admin only). Input: JWT token, id param. Output: success message. Processing: Use protect + restrictTo('admin') middleware, call controller.deleteIngredientCategory()                 |

---

### IngredientCategoryController Class

| No  | Method                                  | Description                                                                                                                                                                                                                                                            |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | createIngredientCategory(req, res)      | Handle request to create new ingredient category. Input: req.body (name, description, icon), req.user.canteenId. Output: HTTP 201 with category data. Processing: Validate canteenId exists, call service.createIngredientCategory(), format response                  |
| 02  | getAllIngredientCategories(req, res)    | Handle request to get list of categories with pagination. Input: req.query (page, limit, search), req.user.canteenId. Output: HTTP 200 with paginated data. Processing: Extract query params, call service.getAllIngredientCategories(), use formatPaginatedResponse() |
| 03  | getActiveIngredientCategories(req, res) | Handle request to get list of active categories. Input: req.user.canteenId. Output: HTTP 200 with categories array. Processing: Call service.getActiveIngredientCategories(), format response                                                                          |
| 04  | getIngredientCategoryById(req, res)     | Handle request to get category details. Input: req.params.id, req.user.canteenId. Output: HTTP 200 with category data. Processing: Call service.getIngredientCategoryById(), format response                                                                           |
| 05  | updateIngredientCategory(req, res)      | Handle request to update category. Input: req.params.id, req.body (update data), req.user.canteenId. Output: HTTP 200 with updated category. Processing: Call service.updateIngredientCategory(), format response                                                      |
| 06  | deleteIngredientCategory(req, res)      | Handle request to delete category. Input: req.params.id, req.user.canteenId. Output: HTTP 200 with success message. Processing: Call service.deleteIngredientCategory(), format response                                                                               |

---

### IngredientCategoryService Class

| No  | Method                                              | Description                                                                                                                                                                                                                          |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01  | createIngredientCategory(data)                      | Create new ingredient category with validation. Input: data object {name, description, icon, canteenId}. Output: category object. Processing: Check duplicate name in canteen (case-insensitive), call Model.create(), return result |
| 02  | getAllIngredientCategories(queryParams, canteenId)  | Get list of categories with pagination and filter by canteen. Input: queryParams {page, limit, search}, canteenId. Output: {data: [], pagination: {}}. Processing: Build options with baseFilter {canteenId}, call paginatedQuery()  |
| 03  | getAllIngredientCategoriesNoPagination(filter)      | Get all categories without pagination (legacy support). Input: filter object. Output: categories array. Processing: Call Model.find(filter).sort({name: 1})                                                                          |
| 04  | getIngredientCategoryById(id, canteenId)            | Get category details with canteen validation. Input: id, canteenId. Output: category object. Processing: Build filter {\_id: id, canteenId}, call Model.findOne(), throw 404 if not found                                            |
| 05  | updateIngredientCategory(id, updateData, canteenId) | Update category with validation. Input: id, updateData, canteenId. Output: updated category. Processing: Check category exists, check duplicate name if updating name, call Model.findByIdAndUpdate()                                |
| 06  | deleteIngredientCategory(id, canteenId)             | Delete category. Input: id, canteenId. Output: deleted category. Processing: Build filter {\_id: id, canteenId}, call Model.findOneAndDelete(), throw 404 if not found                                                               |
| 07  | getActiveIngredientCategories(canteenId)            | Get list of active categories. Input: canteenId. Output: categories array. Processing: Build filter {isActive: true, canteenId}, call Model.find().sort({name: 1})                                                                   |

---

### IngredientCategoryModel Class

| No  | Method                               | Description                                                                                                                                                                                           |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | create(data)                         | Create new document in collection. Input: category data object. Output: Promise<IngredientCategory>. Processing: Insert into MongoDB collection ingredientcategories                                  |
| 02  | find(filter)                         | Find multiple documents. Input: filter object. Output: Promise<Array<IngredientCategory>>. Processing: Query MongoDB with filter, return array                                                        |
| 03  | findOne(filter)                      | Find one document. Input: filter object. Output: Promise<IngredientCategory or null>. Processing: Query MongoDB, return first match or null                                                           |
| 04  | findById(id)                         | Find document by ID. Input: id string. Output: Promise<IngredientCategory or null>. Processing: Query MongoDB with \_id, return document or null                                                      |
| 05  | findByIdAndUpdate(id, data, options) | Find and update document. Input: id, update data, options {new: true, runValidators: true}. Output: Promise<IngredientCategory or null>. Processing: Update MongoDB document, return updated document |
| 06  | findOneAndDelete(filter)             | Find and delete document. Input: filter object. Output: Promise<IngredientCategory or null>. Processing: Delete document from MongoDB, return deleted document                                        |
| 07  | countDocuments(filter)               | Count documents. Input: filter object. Output: Promise<Number>. Processing: Count documents in MongoDB collection                                                                                     |

---

### IngredientCategory Entity

| Field       | Type     | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| \_id        | ObjectId | MongoDB auto-generated ID                                |
| canteenId   | ObjectId | Reference to Canteen (required, indexed)                 |
| name        | String   | Ingredient group name (required, max 100 chars, trimmed) |
| description | String   | Group description (optional, max 500 chars, trimmed)     |
| icon        | String   | Icon/image URL (optional, trimmed)                       |
| isActive    | Boolean  | Active status (default: true)                            |
| createdAt   | Date     | Creation timestamp (auto generated)                      |
| updatedAt   | Date     | Update timestamp (auto generated)                        |

**Indexes:**

- `{canteenId: 1, name: 1}` - Unique index, ensures no duplicate name within same canteen
- `{canteenId: 1, isActive: 1}` - Index for querying active categories by canteen
- `{isActive: 1}` - Index for querying all active categories

---

### AuthMiddleware Class

| No  | Method                  | Description                                                                                                                                                                                                                               |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | protect(req, res, next) | Middleware for JWT token authentication. Input: JWT token in Authorization header. Output: req.user with decoded data. Processing: Verify token, decode user info (userId, canteenId, role), attach to req.user, call next() or throw 401 |
| 02  | restrictTo(...roles)    | Middleware for role-based authorization. Input: roles array (e.g., ['admin', 'manager', 'staff']). Output: Function middleware. Processing: Check if req.user.role is in roles array, allow continuation or throw 403                     |

---

### AppError Class

| No  | Method                           | Description                                                                                                                                                                             |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | constructor(message, statusCode) | Create custom error object. Input: message string, statusCode number. Output: AppError instance. Processing: Set message, statusCode, status, isOperational = true, capture stack trace |

---

### QueryHelper Utilities

| No  | Method                                      | Description                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | paginatedQuery(Model, queryParams, options) | Execute paginated query. Input: Mongoose Model, queryParams {page, limit, search, sort}, options {baseFilter, populate}. Output: Promise<{data: [], pagination: {}}>. Processing: Parse params, build filter, execute query with skip/limit, count total, return formatted result |
| 02  | formatPaginatedResponse(result, message)    | Format response for paginated data. Input: result object, success message. Output: {success: true, message, data: [], pagination: {}}. Processing: Format according to API response standard                                                                                      |

---

### CatchAsync Utility

| No  | Method         | Description                                                                                                                                                                            |
| --- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | catchAsync(fn) | Wrapper function to catch async errors. Input: async function. Output: Express middleware function. Processing: Wrap function in try-catch, forward errors to error handler middleware |

---

## c. Business Rules & Validations

1. **Unique Name per Canteen**: Ingredient group name must be unique within the same canteen (case-insensitive)
2. **Canteen Association**: Every ingredient category must be assigned to a canteen
3. **Authorization**:
   - Public can view list and details
   - Only authenticated users (admin, manager, staff) can create/update
   - Only admin can delete
4. **Data Isolation**: Users can only see categories of their assigned canteen
5. **Soft Delete**: Use isActive flag instead of hard delete

---

## d. Error Handling

- **400 Bad Request**: Duplicate name, missing canteenId, validation errors
- **401 Unauthorized**: Invalid or missing token
- **403 Forbidden**: Insufficient permissions (role restriction)
- **404 Not Found**: Category does not exist or does not belong to user's canteen

---

## e. Performance Considerations

- Indexes are created on frequently queried fields: canteenId, name, isActive
- Pagination limits the number of records returned
- Lean queries can be used when Mongoose document methods are not needed

---

## f. Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: Authentication (in middleware)
- **catchAsync**: Error handling utility
- **AppError**: Custom error class
- **queryHelper**: Pagination utilities
