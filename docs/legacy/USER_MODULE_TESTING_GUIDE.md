# User Management Module - Testing Guide

## 🧪 Testing the Production-Ready User Module

### Prerequisites
- Backend API running at `https://leadcrm.vpsappserverone.in/api`
- Valid authentication token (login first)
- Admin or Manager role for full access

---

## 1️⃣ Test User List Page (`/users`)

### Test Scenarios:

#### A. **Initial Load**
✅ **Expected Behavior:**
- Page loads with user list from API
- Loading skeleton displays during fetch
- Users displayed in table format
- Stats cards show correct counts

**How to Test:**
1. Navigate to `/users`
2. Observe loading skeleton
3. Verify user list appears
4. Check stats cards (Total, Active, Inactive, Suspended)

---

#### B. **Search Functionality**
✅ **Expected Behavior:**
- Search filters users in real-time
- Search works across name, email, and phone

**How to Test:**
1. Type in search box: "sarah"
2. Verify only matching users show
3. Clear search with X button
4. Verify all users return

---

#### C. **Filter Functionality**
✅ **Expected Behavior:**
- Role filter (All, Admin, Manager, Sales Agent)
- Status filter (All, Active, Inactive, Suspended)
- Date joined filter
- Clear filters button works

**How to Test:**
1. Select "Admin" from role filter
2. Verify only admins show
3. Add status filter "Active"
4. Verify filters combine (AND logic)
5. Click "Clear Filters"
6. Verify all filters reset

---

#### D. **Create New User**
✅ **Expected Behavior:**
- Modal opens with blank form
- Form validation works
- API call creates user
- Success toast appears
- New user appears in list

**How to Test:**
1. Click "Add User" button
2. Fill in form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "+1 (555) 999-9999"
   - Role: "Sales Agent"
   - Department: "Sales"
3. Click "Create User"
4. Observe loading state
5. Verify success toast
6. Verify new user in list

**Test Validation:**
- Try submitting with empty name → Error message
- Try invalid email → Error message
- Try invalid phone → Error message

---

#### E. **Edit Existing User**
✅ **Expected Behavior:**
- Modal opens with pre-filled data
- Changes save via API
- Success toast appears
- User updates in list

**How to Test:**
1. Click three-dot menu on any user
2. Click "Edit User"
3. Change name to "Updated Name"
4. Click "Save Changes"
5. Verify success toast
6. Verify name updated in list

---

#### F. **Change User Status**
✅ **Expected Behavior:**
- Confirmation modal appears
- Status updates via API
- Success toast appears
- User row reflects new status

**How to Test:**
1. Click three-dot menu on active user
2. Click "Deactivate"
3. Confirm in modal
4. Verify success toast: "User deactivated successfully"
5. Verify status badge changed to "Inactive"
6. Test "Activate" on inactive user

---

#### G. **View User Profile**
✅ **Expected Behavior:**
- Navigates to `/users/{id}`
- User detail page loads

**How to Test:**
1. Click on any user row
2. Verify redirect to detail page

---

#### H. **Reset Password**
✅ **Expected Behavior:**
- Confirmation modal appears
- Success toast shows (email sent message)

**How to Test:**
1. Click three-dot menu
2. Click "Reset Password"
3. Confirm in modal
4. Verify success toast

---

## 2️⃣ Test User Detail Page (`/users/{id}`)

### Test Scenarios:

#### A. **Page Load**
✅ **Expected Behavior:**
- Loading spinner shows
- User profile loads from API
- All sections populate with data

**How to Test:**
1. Navigate to `/users/1`
2. Observe loading state
3. Verify profile header loads
4. Verify tabs exist (Overview, Activity)
5. Check all data displays

---

#### B. **Performance Metrics**
✅ **Expected Behavior:**
- Stats cards show correct numbers
- Monthly performance chart displays
- Conversion rate calculated

**How to Test:**
1. Check "Total Leads" card
2. Verify "Conversion Rate" shows percentage
3. Check monthly chart has data points

---

#### C. **Activity Log**
✅ **Expected Behavior:**
- Recent activities display
- Activities have icons and timestamps
- Formatted correctly

**How to Test:**
1. Scroll to activity section
2. Verify activities show with icons
3. Check timestamps are formatted
4. Verify activity types (login, lead_create, etc.)

---

#### D. **Error Handling**
✅ **Expected Behavior:**
- Invalid user ID shows error
- "Back to Users" button works

**How to Test:**
1. Navigate to `/users/99999`
2. Verify error message
3. Click "Back to Users"
4. Verify redirect to `/users`

---

## 3️⃣ Test Error Scenarios

### A. **Network Offline**
✅ **Expected Behavior:**
- Falls back to demo data
- No app crash
- Console warning logged

**How to Test:**
1. Open DevTools Network tab
2. Set to "Offline"
3. Refresh `/users` page
4. Verify demo data loads
5. Check console for warning message

---

### B. **API Error Response**
✅ **Expected Behavior:**
- Error toast displays
- Specific error message shown

**How to Test:**
1. Try creating user with duplicate email
2. Verify error toast shows backend message
3. Form stays open for correction

---

### C. **Validation Errors**
✅ **Expected Behavior:**
- Backend validation errors show in form
- Fields highlighted in red
- Error messages below fields

**How to Test:**
1. Submit create user with invalid data
2. Verify backend errors display properly

---

## 4️⃣ Test Toast Notifications

### Success Toasts:
- ✅ "User created successfully" - Green toast
- ✅ "User updated successfully" - Green toast
- ✅ "User activated successfully" - Green toast
- ✅ "User deactivated successfully" - Green toast
- ✅ "Password reset email sent..." - Green toast

### Error Toasts:
- ✅ "Failed to save user" - Red toast
- ✅ "Failed to perform action" - Red toast
- ✅ Backend error messages - Red toast

**How to Test:**
1. Perform each action above
2. Verify correct toast color and icon
3. Verify toast auto-dismisses after 3 seconds
4. Verify toast animation (slide up from bottom-right)

---

## 5️⃣ Test Responsive Design

### Desktop (1920px+)
- ✅ Full table visible
- ✅ All columns shown
- ✅ Stats in 4 columns

### Tablet (768px - 992px)
- ✅ Table scrolls horizontally
- ✅ Stats in 2 columns
- ✅ Filters stack

### Mobile (< 768px)
- ✅ Stats in single column
- ✅ Filters full width
- ✅ Actions dropdown works
- ✅ Modal full width

**How to Test:**
1. Use Chrome DevTools Device Toolbar
2. Test each breakpoint
3. Verify UI adapts properly

---

## 6️⃣ Performance Checks

### Page Load Speed
- ✅ Initial load < 2 seconds
- ✅ Subsequent navigation instant

### Search Performance
- ✅ Search results instant
- ✅ No lag with 100+ users

### Memory Leaks
- ✅ No memory leaks (AbortController cleanup)
- ✅ No console errors

**How to Test:**
1. Open Performance tab in DevTools
2. Record page load
3. Check for red flags
4. Navigate away and back
5. Verify cleanup happens

---

## 7️⃣ API Integration Verification

### Check Network Requests:

#### User List
```
GET /api/users
Response: { users: [...] } or { data: [...] }
Status: 200 OK
```

#### User Detail
```
GET /api/users/1
Response: { user: {...} }
Status: 200 OK
```

#### Create User
```
POST /api/users
Request: { name, email, phone, role, department, title, status, sendInvite }
Response: { message: "User created successfully", user: {...} }
Status: 201 Created
```

#### Update User
```
PUT /api/users/1
Request: { name, email, phone, role, ... }
Response: { message: "User updated successfully", user: {...} }
Status: 200 OK
```

#### Delete User (Soft Delete)
```
DELETE /api/users/1
Response: { message: "User deleted successfully" }
Status: 200 OK
```

**How to Test:**
1. Open Network tab in DevTools
2. Perform each action
3. Verify request/response format
4. Check status codes
5. Verify payloads match spec

---

## ✅ Test Checklist

### User List Page
- [ ] Initial load works
- [ ] Search functionality
- [ ] Role filter
- [ ] Status filter
- [ ] Date filter
- [ ] Clear filters
- [ ] Create user
- [ ] Edit user
- [ ] Change status
- [ ] Reset password
- [ ] View profile
- [ ] Pagination works

### User Detail Page
- [ ] Page loads correctly
- [ ] Profile data displays
- [ ] Performance metrics show
- [ ] Activity log displays
- [ ] Permissions display
- [ ] Back button works
- [ ] Error handling works

### Modal Forms
- [ ] Create modal opens
- [ ] Edit modal pre-fills
- [ ] Validation works
- [ ] Submit works
- [ ] Cancel works
- [ ] API errors show

### Toast Notifications
- [ ] Success toasts show
- [ ] Error toasts show
- [ ] Auto-dismiss works
- [ ] Animations smooth

### Error Handling
- [ ] Network errors handled
- [ ] API errors handled
- [ ] Validation errors handled
- [ ] Fallback data works
- [ ] No crashes

### Responsive Design
- [ ] Desktop layout good
- [ ] Tablet layout good
- [ ] Mobile layout good
- [ ] Touch interactions work

---

## 🐛 Known Issues to Watch

1. **Password Reset**: Shows success message but backend endpoint may not be implemented yet
2. **Demo Data Fallback**: Intentional - falls back to demo data when API unavailable
3. **Avatar Upload**: Not yet implemented

---

## 📊 Success Criteria

✅ **All tests pass without errors**  
✅ **API integration works correctly**  
✅ **User experience is smooth**  
✅ **Error handling is robust**  
✅ **Responsive design works on all devices**  
✅ **Performance is acceptable**  
✅ **No console errors**

---

## 🎯 Final Verification

Run this command to build and verify:
```bash
npm run build
```

Expected output:
```
✓ built in X seconds
✓ No errors
✓ Build successful
```

---

**Testing Date:** March 10, 2026  
**Tested By:** _______________  
**Status:** ✅ PASSED / ❌ FAILED  
**Notes:** _________________

