# IndexedDB Migration - Testing Checklist

> **Purpose:** Manual testing guide for validating the IndexedDB migration
> **Last Updated:** February 2026

---

## Pre-Testing Setup

1. Open DevTools → Application tab
2. Note the IndexedDB section (should show `focus-tools` database)
3. Have console open to watch for `[IDB]` and `[Storage]` log messages

---

## Test Scenarios

### 1. Fresh Install (New User)

**Steps:**
1. Clear all site data: DevTools → Application → Storage → "Clear site data"
2. Refresh the app
3. Create a task with steps
4. Add task to Focus Queue
5. Complete a step
6. Refresh the app

**Expected:**
- [ ] Console shows `[IDB] Fresh install - initialized IndexedDB`
- [ ] IndexedDB `focus-tools` database created with all stores
- [ ] `appState` record has `migratedFromLocalStorage: true`
- [ ] Task persists after refresh
- [ ] Step completion persists

---

### 2. Existing User Migration

**Steps:**
1. If you have existing data, delete IndexedDB: `indexedDB.deleteDatabase('focus-tools')` in console
2. Refresh the app
3. Check that all data migrated

**Expected:**
- [ ] Console shows `[Storage] Starting migration from localStorage to IndexedDB...`
- [ ] Console shows `[Storage] Migration complete:` with counts
- [ ] All tasks present in IndexedDB `tasks` store
- [ ] Focus Queue preserved
- [ ] Settings preserved (quiet hours, etc.)

---

### 3. Data Persistence

**Steps:**
1. Create a new task
2. Add to Focus Queue with "This Week" horizon
3. Set importance to "Must Do"
4. Add a reminder
5. Refresh the app

**Expected:**
- [ ] Task persists with all properties
- [ ] Queue placement persists
- [ ] Importance setting persists
- [ ] No data loss on refresh

---

### 4. Export/Import Cycle

**Steps:**
1. Go to Settings → Export Data
2. Save the JSON file
3. Clear all site data
4. Refresh (fresh install)
5. Go to Settings → Import Data
6. Select the saved file

**Expected:**
- [ ] Export completes without error
- [ ] Export file contains `"source": "indexeddb"`
- [ ] Import completes successfully
- [ ] All tasks restored
- [ ] Queue restored
- [ ] Settings restored

---

### 5. Offline Usage

**Steps:**
1. Load the app normally
2. Open DevTools → Network → set to "Offline"
3. Create a task
4. Complete a step
5. Set back to "Online"
6. Refresh

**Expected:**
- [ ] App remains functional offline (after initial load)
- [ ] Data saves to IndexedDB while offline
- [ ] Data persists after coming back online

---

### 6. Cross-Browser Testing

Test the above scenarios on:

| Browser | Fresh Install | Migration | Persistence |
|---------|--------------|-----------|-------------|
| Chrome | ⬜ | ⬜ | ⬜ |
| Safari | ⬜ | ⬜ | ⬜ |
| Firefox | ⬜ | ⬜ | ⬜ |
| Edge | ⬜ | ⬜ | ⬜ |

---

### 7. Mobile Testing (iOS Safari)

**Steps:**
1. Open app on iOS Safari
2. Add to Home Screen
3. Create a task
4. Close app completely
5. Reopen from Home Screen

**Expected:**
- [ ] App opens without reload
- [ ] Data persists between sessions
- [ ] PWA cache works correctly

---

## Troubleshooting

### IndexedDB Not Working

**Symptoms:** Data not persisting, console errors about IndexedDB

**Checks:**
1. Private browsing mode? → IndexedDB may be disabled
2. Storage quota exceeded? → Check DevTools → Application → Storage
3. Multiple tabs open? → Close other tabs, refresh

### Migration Not Running

**Symptoms:** localStorage data not in IndexedDB

**Checks:**
1. Check `appState` record for `migratedFromLocalStorage` flag
2. If `true`, migration already ran
3. To re-run: delete IndexedDB database, refresh

### Data Loss After Migration

**Symptoms:** Tasks missing after migration

**Recovery:**
1. Check localStorage still has data: `localStorage.getItem('focus-tools-state')`
2. If yes, delete IndexedDB and refresh to re-migrate
3. If no, check for backup exports

---

## Debug Commands

Run these in DevTools console:

```javascript
// Check IndexedDB store counts
(await import('/lib/storage-idb.js')).getStoreCounts()

// Check migration status
(await import('/lib/storage-idb.js')).isMigrated()

// Check task cache stats
(await import('/lib/storage-idb.js')).getTaskCacheStats()

// Force prune old data
(await import('/lib/storage-idb.js')).pruneAllOldDataFromIDB()
```

---

## Sign-Off

| Tester | Date | Browser | Result |
|--------|------|---------|--------|
| | | | |
