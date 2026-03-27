# Manual Testing - UC38 (Canteen Governance) & UC40 (Banner Governance)

**Feature Group:** Canteen Governance + Banner Governance  
**Reference:** USE_CASE_UC38_UC40_EN.md

| Pass | Fail | Untested | N/A | Number of Test Cases |
| ---- | ---- | -------- | --- | -------------------- |
| 0    | 0    | 38       | 0   | 38                   |

---

## UC38.1 Review Registration

| ID       | Test Case Description                | Test Case Procedure                                                                                                         | Expected Results                                                                                                              | Actual Results | Dependency | Result   |
| -------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- | -------- |
| CG-RR-01 | Approve pending canteen successfully | 1. Login as admin.<br>2. Open Canteen Management page.<br>3. Go to Pending tab.<br>4. Click **Approve** on one pending row. | API `PATCH /api/canteens/:id/review` with `decision=approve` returns 200; canteen moves to Active tab; success message shown. |                | None       | Untested |
| CG-RR-02 | Reject pending canteen successfully  | 1. Login as admin.<br>2. Open Pending tab.<br>3. Click **Reject** on one pending row.                                       | API returns 200; canteen removed from pending list; canteen status becomes `inactive`; success message shown.                 |                | None       | Untested |
| CG-RR-03 | Reject updates linked manager status | 1. Prepare pending canteen linked with manager account.<br>2. Reject registration.<br>3. Verify user status in DB/API.      | Linked manager accounts with that `canteenId` are set to `inactive`.                                                          |                | CG-RR-02   | Untested |
| CG-RR-04 | Invalid decision payload             | 1. Use API client.<br>2. Call review endpoint with `decision=invalid`.                                                      | HTTP 400 with validation message for decision.                                                                                |                | None       | Untested |
| CG-RR-05 | Review non-pending canteen           | 1. Pick canteen with `active` status.<br>2. Call review endpoint.                                                           | HTTP 400 because only pending canteens can be reviewed.                                                                       |                | None       | Untested |
| CG-RR-06 | Review non-existing canteen          | 1. Call review endpoint with random/non-existing ID.                                                                        | HTTP 404 `Canteen not found`.                                                                                                 |                | None       | Untested |
| CG-RR-07 | Manager cannot review                | 1. Login as manager.<br>2. Call review endpoint.                                                                            | HTTP 403 Forbidden.                                                                                                           |                | None       | Untested |
| CG-RR-08 | Unauthenticated review request       | 1. Remove token.<br>2. Call review endpoint.                                                                                | HTTP 401 Unauthorized.                                                                                                        |                | None       | Untested |

---

## UC38.2 View List Canteens

| ID       | Test Case Description            | Test Case Procedure                                                  | Expected Results                                                                      | Actual Results | Dependency | Result   |
| -------- | -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------- | ---------- | -------- |
| CG-VL-01 | Admin sees Active + Pending tabs | 1. Login as admin.<br>2. Open Canteen Management page.               | Two tabs displayed: Active Canteens and Pending Canteens; both load data via API.     |                | None       | Untested |
| CG-VL-02 | Manager sees own canteen view    | 1. Login as manager.<br>2. Open Canteen Management page.             | Manager layout rendered for own canteen only.                                         |                | None       | Untested |
| CG-VL-03 | Active canteen list loads        | 1. Login as admin.<br>2. Open Active tab.                            | `GET /api/canteens?status=active` returns list; table shows records with status tags. |                | CG-VL-01   | Untested |
| CG-VL-04 | Pending canteen list loads       | 1. Login as admin.<br>2. Open Pending tab.                           | `GET /api/canteens?status=pending` returns list; table shows review actions.          |                | CG-VL-01   | Untested |
| CG-VL-05 | Empty active list state          | 1. Ensure no active canteens in test dataset.<br>2. Open Active tab. | Empty state message shown, no table rows.                                             |                | CG-VL-01   | Untested |
| CG-VL-06 | Empty pending list state         | 1. Ensure no pending canteens.<br>2. Open Pending tab.               | Empty state message shown, no table rows.                                             |                | CG-VL-01   | Untested |
| CG-VL-07 | Public API can be queried        | 1. Call `GET /api/canteens` without token.                           | API returns list successfully (public route).                                         |                | None       | Untested |

---

## UC40.1 View List Banners

| ID       | Test Case Description                      | Test Case Procedure                                                   | Expected Results                                                                                          | Actual Results | Dependency | Result   |
| -------- | ------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------- | ---------- | -------- |
| BG-VL-01 | Admin can open Banner Governance page      | 1. Login as admin.<br>2. Open Banner Governance page.                 | Page renders filter bar, create button, table, and total badge.                                           |                | None       | Untested |
| BG-VL-02 | Non-admin cannot access banner governance  | 1. Login as manager/staff.<br>2. Open banner route directly.          | FE shows empty/warning state; BE `/api/banners` returns 403 if called with non-admin token.               |                | None       | Untested |
| BG-VL-03 | Initial list loads with default pagination | 1. Login as admin.<br>2. Open page.<br>3. Observe network call.       | FE calls `GET /api/banners?page=1&limit=10`; table displays banner rows and pagination from API response. |                | BG-VL-01   | Untested |
| BG-VL-04 | Search by title works                      | 1. Enter title keyword in search.<br>2. Execute search.               | FE sends `search` param; backend returns matching banners by title.                                       |                | BG-VL-03   | Untested |
| BG-VL-05 | Filter by active status works              | 1. Select `Đang hiển thị` then `Đang tắt`.<br>2. Click filter button. | FE sends `isActive=true/false`; table shows only rows with selected status.                               |                | BG-VL-03   | Untested |
| BG-VL-06 | Filter by canteen works                    | 1. Select one canteen in dropdown.<br>2. Click filter button.         | FE sends `canteenId`; list contains only banners of selected canteen (or global when filter cleared).     |                | BG-VL-03   | Untested |
| BG-VL-07 | Pagination change works                    | 1. Change page.<br>2. Change page size.                               | FE re-fetches list with new `page` and `limit`; table updates correctly.                                  |                | BG-VL-03   | Untested |
| BG-VL-08 | Empty result state                         | 1. Apply filters that return no banner.                               | Table shows empty state with no crash.                                                                    |                | BG-VL-03   | Untested |

---

## UC40.2 View Banner Detail

| ID       | Test Case Description                 | Test Case Procedure                                                                               | Expected Results                                                                        | Actual Results | Dependency | Result   |
| -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------- | ---------- | -------- |
| BG-VD-01 | Open detail drawer successfully       | 1. Login admin.<br>2. Click `Chi tiết` on any banner row.                                         | FE calls `GET /api/banners/:id`; detail drawer opens and loads data.                    |                | BG-VL-03   | Untested |
| BG-VD-02 | Detail displays all key banner fields | 1. Open detail drawer.<br>2. Verify image/title/canteen/imageUrl/linkUrl/status/order/date range. | All displayed values match API response; fallback text shown for empty optional fields. |                | BG-VD-01   | Untested |
| BG-VD-03 | Detail of non-existing banner         | 1. Use API client call `GET /api/banners/:id` with random id.                                     | HTTP 404 `Banner not found`; FE shows error message if triggered from UI.               |                | None       | Untested |
| BG-VD-04 | Non-admin blocked from detail API     | 1. Login non-admin.<br>2. Call `GET /api/banners/:id`.                                            | HTTP 403 Forbidden.                                                                     |                | None       | Untested |

---

## UC40.3 Create Banner

| ID       | Test Case Description             | Test Case Procedure                                                                                                             | Expected Results                                                                    | Actual Results | Dependency | Result   |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------- | ---------- | -------- |
| BG-CR-01 | Create global banner successfully | 1. Login admin.<br>2. Click `Tạo banner`.<br>3. Upload image.<br>4. Fill required fields and leave canteen empty.<br>5. Submit. | `POST /api/banners` returns 201; banner appears in list with scope `Toàn hệ thống`. |                | BG-VL-03   | Untested |
| BG-CR-02 | Create canteen-specific banner    | 1. Login admin.<br>2. Create banner and select one canteen.<br>3. Submit.                                                       | Banner created with selected `canteenId`; visible when filtering by that canteen.   |                | BG-VL-03   | Untested |
| BG-CR-03 | Required field validation on form | 1. Open create drawer.<br>2. Leave `title` or `imageUrl` empty.<br>3. Submit.                                                   | FE validation blocks submit with message.                                           |                | None       | Untested |
| BG-CR-04 | Invalid date range rejected       | 1. Set `startDate` greater than `endDate`.<br>2. Submit.                                                                        | FE warns or backend returns 400 (`endDate phải lớn hơn hoặc bằng startDate`).       |                | None       | Untested |
| BG-CR-05 | Invalid canteenId rejected        | 1. Use API client call create with fake `canteenId`.                                                                            | HTTP 400 `Canteen không tồn tại`.                                                   |                | None       | Untested |
| BG-CR-06 | Upload image failure handling     | 1. Upload invalid file type/too-large file or simulate upload API failure.                                                      | FE shows upload error; form is not saved successfully without valid `imageUrl`.     |                | None       | Untested |

---

## UC40.4 Update Banner

| ID       | Test Case Description                      | Test Case Procedure                                                                             | Expected Results                                                             | Actual Results | Dependency | Result   |
| -------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------- | ---------- | -------- |
| BG-UP-01 | Update banner basic information            | 1. Login admin.<br>2. Click `Sửa` on one banner.<br>3. Update title/order/status.<br>4. Submit. | `PATCH /api/banners/:id` returns 200; list shows updated values.             |                | BG-VL-03   | Untested |
| BG-UP-02 | Update banner scope from canteen to global | 1. Edit canteen-scoped banner.<br>2. Clear canteen field.<br>3. Submit.                         | Banner updated without `canteenId`; shown as `Toàn hệ thống`.                |                | BG-UP-01   | Untested |
| BG-UP-03 | Replace banner image                       | 1. Edit banner.<br>2. Upload new image and submit.                                              | `imageUrl` changes successfully; detail/list reflect new image URL.          |                | BG-UP-01   | Untested |
| BG-UP-04 | Update with invalid date range             | 1. Edit banner with `startDate > endDate`.<br>2. Submit.                                        | Backend returns 400; update is rejected and existing data remains unchanged. |                | None       | Untested |
| BG-UP-05 | Update non-existing banner                 | 1. Call patch endpoint with random id.                                                          | HTTP 404 `Banner not found`.                                                 |                | None       | Untested |
| BG-UP-06 | Non-admin cannot update banner             | 1. Login non-admin.<br>2. Call `PATCH /api/banners/:id`.                                        | HTTP 403 Forbidden.                                                          |                | None       | Untested |

---

## UC40.5 Delete Banner

| ID        | Test Case Description                    | Test Case Procedure                                                     | Expected Results                                                           | Actual Results | Dependency | Result   |
| --------- | ---------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------- | ---------- | -------- |
| BG-DEL-01 | Delete banner from table action          | 1. Login admin.<br>2. Click `Xóa` on one row.<br>3. Confirm popconfirm. | `DELETE /api/banners/:id` returns 204; success message displayed.          |                | BG-VL-03   | Untested |
| BG-DEL-02 | Cancel delete confirmation               | 1. Click `Xóa` on one row.<br>2. Click cancel in popconfirm.            | No API delete request is sent; row remains unchanged.                      |                | BG-VL-03   | Untested |
| BG-DEL-03 | Deleted banner no longer appears in list | 1. Delete one banner.<br>2. Reload current page/filter.                 | Deleted banner is absent from list and detail API returns 404 for same id. |                | BG-DEL-01  | Untested |
| BG-DEL-04 | Delete non-existing banner               | 1. Call delete endpoint with random id.                                 | HTTP 404 `Banner not found`.                                               |                | None       | Untested |
| BG-DEL-05 | Non-admin cannot delete banner           | 1. Login non-admin.<br>2. Call `DELETE /api/banners/:id`.               | HTTP 403 Forbidden.                                                        |                | None       | Untested |

---

## Notes

- All API assertions must be validated against current backend modules:
  - [UniLife_BE/src/modules/canteen/canteen.routes.js](UniLife_BE/src/modules/canteen/canteen.routes.js)
  - [UniLife_BE/src/modules/canteen/canteen.service.js](UniLife_BE/src/modules/canteen/canteen.service.js)
  - [UniLife_BE/src/modules/banner/banner.routes.js](UniLife_BE/src/modules/banner/banner.routes.js)
  - [UniLife_BE/src/modules/banner/banner.service.js](UniLife_BE/src/modules/banner/banner.service.js)
- Current FE flows are validated against:
  - [UniLife_Dashboard_FE/src/pages/manager/CanteenManagement.jsx](UniLife_Dashboard_FE/src/pages/manager/CanteenManagement.jsx)
  - [UniLife_Dashboard_FE/src/pages/admin/BannerGovernance.jsx](UniLife_Dashboard_FE/src/pages/admin/BannerGovernance.jsx)
  - [UniLife_Dashboard_FE/src/services/banner.service.js](UniLife_Dashboard_FE/src/services/banner.service.js)
