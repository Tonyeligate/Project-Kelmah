# CRITICAL FRONTEND ISSUES - ROOT CAUSE ANALYSIS & FIXES

**Date:** November 7, 2025  
**Status:** 🔴 CRITICAL ISSUES IDENTIFIED  
**Backend:** ✅ Working correctly  
**Frontend:** ❌ NOT sending correct filter parameters

---

## 🔍 Root Cause Analysis

### Issue #1: Search Filters NOT Applied

**Problem:** Searching for "electrician" returns welders, roofers, HVAC technicians

**Root Cause Found:**
1. ✅ Backend API works correctly - tested production endpoint
   ```bash
   curl "https://kelmah-user-service-eewy.onrender.com/api/workers?keywords=electrician"
   # Returns ONLY 2 electricians (Yaa Wiredu, Efua Mensah) ✅
   ```

2. ❌ Frontend `WorkerSearch.jsx` component has MISSING FILTER:
   - Has filters: `skills`, `minRating`, `maxRate`, `location`, `availability`, `experience`
   - MISSING: `primaryTrade` or `specialization` filter!
   - Result: Can't filter by trade (Electrical, Welding, Carpentry, etc.)

3. ❌ Frontend sends `search` parameter for text search
   - Backend accepts `keywords` or `search` ✅
   - Text search WORKS but trade filter MISSING

### Issue #2: Text Search Stuck Loading

**Root Cause:** Frontend calling wrong endpoint
- Frontend calls: `/api/users/workers/search`
- Should call: `/api/workers/search` OR `/api/workers` with `keywords` param
- API Gateway may not be routing `/api/users/workers/search` correctly

### Issue #3-7: Navigation Issues

**All caused by:**
- Hardcoded navigation targets
- Missing worker profile routes
- Incorrect button onClick handlers

---

## 🎯 Required Fixes

### FIX 1: Add Specialization/Trade Filter to WorkerSearch.jsx ⚠️ CRITICAL

**File:** `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx`

**Changes Needed:**

1. Add `primaryTrade` to filters state:
```javascript
const [filters, setFilters] = useState({
  skills: [],
  minRating: 0,
  maxRate: 100,
  location: '',
  availability: 'all',
  experience: 'all',
  primaryTrade: '', // ← ADD THIS
});
```

2. Add trade options:
```javascript
const tradeOptions = [
  'Electrical Work',
  'Plumbing Services',
  'Carpentry & Woodwork',
  'Painting & Decoration',
  'Masonry & Stonework',
  'Roofing Services',
  'HVAC & Climate Control',
  'Landscaping',
  'Construction & Building',
  'Welding Services',
  'Tiling & Flooring',
  'General Maintenance',
];
```

3. Update API call to include primaryTrade:
```javascript
const queryParams = new URLSearchParams({
  page: page.toString(),
  keywords: searchQuery, // Use 'keywords' instead of 'search'
  city: filters.location,
  primaryTrade: filters.primaryTrade,
  skills: filters.skills.join(','),
  minRating: filters.minRating,
  maxRate: filters.maxRate,
  availability: filters.availability !== 'all' ? filters.availability : undefined,
});
```

4. Add Trade filter UI in the filters dialog:
```jsx
<FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel>Trade/Specialization</InputLabel>
  <Select
    value={filters.primaryTrade}
    onChange={(e) => setFilters({ ...filters, primaryTrade: e.target.value })}
    label="Trade/Specialization"
  >
    <MenuItem value="">All Trades</MenuItem>
    {tradeOptions.map((trade) => (
      <MenuItem key={trade} value={trade}>
        {trade}
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

### FIX 2: Update API Endpoint Path

**Change from:**
```javascript
const response = await userServiceClient.get(
  `/api/users/workers/search?${queryParams}`,
);
```

**Change to:**
```javascript
const response = await userServiceClient.get(
  `/api/workers?${queryParams.toString()}`,
);
```

### FIX 3: Add Worker Profile Route

**File:** `kelmah-frontend/src/routes/index.jsx` (or equivalent)

**Add route:**
```jsx
{
  path: '/workers/:id',
  element: <WorkerProfilePage />,
}
```

### FIX 4: Fix View Profile Button

**File:** `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx`

**Find View Profile button and update:**
```jsx
<Button
  variant="outlined"
  startIcon={<ViewIcon />}
  onClick={() => navigate(`/workers/${worker.id}`)} // ← Use navigate, not window.location
  fullWidth
>
  View Profile
</Button>
```

### FIX 5: Fix Sort Dropdown

**Add state preservation:**
```javascript
const handleSortChange = (sortType) => {
  setSortBy(sortType);
  // DON'T reset filters or searchQuery here
  fetchWorkers(); // Re-fetch with current filters + new sort
};
```

### FIX 6: Fix Clear Filters Button

**Update to reset filters without navigation:**
```javascript
const handleClearFilters = () => {
  setFilters({
    skills: [],
    minRating: 0,
    maxRate: 100,
    location: '',
    availability: 'all',
    experience: 'all',
    primaryTrade: '',
  });
  setSearchQuery('');
  setPage(1);
  // DON'T navigate away - just reset state
};
```

---

## 📊 Verification Tests

**After fixes, test these scenarios:**

1. **Trade Filter Test:**
   ```
   - Select "Electrical Work" from trade filter
   - Should show ONLY electricians (Yaa Wiredu, Efua Mensah)
   - NOT welders, roofers, HVAC techs
   ```

2. **Text Search Test:**
   ```
   - Search for "electrician"
   - Should show ONLY electricians
   - Text search + trade filter should work together
   ```

3. **Location + Trade Test:**
   ```
   - Select location: "Accra"
   - Select trade: "Welding Services"
   - Should show ONLY Accra welders (Esi Darko)
   ```

4. **Navigation Test:**
   ```
   - Click "View Profile" → Should go to /workers/:id
   - Click sort → Should NOT clear search
   - Click filters panel → Should NOT clear search
   - Click "Clear Filters" → Should stay on same page
   ```

---

## 🚀 Implementation Priority

1. **CRITICAL (Do First):** Add `primaryTrade` filter to WorkerSearch.jsx
2. **CRITICAL:** Update API endpoint path
3. **HIGH:** Fix View Profile navigation
4. **HIGH:** Add Worker Profile route
5. **MEDIUM:** Fix sort/filter state preservation
6. **MEDIUM:** Fix Clear Filters button

---

## 📝 Current Working Endpoints (Verified)

✅ **GET** `/api/workers?keywords=electrician`
- Returns: Only electricians (2 workers)
- Status: WORKING IN PRODUCTION

✅ **GET** `/api/workers?primaryTrade=Welding Services`
- Returns: Only welders
- Status: WORKING (needs frontend implementation)

✅ **GET** `/api/workers?city=Accra&primaryTrade=Carpentry & Woodwork`
- Returns: Only Accra carpenters
- Status: WORKING (needs frontend implementation)

---

## 🎯 Success Criteria

- [ ] Searching "electrician" returns ONLY electricians
- [ ] Trade filter dropdown exists and works
- [ ] Combined filters work (location + trade + rating)
- [ ] View Profile button navigates to worker profile page
- [ ] Sort doesn't clear search context
- [ ] Filter panel doesn't clear search
- [ ] Clear Filters stays on same page
- [ ] All 20 workers load without filters
