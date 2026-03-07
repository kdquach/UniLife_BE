/**
 * Voucher Module V6 - Comprehensive Test Script
 * Chạy: node src/scripts/testVoucher.js
 */

const BASE = "http://localhost:5000/api";

// ============ UTILITIES ============
async function post(url, body, token) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function get(url, token) {
  const res = await fetch(`${BASE}${url}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("json")) {
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }
  // For file downloads
  return {
    status: res.status,
    data: { raw: true, size: (await res.arrayBuffer()).byteLength },
  };
}

async function patch(url, body, token) {
  const res = await fetch(`${BASE}${url}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function del(url, token) {
  const res = await fetch(`${BASE}${url}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 204) return { status: 204, data: {} };
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;
const failures = [];

function assert(testName, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName} ${detail}`);
    failed++;
    failures.push({ testName, detail });
  }
}

// ============ MAIN TEST ============
async function run() {
  console.log("=".repeat(60));
  console.log("  VOUCHER MODULE V6 - COMPREHENSIVE TEST");
  console.log("=".repeat(60));

  // ---- LOGIN ----
  console.log("\n📌 STEP 0: Login Admin & Manager");
  const adminLogin = await post("/auth/login", {
    email: "admin@unilife.com",
    password: "123456",
  });
  const adminToken = adminLogin.data.token;
  assert(
    "Admin login",
    adminLogin.status === 200 && adminToken,
    `status=${adminLogin.status}`,
  );

  const managerLogin = await post("/auth/login", {
    email: "manager@unilife.com",
    password: "123456",
  });
  const managerToken = managerLogin.data.token;
  assert(
    "Manager login",
    managerLogin.status === 200 && managerToken,
    `status=${managerLogin.status}`,
  );

  if (!adminToken || !managerToken) {
    console.log("\n⛔ Cannot proceed without tokens. Aborting.");
    return;
  }

  // Get manager's canteenId from profile
  const adminProfile = await get("/users/me", adminToken);
  const managerProfile = await get("/users/me", managerToken);
  const managerCanteenId = managerProfile.data?.data?.user?.canteenId;
  console.log(`  ℹ️  Manager canteenId: ${managerCanteenId || "N/A"}`);

  // Get a valid canteenId from the system
  const canteensRes = await get("/canteens", adminToken);
  const canteens = canteensRes.data?.data || [];
  const firstCanteenId = canteens[0]?._id || managerCanteenId;
  const secondCanteenId = canteens[1]?._id || firstCanteenId;
  console.log(`  ℹ️  Using canteen IDs: ${firstCanteenId}, ${secondCanteenId}`);

  // ============================================
  // SECTION 1: CRUD & Validation
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 SECTION 1: CRUD & Validation");
  console.log("=".repeat(60));

  // --- Test 1.1: Generate Code (BR01) ---
  console.log("\n🔹 1.1 Auto-generate Code (BR01)");
  const genCode1 = await get("/vouchers/generate-code", adminToken);
  const genCode2 = await get("/vouchers/generate-code", adminToken);
  assert("Generate code returns 200", genCode1.status === 200);
  assert(
    "Code is 8 chars uppercase/digits",
    /^[A-Z0-9]{8}$/.test(genCode1.data?.data?.code),
    `code=${genCode1.data?.data?.code}`,
  );
  assert(
    "Two codes are different (unique)",
    genCode1.data?.data?.code !== genCode2.data?.data?.code,
  );

  // --- Test 1.2: Create Voucher - Percentage (F-03, Admin) ---
  console.log("\n🔹 1.2 Create Voucher - Percentage (Admin)");
  const futureStart = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
  const futureEnd = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString(); // 7 days from now

  const createPercentRes = await post(
    "/vouchers",
    {
      code: "TEST_PCT_01",
      name: "Test Percentage Voucher",
      internalDescription: "Test internal",
      displayDescription: "Giảm 20% tối đa 50k",
      scope: "Global",
      discountType: "Percentage",
      discountValue: 20,
      maxDiscountCap: 50000,
      minOrderValue: 30000,
      minItemQuantity: 1,
      applyTo: "All items",
      totalLimit: 100,
      usagePerUser: 3,
      startDatetime: futureStart,
      endDatetime: futureEnd,
    },
    adminToken,
  );
  assert(
    "Create % voucher - 201",
    createPercentRes.status === 201,
    `status=${createPercentRes.status} ${JSON.stringify(createPercentRes.data?.message || createPercentRes.data)}`,
  );
  const pctVoucherId = createPercentRes.data?.data?.voucher?._id;
  assert("Voucher has _id", !!pctVoucherId);
  assert(
    "State is Draft",
    createPercentRes.data?.data?.voucher?.state === "Draft",
  );

  // --- Test 1.3: Create Voucher - Fixed Amount (F-03, Admin) ---
  console.log("\n🔹 1.3 Create Voucher - Fixed Amount (Admin)");
  const createFixedRes = await post(
    "/vouchers",
    {
      code: "TEST_FIX_01",
      name: "Test Fixed Voucher",
      displayDescription: "Giảm 15k",
      scope: "Branch",
      canteen_ids: [firstCanteenId],
      discountType: "Fixed Amount",
      discountValue: 15000,
      minOrderValue: 20000,
      applyTo: "All items",
      totalLimit: 50,
      usagePerUser: 2,
      startDatetime: futureStart,
      endDatetime: futureEnd,
    },
    adminToken,
  );
  assert(
    "Create Fixed voucher - 201",
    createFixedRes.status === 201,
    `status=${createFixedRes.status} ${JSON.stringify(createFixedRes.data?.message || createFixedRes.data)}`,
  );
  const fixedVoucherId = createFixedRes.data?.data?.voucher?._id;

  // --- Test 1.4: Validation Errors ---
  console.log("\n🔹 1.4 Validation Errors");
  // Missing code
  const noCode = await post(
    "/vouchers",
    {
      name: "No Code",
      scope: "Global",
      discountType: "Percentage",
      discountValue: 10,
      maxDiscountCap: 10000,
      applyTo: "All items",
      startDatetime: futureStart,
      endDatetime: futureEnd,
    },
    adminToken,
  );
  assert(
    "Missing code -> error",
    noCode.status >= 400,
    `status=${noCode.status}`,
  );

  // endDatetime before startDatetime
  const badDates = await post(
    "/vouchers",
    {
      code: "BAD_DATE",
      name: "Bad Date",
      scope: "Global",
      discountType: "Fixed Amount",
      discountValue: 5000,
      applyTo: "All items",
      startDatetime: futureEnd,
      endDatetime: futureStart, // end before start
    },
    adminToken,
  );
  assert(
    "endDate < startDate -> error",
    badDates.status >= 400,
    `status=${badDates.status}`,
  );

  // Duplicate code
  const dupCode = await post(
    "/vouchers",
    {
      code: "TEST_PCT_01", // same as first
      name: "Duplicate",
      scope: "Global",
      discountType: "Fixed Amount",
      discountValue: 5000,
      applyTo: "All items",
      startDatetime: futureStart,
      endDatetime: futureEnd,
    },
    adminToken,
  );
  assert(
    "Duplicate code -> error",
    dupCode.status >= 400,
    `status=${dupCode.status}`,
  );

  // --- Test 1.5: Edit Voucher (F-04) ---
  console.log("\n🔹 1.5 Edit Voucher in Draft state");
  if (pctVoucherId) {
    const editRes = await patch(
      `/vouchers/${pctVoucherId}`,
      {
        name: "Updated Percentage Voucher",
        discountValue: 25,
      },
      adminToken,
    );
    assert(
      "Edit Draft voucher - 200",
      editRes.status === 200,
      `status=${editRes.status} ${JSON.stringify(editRes.data?.message)}`,
    );
    assert(
      "Name updated",
      editRes.data?.data?.voucher?.name === "Updated Percentage Voucher",
    );
  }

  // --- Test 1.6: Delete Voucher (F-10) ---
  console.log("\n🔹 1.6 Delete Voucher");
  // Create a temp voucher to delete
  const tempVoucher = await post(
    "/vouchers",
    {
      code: "DEL_TEST_01",
      name: "To Be Deleted",
      scope: "Global",
      discountType: "Fixed Amount",
      discountValue: 1000,
      applyTo: "All items",
      startDatetime: futureStart,
      endDatetime: futureEnd,
    },
    adminToken,
  );
  const tempId = tempVoucher.data?.data?.voucher?._id;
  if (tempId) {
    const delRes = await del(`/vouchers/${tempId}`, adminToken);
    assert(
      "Delete Draft voucher - 204",
      delRes.status === 204,
      `status=${delRes.status}`,
    );
  }

  // ============================================
  // SECTION 2: State Machine (Vòng đời)
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 SECTION 2: State Machine");
  console.log("=".repeat(60));

  // --- Test 2.1: Publish (Draft -> Upcoming) ---
  console.log("\n🔹 2.1 Publish (Draft -> Upcoming)");
  if (pctVoucherId) {
    const pubRes = await patch(
      `/vouchers/${pctVoucherId}/publish`,
      null,
      adminToken,
    );
    assert(
      "Publish - 200",
      pubRes.status === 200,
      `status=${pubRes.status} ${JSON.stringify(pubRes.data?.message)}`,
    );
    assert(
      "State is Upcoming",
      pubRes.data?.data?.voucher?.state === "Upcoming",
      `state=${pubRes.data?.data?.voucher?.state}`,
    );
  }

  // --- Test 2.2: Publish already published -> error ---
  console.log("\n🔹 2.2 Publish when not Draft -> error");
  if (pctVoucherId) {
    const pubAgain = await patch(
      `/vouchers/${pctVoucherId}/publish`,
      null,
      adminToken,
    );
    assert(
      "Publish Upcoming -> error",
      pubAgain.status >= 400,
      `status=${pubAgain.status}`,
    );
  }

  // --- Test 2.3: Edit restrictions in Upcoming state (BR04) ---
  console.log("\n🔹 2.3 Edit Upcoming voucher (full edit allowed)");
  if (pctVoucherId) {
    const editUpcoming = await patch(
      `/vouchers/${pctVoucherId}`,
      {
        name: "Edited While Upcoming",
      },
      adminToken,
    );
    assert(
      "Edit Upcoming - should succeed",
      editUpcoming.status === 200,
      `status=${editUpcoming.status} ${JSON.stringify(editUpcoming.data?.message)}`,
    );
  }

  // --- Test 2.4: Create a voucher to test Active state transitions ---
  console.log("\n🔹 2.4 Simulate Active -> Deactivate -> Reactivate");
  // Create a voucher with past start time to manually set Active
  const activeTestVoucher = await post(
    "/vouchers",
    {
      code: "ACT_TEST_01",
      name: "Active Test",
      scope: "Global",
      discountType: "Fixed Amount",
      discountValue: 5000,
      applyTo: "All items",
      startDatetime: futureStart,
      endDatetime: futureEnd,
      totalLimit: 10,
    },
    adminToken,
  );
  const activeTestId = activeTestVoucher.data?.data?.voucher?._id;

  if (activeTestId) {
    // Publish
    await patch(`/vouchers/${activeTestId}/publish`, null, adminToken);

    // We can't easily make it Active without cron, so let's test deactivate on an Upcoming voucher (should fail)
    const deactUpcoming = await patch(
      `/vouchers/${activeTestId}/deactivate`,
      null,
      adminToken,
    );
    assert(
      "Deactivate Upcoming -> error",
      deactUpcoming.status >= 400,
      `status=${deactUpcoming.status}`,
    );
  }

  // --- Test 2.5: Clone Voucher (F-05) ---
  console.log("\n🔹 2.5 Clone Voucher (F-05)");
  if (pctVoucherId) {
    const cloneRes = await post(
      `/vouchers/${pctVoucherId}/clone`,
      {},
      adminToken,
    );
    assert(
      "Clone - 200",
      cloneRes.status === 200,
      `status=${cloneRes.status} ${JSON.stringify(cloneRes.data?.message)}`,
    );
    assert(
      "Cloned state is Draft",
      cloneRes.data?.data?.voucher?.state === "Draft",
    );
    assert(
      "Cloned usedCount = 0",
      cloneRes.data?.data?.voucher?.usedCount === 0,
    );
    assert("Cloned has no code (reset)", !cloneRes.data?.data?.voucher?.code);
    assert(
      "Cloned has no startDatetime",
      !cloneRes.data?.data?.voucher?.startDatetime,
    );
  }

  // --- Test 2.6: Archive from wrong state -> error ---
  console.log("\n🔹 2.6 Archive from wrong state");
  if (pctVoucherId) {
    const archiveUpcoming = await patch(
      `/vouchers/${pctVoucherId}/archive`,
      null,
      adminToken,
    );
    assert("Archive Upcoming -> error", archiveUpcoming.status >= 400);
  }

  // ============================================
  // SECTION 3: Listing & Filters
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 SECTION 3: Listing & Filters");
  console.log("=".repeat(60));

  // --- Test 3.1: Admin sees all ---
  console.log("\n🔹 3.1 Admin list all vouchers");
  const adminList = await get("/vouchers", adminToken);
  assert("Admin list - 200", adminList.status === 200);
  assert("Admin list has data", Array.isArray(adminList.data?.data));
  const adminVoucherCount = adminList.data?.data?.length || 0;
  console.log(`    Total vouchers visible to Admin: ${adminVoucherCount}`);

  // --- Test 3.2: Manager sees filtered list ---
  console.log("\n🔹 3.2 Manager list (role-based filter)");
  const managerList = await get("/vouchers", managerToken);
  assert("Manager list - 200", managerList.status === 200);
  const managerVoucherCount = managerList.data?.data?.length || 0;
  console.log(`    Total vouchers visible to Manager: ${managerVoucherCount}`);

  // --- Test 3.3: Search by code ---
  console.log("\n🔹 3.3 Search vouchers by code");
  const searchRes = await get("/vouchers?search=TEST_PCT", adminToken);
  assert("Search - 200", searchRes.status === 200);
  assert(
    "Search found results",
    (searchRes.data?.data?.length || 0) > 0,
    `count=${searchRes.data?.data?.length}`,
  );

  // --- Test 3.4: Filter by state ---
  console.log("\n🔹 3.4 Filter by state");
  const filterDraft = await get("/vouchers?state=Draft", adminToken);
  assert("Filter Draft - 200", filterDraft.status === 200);

  const filterUpcoming = await get("/vouchers?state=Upcoming", adminToken);
  assert("Filter Upcoming - 200", filterUpcoming.status === 200);

  // --- Test 3.5: Detail view with stats (F-02) ---
  console.log("\n🔹 3.5 Detail view with stats (F-02)");
  if (pctVoucherId) {
    const detailRes = await get(`/vouchers/${pctVoucherId}`, adminToken);
    assert(
      "Detail - 200",
      detailRes.status === 200,
      `status=${detailRes.status} ${JSON.stringify(detailRes.data)}`,
    );
    assert("Has voucher data", !!detailRes.data?.data?.voucher);
    assert("Has statistics", !!detailRes.data?.data?.statistics);
    assert(
      "Statistics has usageDisplay",
      !!detailRes.data?.data?.statistics?.usageDisplay,
    );
    console.log(`    Usage: ${detailRes.data?.data?.statistics?.usageDisplay}`);
  }

  // ============================================
  // SECTION 4: Public API & Validate
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 SECTION 4: Public API & Validate");
  console.log("=".repeat(60));

  // --- Test 4.1: Get active vouchers (public) ---
  console.log("\n🔹 4.1 Get active vouchers (public)");
  const activeRes = await get("/vouchers/active");
  assert("Active vouchers - 200", activeRes.status === 200);

  // --- Test 4.2: Validate a voucher code ---
  console.log("\n🔹 4.2 Validate voucher (not active yet -> should fail)");
  const validateRes = await post(
    "/vouchers/validate",
    {
      code: "TEST_PCT_01",
      orderTotal: 50000,
      items: [
        { productId: "aaa", productName: "item", quantity: 2, price: 25000 },
      ],
      canteenId: firstCanteenId,
    },
    adminToken,
  );
  // Voucher is in Upcoming state, not Active, so validation should fail
  assert(
    "Validate non-Active -> error",
    validateRes.status >= 400,
    `status=${validateRes.status} msg=${JSON.stringify(validateRes.data?.message)}`,
  );

  // ============================================
  // SECTION 5: Usage History & Export
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 SECTION 5: Usage History & Export");
  console.log("=".repeat(60));

  // --- Test 5.1: My usage ---
  console.log("\n🔹 5.1 My usage history");
  const myUsage = await get("/vouchers/my-usage", adminToken);
  assert("My usage - 200", myUsage.status === 200);

  // --- Test 5.2: Voucher usage history ---
  console.log("\n🔹 5.2 Voucher usage history");
  if (pctVoucherId) {
    const usageHist = await get(
      `/vouchers/${pctVoucherId}/usage-history`,
      adminToken,
    );
    assert("Usage history - 200", usageHist.status === 200);
  }

  // --- Test 5.3: Voucher stats ---
  console.log("\n🔹 5.3 Voucher stats");
  if (pctVoucherId) {
    const statsRes = await get(`/vouchers/${pctVoucherId}/stats`, adminToken);
    assert(
      "Stats - 200",
      statsRes.status === 200,
      `status=${statsRes.status} ${JSON.stringify(statsRes.data)}`,
    );
  }

  // --- Test 5.4: Export ---
  console.log("\n🔹 5.4 Export usage report (XLSX)");
  const exportRes = await get("/vouchers/export?format=xlsx", adminToken);
  assert(
    "Export XLSX - 200",
    exportRes.status === 200,
    `status=${exportRes.status}`,
  );

  const exportCsv = await get("/vouchers/export?format=csv", adminToken);
  assert(
    "Export CSV - 200",
    exportCsv.status === 200,
    `status=${exportCsv.status}`,
  );

  // ============================================
  // SECTION 6: Edge Cases & Permission Guards
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 SECTION 6: Edge Cases & Permission Guards");
  console.log("=".repeat(60));

  // --- Test 6.1: Unauthenticated access ---
  console.log("\n🔹 6.1 Unauthenticated access");
  const noAuthList = await get("/vouchers");
  assert(
    "List without token -> 401",
    noAuthList.status === 401,
    `status=${noAuthList.status}`,
  );

  const noAuthCreate = await post("/vouchers", { code: "HACK" });
  assert(
    "Create without token -> 401",
    noAuthCreate.status === 401,
    `status=${noAuthCreate.status}`,
  );

  // --- Test 6.2: Non-existing voucher ---
  console.log("\n🔹 6.2 Non-existing voucher");
  const fakeId = "aaaaaaaaaaaaaaaaaaaaaaaa"; // 24 hex chars
  const notFound = await get(`/vouchers/${fakeId}`, adminToken);
  assert(
    "Get non-existing -> 404",
    notFound.status === 404,
    `status=${notFound.status}`,
  );

  const cloneNotFound = await post(`/vouchers/${fakeId}/clone`, {}, adminToken);
  assert(
    "Clone non-existing -> 404",
    cloneNotFound.status === 404,
    `status=${cloneNotFound.status}`,
  );

  const pubNotFound = await patch(
    `/vouchers/${fakeId}/publish`,
    null,
    adminToken,
  );
  assert(
    "Publish non-existing -> 404",
    pubNotFound.status === 404,
    `status=${pubNotFound.status}`,
  );

  // --- Test 6.3: Delete used voucher -> should fail (if usedCount > 0) ---
  console.log("\n🔹 6.3 Cannot delete non-Draft voucher");
  if (pctVoucherId) {
    const delPublished = await del(`/vouchers/${pctVoucherId}`, adminToken);
    assert(
      "Delete Upcoming voucher -> error",
      delPublished.status >= 400,
      `status=${delPublished.status}`,
    );
  }

  // ============================================
  // CLEANUP
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("🧹 CLEANUP: Removing test vouchers");
  console.log("=".repeat(60));

  // Delete remaining test vouchers that are in Draft state
  if (fixedVoucherId) {
    const d = await del(`/vouchers/${fixedVoucherId}`, adminToken);
    console.log(`  Fixed voucher delete: ${d.status}`);
  }
  // pctVoucherId is Upcoming now - cannot delete (expected)
  // activeTestId is Upcoming now - cannot delete

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Total:  ${passed + failed}`);
  if (failures.length > 0) {
    console.log("\n  Failed tests:");
    failures.forEach((f, i) => {
      console.log(`    ${i + 1}. ${f.testName} — ${f.detail}`);
    });
  }
  console.log("=".repeat(60));
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
