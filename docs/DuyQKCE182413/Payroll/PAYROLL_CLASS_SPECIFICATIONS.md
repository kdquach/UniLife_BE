# Payroll Management - Class Specifications

## a. System Architecture Overview

The **Payroll Management** module manages the entire payroll cycle in the system, including salary rate configuration, payroll calculation, salary adjustments, approvals, and payments. This module is separated by canteen and uses role-based authorization to ensure each canteen can independently manage its payroll with proper access control.

**Standard Processing Flow:**

```
Routes → Middleware (protect + restrictTo) → Controller → Service → Model → MongoDB
```

**Main Components:**

- **Payroll**: Represents a payroll period (master/header record)
- **Salary**: Individual salary records for each employee in a payroll
- **SalaryRate**: Configuration of hourly rates and bonus/deduction policies per employee
- **PayrollCalculator**: Automated calculation engine for payroll processing

---

## b. Class Specifications

### PayrollRoutes Class

| No  | Method                               | Description                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | GET /                                | Route to get list of all payrolls with pagination. Input: query params (page, limit, canteenId, status, periodStart, periodEnd), JWT token. Output: paginated list. Processing: Require role admin/manager/canteen_owner, call controller.getAllPayrolls()                            |
| 02  | GET /stats                           | Route to get payroll statistics. Input: query params, JWT token. Output: stats object. Processing: Require role admin/manager/canteen_owner, call controller.getPayrollStats()                                                                                                        |
| 03  | GET /:id                             | Route to get payroll details including list of salaries. Input: id param, JWT token. Output: payroll object and salaries array. Processing: Require role admin/manager/canteen_owner, call controller.getPayrollById()                                                                |
| 04  | POST /generate                       | Route to create payroll and auto-calculate salary for all employees. Input: JWT token, body {canteenId, periodStart, periodEnd, hourlyRate, description}. Output: payroll and salaries array. Processing: Require role admin/manager/canteen_owner, call controller.generatePayroll() |
| 05  | POST /                               | Route to create payroll manually (without calculation). Input: JWT token, payroll data. Output: new payroll object. Processing: Require role admin/manager/canteen_owner, call controller.createPayroll()                                                                             |
| 06  | PATCH /:id/approve                   | Route to approve payroll. Input: JWT token, id param. Output: approved payroll. Processing: Require role admin/manager/canteen_owner, call controller.approvePayroll()                                                                                                                |
| 07  | PATCH /:id/pay                       | Route to confirm payroll payment. Input: JWT token, id param. Output: paid payroll. Processing: Require role admin/manager/canteen_owner, call controller.confirmPayment()                                                                                                            |
| 08  | PATCH /:payrollId/salaries/:salaryId | Route to adjust employee salary. Input: JWT token, payrollId, salaryId, body {bonus, deduction, adjustmentReason}. Output: updated salary. Processing: Require role admin/manager/canteen_owner, call controller.adjustSalary()                                                       |
| 09  | DELETE /:id                          | Route to delete payroll (only draft or calculated). Input: JWT token, id param. Output: success message. Processing: Require role admin/manager, call controller.deletePayroll()                                                                                                      |

---

### SalaryRateRoutes Class

| No  | Method                  | Description                                                                                                                                                                                                                                                                       |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | GET /                   | Route to get all salary rates. Input: JWT token. Output: salaryRates array. Processing: Require role admin/manager/canteen_owner, call controller.getAllSalaryRates()                                                                                                             |
| 02  | GET /canteen/:canteenId | Route to get list of salary rates by canteen. Input: canteenId param, JWT token. Output: salaryRates array. Processing: Require role admin/manager/canteen_owner, call controller.getSalaryRatesByCanteen()                                                                       |
| 03  | GET /user/:userId       | Route to get employee salary rate. Input: userId param, JWT token. Output: salaryRate object. Processing: Require role admin/manager/canteen_owner, call controller.getSalaryRateByUser()                                                                                         |
| 04  | POST /                  | Route to set or update employee salary rate. Input: JWT token, body {userId, canteenId, hourlyRate, attendanceBonus100, overtimeMultiplier, lateDeduction, ...}. Output: salaryRate object. Processing: Require role admin/manager/canteen_owner, call controller.setSalaryRate() |
| 05  | DELETE /user/:userId    | Route to delete employee salary rate. Input: userId param, JWT token. Output: success message. Processing: Require role admin only, call controller.deleteSalaryRate()                                                                                                            |

---

### SalaryRoutes Class

| No  | Method               | Description                                                                                                                                                                                                                                                  |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01  | GET /                | Route to get list of all salary records with pagination and filter. Input: query params (page, limit, status, startDate, endDate), JWT token. Output: paginated list. Processing: Require role admin/manager/canteen_owner, call controller.getAllSalaries() |
| 02  | GET /my-salaries     | Route for employee to view their own salary. Input: JWT token. Output: salaries array. Processing: Require role staff/manager/admin, call controller.getMySalaries()                                                                                         |
| 03  | GET /stats           | Route to get salary statistics. Input: query params (canteenId, periodStart, periodEnd), JWT token. Output: stats object. Processing: Require role admin/manager/canteen_owner, call controller.getSalaryStats()                                             |
| 04  | GET /:id             | Route to get salary record details. Input: id param, JWT token. Output: salary object. Processing: Require role admin/manager/canteen_owner, call controller.getSalaryById()                                                                                 |
| 05  | POST /               | Route to create salary record manually. Input: JWT token, salary data. Output: new salary object. Processing: Require role admin/manager/canteen_owner, call controller.createSalary()                                                                       |
| 06  | POST /calculate      | Route to calculate salary for one employee. Input: JWT token, body {userId, canteenId, periodStart, periodEnd, hourlyRate}. Output: calculated salary. Processing: Require role admin/manager/canteen_owner, call controller.calculateSalary()               |
| 07  | POST /bulk-calculate | Route to calculate salary for multiple employees. Input: JWT token, body {canteenId, periodStart, periodEnd, hourlyRate}. Output: salaries array. Processing: Require role admin/manager/canteen_owner, call controller.bulkCalculateSalaries()              |
| 08  | PATCH /:id           | Route to update salary record. Input: id param, JWT token, update data. Output: updated salary. Processing: Require role admin/manager/canteen_owner, call controller.updateSalary()                                                                         |
| 09  | PATCH /:id/approve   | Route to approve salary. Input: id param, JWT token. Output: approved salary. Processing: Require role admin/manager/canteen_owner, call controller.approveSalary()                                                                                          |
| 10  | PATCH /:id/pay       | Route to mark salary as paid. Input: id param, JWT token. Output: paid salary. Processing: Require role admin/manager/canteen_owner, call controller.markAsPaid()                                                                                            |
| 11  | DELETE /:id          | Route to delete salary record. Input: id param, JWT token. Output: success message. Processing: Require role admin/manager/canteen_owner, call controller.deleteSalary()                                                                                     |

---

### PayrollController Class

| No  | Method                    | Description                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | createPayroll(req, res)   | Handle request to create payroll manually. Input: req.body (canteenId, periodStart, periodEnd, hourlyRate, description). Output: HTTP 201 with payroll data. Processing: Call service.createPayroll(), format response with message "Payroll created successfully"                                                                                                                                      |
| 02  | getAllPayrolls(req, res)  | Handle request to get list of payrolls with pagination. Input: req.query (page, limit, canteenId, status, periodStart, periodEnd). Output: HTTP 200 with paginated data. Processing: Extract query params, call service.getAllPayrolls(), format response with results count                                                                                                                            |
| 03  | getPayrollById(req, res)  | Handle request to get payroll details with list of salaries. Input: req.params.id. Output: HTTP 200 with payroll and salaries. Processing: Call service.getPayrollById(), return {payroll, salaries}                                                                                                                                                                                                    |
| 04  | generatePayroll(req, res) | Handle request to create payroll and auto-calculate salary. Input: req.body {canteenId, periodStart, periodEnd, hourlyRate, description}, req.user.\_id. Output: HTTP 201 with payroll and salaries. Processing: Validate required fields (canteenId, dates, hourlyRate > 0), throw AppError if missing, call service.generatePayroll(), format response with message "Payroll created for X employees" |
| 05  | adjustSalary(req, res)    | Handle request to adjust employee salary. Input: req.params {payrollId, salaryId}, req.body {bonus, deduction, adjustmentReason}. Output: HTTP 200 with updated salary. Processing: Extract params, call service.adjustSalary(), format response with message "Salary adjusted successfully"                                                                                                            |
| 06  | approvePayroll(req, res)  | Handle request to approve payroll. Input: req.params.id, req.user.\_id. Output: HTTP 200 with approved payroll. Processing: Extract id and approvedBy from req.user.\_id, call service.approvePayroll(), format response with message "Payroll approved successfully"                                                                                                                                   |
| 07  | confirmPayment(req, res)  | Handle request to confirm payment. Input: req.params.id, req.user.\_id. Output: HTTP 200 with paid payroll. Processing: Extract id and paidBy from req.user.\_id, call service.confirmPayment(), format response with message "Payroll payment confirmed successfully"                                                                                                                                  |
| 08  | deletePayroll(req, res)   | Handle request to delete payroll. Input: req.params.id. Output: HTTP 204. Processing: Call service.deletePayroll(), return status 204 with data: null                                                                                                                                                                                                                                                   |
| 09  | getPayrollStats(req, res) | Handle request to get payroll statistics. Input: req.query (canteenId, periodStart, periodEnd). Output: HTTP 200 with stats object. Processing: Call service.getPayrollStats(), format response with data: {stats}                                                                                                                                                                                      |

---

### SalaryRateController Class

| No  | Method                            | Description                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | setSalaryRate(req, res)           | Handle request to set/update salary rate. Input: req.body {userId, canteenId, hourlyRate, attendanceBonus100, overtimeMultiplier, lateDeduction, ...}, req.user.\_id. Output: HTTP 200 with salaryRate. Processing: Merge req.body with updatedBy: req.user.\_id, call service.setSalaryRate(), format response with message "Salary rate set successfully" or "Salary rate updated successfully" |
| 02  | getSalaryRateByUser(req, res)     | Handle request to get user salary rate. Input: req.params.userId. Output: HTTP 200 with salaryRate. Processing: Call service.getSalaryRateByUser(), format response with data: {salaryRate}                                                                                                                                                                                                       |
| 03  | getSalaryRatesByCanteen(req, res) | Handle request to get list of salary rates by canteen. Input: req.params.canteenId. Output: HTTP 200 with salaryRates array. Processing: Call service.getSalaryRatesByCanteen(), format response with results count and data                                                                                                                                                                      |
| 04  | getAllSalaryRates(req, res)       | Handle request to get all salary rates. Input: none. Output: HTTP 200 with salaryRates array. Processing: Call service.getAllSalaryRates(), format response with results count                                                                                                                                                                                                                    |
| 05  | deleteSalaryRate(req, res)        | Handle request to delete salary rate. Input: req.params.userId. Output: HTTP 204. Processing: Call service.deleteSalaryRate(), return status 204 with data: null                                                                                                                                                                                                                                  |

---

### SalaryController Class

| No  | Method                          | Description                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | createSalary(req, res)          | Handle request to create salary record manually. Input: req.body (userId, canteenId, payrollId, periodStart, periodEnd, baseSalary, ...). Output: HTTP 201 with salary. Processing: Call service.createSalary(), format response with data: {salary}                                                  |
| 02  | getAllSalaries(req, res)        | Handle request to get list of salaries with pagination and filter. Input: req.query {page, limit, status, startDate, endDate, ...}. Output: HTTP 200 with paginated data. Processing: Extract startDate/endDate separately, build dateRange filter, call service with paginatedQuery, format response |
| 03  | getSalaryById(req, res)         | Handle request to get salary details. Input: req.params.id. Output: HTTP 200 with salary object. Processing: Call service.getSalaryById(), format response with data: {salary}                                                                                                                        |
| 04  | getMySalaries(req, res)         | Handle request for employee to view their salary. Input: req.user.\_id, req.query. Output: HTTP 200 with salaries array. Processing: Extract userId from req.user.\_id, call service.getMySalaries(), format response with results count                                                              |
| 05  | updateSalary(req, res)          | Handle request to update salary. Input: req.params.id, req.body (update data). Output: HTTP 200 with updated salary. Processing: Call service.updateSalary(), format response with data: {salary}                                                                                                     |
| 06  | deleteSalary(req, res)          | Handle request to delete salary. Input: req.params.id. Output: HTTP 204. Processing: Call service.deleteSalary(), return status 204                                                                                                                                                                   |
| 07  | calculateSalary(req, res)       | Handle request to calculate salary for one employee. Input: req.body {userId, canteenId, periodStart, periodEnd, hourlyRate}. Output: HTTP 200 with calculated salary. Processing: Extract params, call service.calculateSalary(), format response with data: {salary}                                |
| 08  | bulkCalculateSalaries(req, res) | Handle request to calculate salary for multiple employees. Input: req.body {canteenId, periodStart, periodEnd, hourlyRate}. Output: HTTP 200 with salaries array. Processing: Extract params, call service.bulkCalculateSalaries(), format response with results count                                |
| 09  | approveSalary(req, res)         | Handle request to approve salary. Input: req.params.id. Output: HTTP 200 with approved salary. Processing: Call service.approveSalary(), format response                                                                                                                                              |
| 10  | markAsPaid(req, res)            | Handle request to mark as paid. Input: req.params.id. Output: HTTP 200 with paid salary. Processing: Call service.markAsPaid(), format response                                                                                                                                                       |
| 11  | getSalaryStats(req, res)        | Handle request to get salary statistics. Input: req.query {canteenId, periodStart, periodEnd}. Output: HTTP 200 with stats object. Processing: Extract params, call service.getSalaryStats(), format response                                                                                         |

---

### PayrollService Class

| No  | Method                                                                                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | createPayroll(data)                                                                    | Create new payroll record. Input: data object {canteenId, periodStart, periodEnd, hourlyRate, description, createdBy}. Output: payroll object. Processing: Call PayrollModel.create(), return payroll                                                                                                                                                                                                                                                                                                    |
| 02  | getAllPayrolls(queryParams)                                                            | Get payrolls list with filter. Input: queryParams {page, limit, canteenId, status, periodStart, periodEnd}. Output: payrolls array or paginated result. Processing: Build filter from queryParams, call PayrollModel.find() with populate('canteenId', 'name').populate('createdBy', 'fullName').sort({createdAt: -1}), if has page/limit then use paginatedQuery                                                                                                                                        |
| 03  | getPayrollById(id)                                                                     | Get payroll detail and salaries. Input: id string. Output: {payroll, salaries}. Processing: Call PayrollModel.findById(id).populate('canteenId createdBy approvedBy paidBy'), throw AppError("Payroll not found", 404) if null, call SalaryModel.find({payrollId: id}).populate('userId', 'fullName email'), return {payroll, salaries}                                                                                                                                                                  |
| 04  | generatePayroll(canteenId, periodStart, periodEnd, hourlyRate, createdBy, description) | Create payroll and automatically calculate salary for all staff. Input: canteenId, dates, hourlyRate, createdBy, description. Output: {payroll, salaries}. Processing: 1) Create Payroll record with status "draft", 2) Call PayrollCalculator.calculatePayrollForAllUsers() to calculate salary for all staff, 3) Calculate totals: totalStaff, totalHours, totalAmount, totalBonus, totalDeduction from salaries, 4) Update Payroll with totals and status "calculated", 5) Return {payroll, salaries} |
| 05  | adjustSalary(payrollId, salaryId, updateData)                                          | Adjust staff salary. Input: payrollId, salaryId, updateData {bonus, deduction, adjustmentReason}. Output: updated salary. Processing: 1) Call SalaryModel.findById(salaryId), throw 404 if not found, 2) Update salary with bonus, deduction, adjustmentReason, 3) Recalculate totalSalary = baseSalary + bonus - deduction, 4) Save salary, 5) Call recalculatePayrollTotals(payrollId) to update payroll totals, 6) Return updated salary                                                              |
| 06  | approvePayroll(id, approvedBy)                                                         | Approve payroll. Input: id, approvedBy (userId). Output: approved payroll. Processing: 1) Find payroll, throw 404 if not found, 2) Check status === "calculated", throw AppError("Can only approve calculated payroll", 400) if invalid, 3) Update payroll: status = "approved", approvedBy, approvedAt = new Date(), 4) Update all salaries in payroll to status "approved" with SalaryModel.updateMany({payrollId: id}, {status: "approved"}), 5) Save and return payroll                              |
| 07  | confirmPayment(id, paidBy)                                                             | Confirm payroll payment. Input: id, paidBy (userId). Output: paid payroll. Processing: 1) Find payroll, throw 404 if not found, 2) Check status === "approved", throw AppError("Payroll not yet approved", 400) if not, 3) Update payroll: status = "paid", paidBy, paidAt = new Date(), isLocked = true, 4) Update all salaries: status = "paid", paidAt with SalaryModel.updateMany(), 5) Save and return payroll                                                                                      |
| 08  | deletePayroll(id)                                                                      | Delete payroll. Input: id. Output: deleted payroll. Processing: 1) Find payroll, throw 404 if not found, 2) Check status in ["draft", "calculated"], throw AppError("Cannot delete approved or paid payroll", 400) if not, 3) Delete all related salaries with SalaryModel.deleteMany({payrollId: id}), 4) Delete payroll with PayrollModel.findByIdAndDelete(id), 5) Return deleted payroll                                                                                                             |
| 09  | getPayrollStats(query)                                                                 | Get payroll statistics. Input: query {canteenId, periodStart, periodEnd}. Output: stats object. Processing: Build filter from query, call PayrollModel.aggregate() to calculate total payrolls, total amount, average amount, group by status, return aggregated stats                                                                                                                                                                                                                                   |
| 10  | recalculatePayrollTotals(payrollId)                                                    | Recalculate payroll totals after adjustment. Input: payrollId. Output: void. Processing: 1) Aggregate SalaryModel.find({payrollId}) to calculate sum(totalSalary), sum(bonus), sum(deduction), sum(totalHours), count(), 2) Update PayrollModel with totalAmount, totalBonus, totalDeduction, totalHours, totalStaff                                                                                                                                                                                     |

---

### SalaryRateService Class

| No  | Method                             | Description                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | setSalaryRate(data)                | Set or update salary rate. Input: data {userId, canteenId, hourlyRate, attendanceBonus100, overtimeMultiplier, lateDeduction, updatedBy, ...}. Output: salaryRate object. Processing: 1) Call SalaryRateModel.findOne({userId}), 2) If exists: findOneAndUpdate() with {new: true, runValidators: true}, 3) If not exists: create() new, 4) Populate userId and canteenId, 5) Return salaryRate |
| 02  | getSalaryRateByUser(userId)        | Get user salary rate. Input: userId. Output: salaryRate object. Processing: Call SalaryRateModel.findOne({userId}).populate('userId', 'fullName email').populate('canteenId', 'name').populate('updatedBy', 'fullName'), throw AppError("Salary rate not set for this employee", 404) if null                                                                                                   |
| 03  | getSalaryRatesByCanteen(canteenId) | Get list of salary rates by canteen. Input: canteenId. Output: salaryRates array. Processing: Call SalaryRateModel.find({canteenId}).populate('userId', 'fullName email phone role').populate('updatedBy', 'fullName').sort({updatedAt: -1})                                                                                                                                                    |
| 04  | getAllSalaryRates()                | Get all salary rates. Input: none. Output: salaryRates array. Processing: Call SalaryRateModel.find().populate('userId', 'fullName email').populate('canteenId', 'name').sort({updatedAt: -1})                                                                                                                                                                                                  |
| 05  | deleteSalaryRate(userId)           | Delete user salary rate. Input: userId. Output: deleted salaryRate. Processing: Call SalaryRateModel.findOneAndDelete({userId}), throw AppError("Salary rate not found", 404) if null                                                                                                                                                                                                           |

---

### SalaryService Class

| No  | Method                                                                 | Description                                                                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | createSalary(data)                                                     | Create salary record manually. Input: data object. Output: salary object. Processing: Call SalaryModel.create(), return salary                                                                                                                                                                                                                                             |
| 02  | getAllSalaries(queryParams, dateRange)                                 | Get salary list with pagination. Input: queryParams {page, limit, status, ...}, dateRange {startDate, endDate}. Output: paginated result. Processing: Build filter from queryParams and dateRange, call paginatedQuery(SalaryModel, queryParams, {baseFilter, populate: 'userId canteenId payrollId'})                                                                     |
| 03  | getSalaryById(id)                                                      | Get salary detail. Input: id. Output: salary object. Processing: Call SalaryModel.findById(id).populate('userId', 'fullName email phone').populate('canteenId', 'name').populate('payrollId', 'periodStart periodEnd status'), throw AppError("Salary record not found", 404) if null                                                                                      |
| 04  | getMySalaries(userId, queryParams)                                     | Get staff salary list. Input: userId, queryParams. Output: salaries array or paginated. Processing: Build baseFilter {userId}, call paginatedQuery or SalaryModel.find() with populate and sort                                                                                                                                                                            |
| 05  | updateSalary(id, updateData)                                           | Update salary record. Input: id, updateData. Output: updated salary. Processing: Call SalaryModel.findByIdAndUpdate(id, updateData, {new: true, runValidators: true}).populate(), throw 404 if null                                                                                                                                                                        |
| 06  | deleteSalary(id)                                                       | Delete salary record. Input: id. Output: deleted salary. Processing: Call SalaryModel.findByIdAndDelete(id), throw 404 if null                                                                                                                                                                                                                                             |
| 07  | calculateSalary(userId, canteenId, periodStart, periodEnd, hourlyRate) | Calculate salary for one staff. Input: userId, canteenId, dates, hourlyRate. Output: calculated salary. Processing: 1) Query StaffShiftModel to get total work hours, 2) Calculate baseSalary = totalHours \* hourlyRate, 3) Find existing salary in period, if exists then update, else create, 4) Set status = "calculated", calculatedAt = new Date(), 5) Return salary |
| 08  | bulkCalculateSalaries(canteenId, periodStart, periodEnd, hourlyRate)   | Calculate salary for multiple staff. Input: canteenId, dates, hourlyRate. Output: salaries array. Processing: 1) Get list of users in canteen, 2) Loop through each user, call calculateSalary(), 3) Return array of salaries                                                                                                                                              |
| 09  | approveSalary(id)                                                      | Approve salary. Input: id. Output: approved salary. Processing: Find salary, check status === "calculated", throw AppError if invalid, update status = "approved", save and return                                                                                                                                                                                         |
| 10  | markAsPaid(id)                                                         | Mark as paid. Input: id. Output: paid salary. Processing: Find salary, check status === "approved", throw AppError if invalid, update status = "paid", paidAt = new Date(), save and return                                                                                                                                                                                |
| 11  | getSalaryStats(canteenId, periodStart, periodEnd)                      | Get salary statistics. Input: canteenId, dates. Output: stats object. Processing: Build filter, call SalaryModel.aggregate() to calculate total, average, group by status, return stats                                                                                                                                                                                    |

---

### PayrollCalculator Class

| No  | Method                                                                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | calculatePayrollForAllUsers(canteenId, periodStart, periodEnd, payrollId)  | Calculate salary for all staff in canteen. Input: canteenId, periodStart, periodEnd, payrollId. Output: salaries array. Processing: 1) Query all users in canteen with role "staff", 2) Loop through each user, call calculateUserPayroll(), 3) Return array of calculated salaries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 02  | getUserConfig(userId)                                                      | Get user bonus/deduction config from SalaryRate. Input: userId. Output: config object {attendanceBonus100, overtimeMultiplier, lateDeduction, ...}. Processing: Call SalaryRateModel.findOne({userId}).lean(), if not found return default config {attendanceBonus100: 500000, overtimeMultiplier: 1.5, lateDeduction: 50000, ...}                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 03  | calculateUserPayroll(userId, canteenId, periodStart, periodEnd, payrollId) | Calculate salary for one user. Input: userId, canteenId, dates, payrollId. Output: salary object. Processing: 1) Call getShiftSummary() to get total hours, shifts, overtime, late count, 2) Call getUserConfig() to get config, 3) Call calculateComponents() to calculate baseSalary, bonus, deduction, overtime pay, 4) Calculate netSalary = baseSalary + overtimePay + bonus - deduction, 5) Create SalaryModel with calculated data and status "calculated", 6) Return salary                                                                                                                                                                                                                                                                                                                             |
| 04  | getShiftSummary(userId, canteenId, periodStart, periodEnd)                 | Get shift summary. Input: userId, canteenId, dates. Output: summary object. Processing: Call StaffShiftModel.aggregate() to calculate: totalHours (sum duration), attendedShifts (count status attended), totalShifts (count all), overtimeHours (sum overtime), lateCount (count late), earlyLeaveCount (count early leave), return aggregated summary                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 05  | calculateComponents(shiftSummary, config)                                  | Calculate salary components. Input: shiftSummary {totalHours, attendedShifts, totalShifts, overtimeHours, lateCount}, config {hourlyRate, bonuses, deductions, multipliers}. Output: components object. Processing: 1) baseSalary = totalHours _ config.hourlyRate, 2) overtimePay = overtimeHours _ config.hourlyRate _ config.overtimeMultiplier, 3) attendanceRate = attendedShifts / totalShifts, 4) attendanceBonus = attendanceRate === 1 ? config.attendanceBonus100 : attendanceRate >= 0.95 ? config.attendanceBonus95 : attendanceRate >= 0.9 ? config.attendanceBonus90 : 0, 5) lateDeduction = lateCount _ config.lateDeduction (if lateCount > config.maxLateAllowed then lose attendance bonus), 6) Return {baseSalary, overtimePay, bonus: attendanceBonus, deduction: lateDeduction, netSalary} |

---

### PayrollModel Entity

| Field          | Type     | Description                                                           |
| -------------- | -------- | --------------------------------------------------------------------- |
| \_id           | ObjectId | MongoDB auto-generated ID                                             |
| canteenId      | ObjectId | Reference to Canteen (required, indexed)                              |
| periodStart    | Date     | Salary period start date (required)                                   |
| periodEnd      | Date     | Salary period end date (required)                                     |
| description    | String   | Salary period description (optional, max 200 chars)                   |
| totalStaff     | Number   | Total number of staff (default: 0, min: 0)                            |
| totalHours     | Number   | Total work hours (default: 0, min: 0)                                 |
| totalAmount    | Number   | Total amount payable (default: 0, min: 0)                             |
| totalBonus     | Number   | Total bonus (default: 0)                                              |
| totalDeduction | Number   | Total deduction (default: 0)                                          |
| status         | String   | Status: draft, calculated, approved, paid, cancelled (default: draft) |
| hourlyRate     | Number   | Applied hourly rate (required, min: 0)                                |
| isLocked       | Boolean  | Lock for editing (default: false)                                     |
| version        | Number   | Version tracking (default: 1)                                         |
| createdBy      | ObjectId | Reference to User (creator)                                           |
| approvedBy     | ObjectId | Reference to User (approver)                                          |
| approvedAt     | Date     | Approval timestamp                                                    |
| paidBy         | ObjectId | Reference to User (payment confirmer)                                 |
| paidAt         | Date     | Payment timestamp                                                     |
| createdAt      | Date     | Creation timestamp (auto)                                             |
| updatedAt      | Date     | Update timestamp (auto)                                               |

**Indexes:**

- `{canteenId: 1, periodStart: 1, periodEnd: 1}` - Compound index
- `{status: 1}` - Single field index
- `{canteenId: 1, status: 1}` - Compound index for filtering

**Status Flow:**

```
draft → calculated → approved → paid
        ↓
    cancelled
```

---

### SalaryRateModel Entity

| Field               | Type     | Description                                         |
| ------------------- | -------- | --------------------------------------------------- |
| \_id                | ObjectId | MongoDB auto-generated ID                           |
| userId              | ObjectId | Reference to User (required, unique)                |
| canteenId           | ObjectId | Reference to Canteen (required)                     |
| hourlyRate          | Number   | Hourly rate (required, min: 0)                      |
| effectiveFrom       | Date     | Effective from date (required, default: now)        |
| attendanceBonus100  | Number   | 100% attendance bonus (default: 500000)             |
| attendanceBonus95   | Number   | 95% attendance bonus (default: 300000)              |
| attendanceBonus90   | Number   | 90% attendance bonus (default: 100000)              |
| overtimeMultiplier  | Number   | Overtime multiplier (default: 1.5, min: 1)          |
| lateDeduction       | Number   | Late penalty per occurrence (default: 50000)        |
| earlyLeaveDeduction | Number   | Early leave penalty per occurrence (default: 30000) |
| absentDeduction     | Number   | Absent penalty per shift (default: 200000)          |
| maxLateAllowed      | Number   | Maximum allowed late count for bonus (default: 3)   |
| updatedBy           | ObjectId | Reference to User (updater)                         |
| createdAt           | Date     | Creation timestamp (auto)                           |
| updatedAt           | Date     | Update timestamp (auto)                             |

**Indexes:**

- `{userId: 1}` - Unique index
- `{canteenId: 1}` - Single field index

---

### SalaryModel Entity

| Field            | Type     | Description                                                    |
| ---------------- | -------- | -------------------------------------------------------------- |
| \_id             | ObjectId | MongoDB auto-generated ID                                      |
| payrollId        | ObjectId | Reference to Payroll (required, indexed)                       |
| userId           | ObjectId | Reference to User (required)                                   |
| canteenId        | ObjectId | Reference to Canteen (required)                                |
| periodStart      | Date     | Salary period start date (required)                            |
| periodEnd        | Date     | Salary period end date (required)                              |
| totalHours       | Number   | Total work hours (default: 0, min: 0)                          |
| baseSalary       | Number   | Base salary (required, min: 0)                                 |
| bonus            | Number   | Bonus (default: 0, min: 0)                                     |
| deduction        | Number   | Deduction (default: 0, min: 0)                                 |
| totalSalary      | Number   | Total salary (default: 0)                                      |
| status           | String   | Status: pending, calculated, approved, paid (default: pending) |
| calculatedAt     | Date     | Calculation timestamp                                          |
| paidAt           | Date     | Payment timestamp                                              |
| note             | String   | Note (max 1000 chars)                                          |
| adjustmentReason | String   | Adjustment reason (max 500 chars)                              |
| createdAt        | Date     | Creation timestamp (auto)                                      |
| updatedAt        | Date     | Update timestamp (auto)                                        |

**Indexes:**

- `{payrollId: 1}` - Single field index
- `{userId: 1, payrollId: 1}` - Compound index
- `{canteenId: 1, periodStart: 1}` - Compound index

**Calculation:**

```
totalSalary = baseSalary + bonus - deduction
baseSalary = totalHours × hourlyRate
```

---

### AuthMiddleware Class

| No  | Method                  | Description                                                                                                                                                                                                                                                                                                                                     |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | protect(req, res, next) | JWT token authentication middleware. Input: JWT token in Authorization header (Bearer token). Output: req.user with decoded data {\_id, canteenId, role, email}. Processing: Extract token from header, verify with JWT_SECRET, decode user info, attach to req.user, call next() if success or throw 401 Unauthorized if token invalid/expired |
| 02  | restrictTo(...roles)    | Role checking middleware. Input: roles array (e.g., ['admin', 'manager', 'canteen_owner']). Output: Function middleware. Processing: Check if req.user.role is in allowed roles list, allow continuation if authorized or throw 403 Forbidden if no permission                                                                                  |

---

## c. Business Rules & Validations

1. **Payroll Status Flow**: draft → calculated → approved → paid (cannot revert to previous status)
2. **Delete Restriction**: Can only delete payroll in draft or calculated status
3. **Approve Restriction**: Can only approve payroll in calculated status
4. **Payment Restriction**: Can only confirm payment for approved payroll
5. **Lock Mechanism**: After payment, payroll is locked (isLocked = true) and cannot be edited
6. **SalaryRate Uniqueness**: Each user has only 1 current salary rate (unique constraint on userId)
7. **Auto Calculation**: When generating payroll, automatically calculate salary for all staff based on:
   - Total work hours from StaffShift
   - Hourly rate from SalaryRate or default from Payroll
   - Attendance bonus based on attended shifts percentage
   - Late penalty, early leave penalty
   - Overtime with multiplier
8. **Attendance Bonus Rules**:
   - 100% attendance → Full bonus (attendanceBonus100)
   - 95% ≤ attendance < 100% → 95% bonus (attendanceBonus95)
   - 90% ≤ attendance < 95% → 90% bonus (attendanceBonus90)
   - < 90% → No bonus
   - If late count > maxLateAllowed → Lose attendance bonus
9. **Salary Adjustment**: Can adjust bonus/deduction for individual staff after calculated
10. **Canteen Isolation**: Each canteen manages payroll independently, cannot view/edit cross-canteen
11. **Role Authorization**:
    - admin, canteen_owner, manager: Full access
    - staff: Only view own salary (my-salaries)
12. **Period Validation**: periodEnd must be after periodStart
13. **Hourly Rate Validation**: hourlyRate must be > 0

---

## d. Error Handling

- **400 Bad Request**:
  - "Canteen ID is required"
  - "Period start and end dates are required"
  - "Valid hourly rate is required"
  - "Can only approve calculated payroll"
  - "Payroll not yet approved"
  - "Cannot delete approved or paid payroll"
  - "Salary must be calculated before approval"
  - "Salary must be approved before marking as paid"
  - Validation errors: Schema validation messages

- **401 Unauthorized**: Invalid, expired, or missing JWT token

- **403 Forbidden**:
  - User không có role phù hợp để thực hiện action
  - Message: "You do not have permission to perform this action"

- **404 Not Found**:
  - "Payroll not found"
  - "Salary record not found"
  - "Salary rate not set for this staff"
  - "Salary rate not found"

- **500 Internal Server Error**: Server error, database connection, hoặc unexpected errors

---

## e. Performance Considerations

1. **Database Indexes**:
   - Compound indexes on {canteenId, periodStart, periodEnd} for Payroll
   - Index on {payrollId} for Salary for fast queries
   - Index on {userId, payrollId} to prevent duplicates
   - Unique index on userId for SalaryRate

2. **Pagination**: Use pagination for payroll and salary lists, default 10 items/page

3. **Aggregation Pipeline**: Use MongoDB aggregation to calculate totals and statistics instead of loops in code

4. **Batch Operations**:
   - Use updateMany() when updating status of multiple salaries at once
   - Use deleteMany() when deleting salaries related to payroll

5. **Populate Optimization**: Only populate necessary fields, avoid populating entire document

6. **Lean Queries**: Use .lean() for read-only queries in PayrollCalculator

7. **Caching**: Cache SalaryRate config if not frequently changed

8. **Connection Pooling**: MongoDB connection pool size appropriate for load

9. **Transaction**: Use MongoDB transaction when generating payroll to ensure data consistency

---

## f. Security Considerations

1. **Input Sanitization**: Trim input strings, validate lengths and data types
2. **NoSQL Injection Prevention**: Mongoose schema validation automatically escapes
3. **JWT Verification**: Token must be valid and not expired
4. **Role Checking**: All protected routes check role with restrictTo middleware
5. **Data Isolation**: Filter by canteenId ensures users cannot access cross-canteen data
6. **Staff Data Privacy**: Staff can only view own salary through /my-salaries endpoint
7. **Sensitive Data**: Do not log salary data to console or error messages
8. **Rate Limiting**: Implement to prevent abuse (if not already at API level)
9. **HTTPS**: Use HTTPS for production to encrypt data transmission
10. **Audit Trail**: Log approve and payment actions with user ID and timestamp

---

## g. Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM, version >= 6.0
- **jsonwebtoken**: Authentication
- Custom utilities: Error handling, pagination, query helpers
- Custom middleware: Authentication và authorization

---

## h. API Response Format

**Success Response:**

```json
{
  "status": "success",
  "message": "Payroll created for 15 staff",
  "data": {
    "payroll": {...},
    "salaries": [...]
  }
}
```

**Paginated Response:**

```json
{
  "status": "success",
  "results": 50,
  "data": {
    "payrolls": [...]
  },
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
  "status": "fail",
  "message": "Payroll not found",
  "statusCode": 404
}
```

---

## i. Testing Considerations

1. **Unit Tests**: Test each service method with mocked Model
2. **Integration Tests**: Test routes with real database (test DB)
3. **Test Cases**:
   - Generate payroll for canteen with staff
   - Generate payroll for canteen without staff
   - Calculate with different attendance cases (100%, 95%, 90%, <90%)
   - Calculate with overtime hours
   - Calculate with late count exceeding maxLateAllowed
   - Adjust salary after calculated
   - Approve payroll with invalid status
   - Confirm payment when not yet approved
   - Delete approved payroll (should fail)
   - Set salary rate for new user vs update existing
   - Staff access my-salaries
   - Staff try to access other staff's salaries (should fail)
   - Cross-canteen access (should fail)

4. **Performance Tests**: Test with large number of staff (100+) in one payroll

5. **Edge Cases**:
   - Payroll period overlapping
   - Zero hours worked
   - Negative values
   - Very large numbers

---

## j. Migration & Data Integrity

1. **Initial Data**: Need to seed SalaryRate for all existing staff before generating first payroll
2. **Orphan Salaries**: If Payroll is deleted, related Salary records must also be deleted (handled in deletePayroll)
3. **Historical Data**: Keep paid payrolls for audit and reporting
4. **Backup**: Backup database before bulk operations
5. **Version Control**: Use version field in Payroll to track changes

---

## k. Future Enhancements

1. **Email Notifications**: Send email notifications when payroll is approved/paid
2. **Export**: Export payroll to Excel/PDF
3. **Payment Integration**: Integrate with banking system for automatic payment
4. **Advanced Reporting**: Detailed reports by month, quarter, year
5. **Tax Calculation**: Calculate personal income tax
6. **Payslip Generation**: Generate payslips for staff
7. **Multi-currency**: Support multiple currencies
8. **Overtime Approval**: Require approval for overtime hours
9. **Leave Management Integration**: Integrate with leave module
10. **Bonus Rules Engine**: Flexible bonus rules configuration

---

## l. Performance Benchmarks

**Expected Performance:**

- Generate payroll cho 50 nhân viên: < 5 seconds
- Get payroll list (paginated): < 500ms
- Calculate salary for 1 staff: < 1 second
- Approve payroll: < 1 second
- Confirm payment: < 1 second

**Optimization Strategies:**

- Use MongoDB aggregation pipeline
- Implement Redis caching for SalaryRate
- Use bulk operations where possible
- Optimize queries with proper indexes
- Consider background jobs for large payroll generation

---

## m. Deployment Considerations

1. **Environment Variables**:
   - JWT_SECRET
   - MONGODB_URI
   - Default bonus/deduction values

2. **Database Indexes**: Ensure all indexes are created in production

3. **Monitoring**: Log and monitor generatePayroll performance

4. **Backup Schedule**: Daily backup database

5. **Rollback Plan**: Có kế hoạch rollback nếu phát hiện lỗi sau khi generate payroll

---

This specification provides a comprehensive guide for understanding and working with the Payroll Management module, covering all aspects from architecture to deployment considerations.
