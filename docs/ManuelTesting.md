**Feature** Authentication

**Test requirement** Verify that all user authentication functions, including login, registration, forgot password, and OTP confirmation, work as intended.
**Reference
Document**
Pass Fail Untested N/A Number of Test cases
32 0 0 0 32

```
ID Test Case Description Test Case Procedure Expected Results Actual Results Inter-test case
Dependence
```

```
Result Test date Tester Note
```

**Login**
Login-01 Verify Login page displays all elements 1. Open the browser and navigate to the Login page.

2. Wait for the page to load completely.
3. Check that the page displays: title, Email field, Password field,
   “Forgot Password?” link, “Log In” button, and “Log In via Google”
   button.

```
Page shows all UI elements correctly. Page displays all UI elements correctly. None Pass 14/7/2025Vo Vu Luan
```

Login-02 Validate required fields (Email & Password) 1. Open the Login page.

2. Leave both Email and Password fields empty.
3. Click the “Log In” button.
4. Observe the validation message.

```
Error message appears for required fields; no login performed. Error message appears for required fields; no login performed.Login-01 Pass 14/7/2025Vo Vu Luan
```

Login-03 Validate invalid email format 1. Open the Login page.

2. Enter an invalid email (e.g., abc@) in the Email field.
3. Enter any password.
4. Click the “Log In” button.
5. Observe the validation message.

```
“Invalid email format” message is displayed; no login
performed.
```

```
“Invalid email format” message is displayed; no login
performed.
```

```
Login-01 Pass 14/7/2025Vo Vu Luan
```

Login-04 Verify login with incorrect email or password 1. Open the Login page.

2. Enter an incorrect email.
3. Enter an incorrect password.
4. Click the “Log In” button.
5. Observe the validation message.

```
System displays error message: “Incorrect email or password”. System displays error message: “Incorrect email or
password”.
```

```
Login-01 Pass 14/7/2025Vo Vu Luan
```

Login-05 Successful login & role-based redirect 1. Open the Login page.

2. Enter valid credentials for a registered account.
3. Click the “Log In” button.
4. Observe the redirection.

```
Login succeeds; user is redirected to the appropriate dashboard
(Freelancer/Customer).
```

```
Login succeeds; user is redirected to the appropriate
dashboard (Freelancer/Customer).
```

```
Login-01 Pass 14/7/2025Vo Vu Luan
```

Login-06 Google Sign-In (OAuth) 1. Open the Login page.

2. Click the “Log In via Google” button.
3. Select a Google account.
4. Grant permissions.
5. Observe the login or account creation process.

```
Linked account: logged in & redirected; New account: created
(verified) then logged in & redirected.
```

```
Linked account: logged in & redirected; New account: created
(verified) then logged in & redirected.
```

```
Login-01 Pass 15/7/2025Vo Vu Luan
```

Login-07 Login with a disabled account 1. Open the login page.

2. Enter the credentials of a disabled account.
3. Click the “Log In” button.
4. Observe the result.

```
“Account disabled” message is displayed; no login performed. “Account disabled” message is displayed; no login performed. Login-01 Pass 15/7/2025Vo Vu Luan
```

Login-08 Login with an account pending OTP confirmation 1. Open the login page.

2. Enter the credentials of an account with the status “Pending OTP
   confirmation”.
3. Click the “Log In” button.
4. Observe the redirection behavior.

```
System redirects to “OTP Confirmation” page. Upon entering the
correct OTP, account becomes Active and user is logged in
successfully.
```

```
System redirects to “OTP Confirmation” page. Upon entering
the correct OTP, account becomes Active and user is logged in
successfully.
```

```
Login-01 Pass 15/7/2025Vo Vu Luan
```

**Register**
Reg-01 Verify Register page renders correctly 1. Open the Register page.

2. Wait for page to load.
3. Verify presence of role selector, Email, Password, Confirm
   Password, Register button.

```
All UI elements are visible and enabled. All UI elements are visible and enabled. None Pass 16/7/2025Vo Vu Luan
```

Reg-02 Required fields validation 1. Leave Email/Password/Confirm empty.

2. Click Register.
3. Observe messages.

```
Required-field errors shown; form not submitted. Required-field errors shown; form not submitted. Reg-01 Pass 16/7/2025Vo Vu Luan
```

Reg-03 Invalid email format 1. Enter abc@ as Email.

2. Enter any Password and matching Confirm.
3. Click Register.

```
“Invalid email format”; no account created. “Invalid email format”; no account created. Reg-01 Pass 16/7/2025Vo Vu Luan
```

Reg-04 Password policy (too weak) 1. Enter a valid Email.

2. Enter weak Password (e.g., 12345) and match Confirm.
3. Click Register.

```
Password strength error; account not created. Password strength error; account not created. Reg-01 Pass 17/7/2025Vo Vu Luan
```

Reg-05 Password mismatch 1. Enter valid Email.

2. Password=Abc12345.
3. Confirm=Abc1234x.
4. Click Register.

```
“Passwords do not match”; account not created. “Passwords do not match”; account not created. Reg-01 Pass 17/7/2025Vo Vu Luan
```

Reg-06 Account type selection 1. Deselect default role if possible / change roles Freelancer and
Customer.

2. Submit with valid fields.
3. Inspect payload / created account role.

```
Submitted role matches user’s selection (Freelancer/Customer).Submitted role matches user’s selection
(Freelancer/Customer).
```

```
Reg-01 Pass 17/7/2025Vo Vu Luan
```

Reg-07 Duplicate email 1. Enter an already-registered Email.

2. Enter valid Password/Confirm.
3. Click Register.

```
Message “Email already exists”; account not created. Message “Email already exists”; account not created. Reg-01 Pass 18/7/2025Vo Vu Luan
```

Reg-08 Successful registration → OTP page 1. Enter new valid Email.

2. Enter strong Password and matching Confirm.
3. Click Register.

```
System validates inputs, creates pending account, sends OTP to
email, and navigates to OTP verification page.
```

```
System validates inputs, creates pending account, sends OTP
to email, and navigates to OTP verification page.
```

```
Reg-01 Pass 18/7/2025Vo Vu Luan
```

Reg-09 Google Sign-In creates a new account 1. Click Log In via Google+ and choose a Google account not in DB.

2. Grant consent.
3. Observe post-auth flow.

```
System creates a new verified account from Google profile and
signs user in (or routes to profile completion if required).
```

```
System creates a new verified account from Google profile
and signs user in (or routes to profile completion if required).
```

```
Reg-01 Pass 18/7/2025Vo Vu Luan
```

**Forgot Password**

FP-01 Verify Forgot Password page renders all elements 1. Open the Forgot Password page from Login.

2. Wait for the page to load.
3. Observe Email field and Submit button.

```
Page displays Email input and Submit; breadcrumbs shown. Page displays Email input and Submit; breadcrumbs shown. None Pass 19/7/2025Vo Vu Luan
```

FP-02 Required field validation 1. Leave Email empty.

2. Click Submit.
3. Observe validation.

```
Required-field error shown; request not sent. Required-field error shown; request not sent. FP-01 Pass 19/7/2025Vo Vu Luan
```

FP-03 Invalid email format 1. Enter abc@ in Email.

2. Click Submit.
3. Observe validation.

```
“Invalid email format” message; request not sent. “Invalid email format” message; request not sent. FP-01 Pass 19/7/2025Vo Vu Luan
```

FP-04 Email not found 1. Enter an email not in DB.

2. Click Submit.
3. Observe response.

```
Message “Email not found”; no OTP is generated. Message “Email not found”; no OTP is generated. FP-01 Pass 19/7/2025Vo Vu Luan
```

FP-05 Send OTP successfully 1. Enter a registered email.

2. Click Submit.
3. Observe navigation.

```
System sends OTP to email and opens OTP Verification page. System sends OTP to email and opens OTP Verification page.FP-01 Pass 20/7/2025Vo Vu Luan
```

FP-06 Set new password — invalid policy 1. After OTP success, go to Set New Password page.

2. Enter weak password (e.g., 12345) and confirm same.
3. Click Submit.

```
Policy error shown (too weak); password not updated. Policy error shown (too weak); password not updated. FP-05 Pass 20/7/2025Vo Vu Luan
```

FP-07 Set new password — mismatch 1. Enter Abc12345 and confirm Abc1234x.

2. Click Submit.
3. Observe validation.

```
“Passwords do not match”; password not updated. “Passwords do not match”; password not updated. FP-05 Pass 20/7/2025Vo Vu Luan
```

FP-08 Successful password reset end-to-end 1. Enter registered email → receive OTP.

2. Enter correct OTP within validity.
3. Set a strong matching new password and submit.

```
Password updated; success confirmation page shown; user can
log in with the new password.
```

```
Password updated; success confirmation page shown; user
can log in with the new password.
```

```
FP-05 Pass 20/7/2025Vo Vu Luan
```

**Confirm OTP**

COTP-01 Page renders all elements 1. Navigate to Confirm OTP after Register/Forgot Password.

2. Wait for load.
3. Verify OTP input, Verify button, Resend code button, and
   countdown/timer.

```
All elements visible & enabled appropriately; timer shows
remaining time.
```

```
All elements visible & enabled appropriately; timer shows
remaining time.
```

```
None Pass 21/7/2025Vo Vu Luan
```

COTP-02 Required field validation 1. Leave OTP empty.

2. Click Verify.
3. Observe validation.

```
Required error displayed; request not sent. Required error displayed; request not sent. COTP-01 Pass 21/7/2025Vo Vu Luan
```

COTP-03 Correct OTP — Register flow 1. From Register, enter the correct OTP within validity.

2. Click Verify.
3. Observe redirect.

```
Account becomes Active; success notice; redirect to sign-in or
dashboard per business rule.
```

```
Account becomes Active; success notice; redirect to sign-in or
dashboard per business rule.
```

```
Reg-08 Pass 21/7/2025Vo Vu Luan
```

COTP-04 Correct OTP — Forgot Password flow 1. From Forgot Password, enter correct OTP.

2. Click Verify.
3. Observe redirect.

```
Redirect to Set New Password page; session/nonce bound to the
email.
```

```
Redirect to Set New Password page; session/nonce bound to
the email.
```

```
FP-05 Pass 22/7/2025Vo Vu Luan
```

COTP-05 Wrong OTP 1. Enter an incorrect OTP.

2. Click Verify.
3. Observe feedback.

```
Error “Incorrect OTP”; stay on page; allow retry. Error “Incorrect OTP”; stay on page; allow retry. COTP-01 Pass 22/7/2025Vo Vu Luan
```

COTP-06 Expired OTP 1. Wait until countdown ends (OTP TTL passes). Message “OTP expired”. Message “OTP expired”. COTP-01 Pass 22/7/2025Vo Vu Luan

COTP-07 Resend OTP — success 1. Click Resend code after timer allows.

2. Check email for new OTP.
3. Enter new OTP and verify.

```
New OTP delivered; only latest OTP valid; verification succeeds
with new code.
```

```
New OTP delivered; only latest OTP valid; verification
succeeds with new code.
```

```
COTP-01 Pass 23/7/2025Vo Vu Luan
```
