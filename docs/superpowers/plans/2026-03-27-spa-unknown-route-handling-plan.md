# SPA Unknown Route Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add catch-all route (`path="*"`) to React Router to handle unknown routes, redirecting users appropriately based on auth state.

**Architecture:** Add a new `UnknownRoute` component that checks auth state and redirects to `/login` (if unauthenticated) or `/` (if authenticated). Place this as the last route in the `Routes` element.

**Tech Stack:** React Router v6, React

---

## File Structure

- Modify: `frontend/src/App.tsx` (add `UnknownRoute` component and `path="*"` route)

---

## Tasks

### Task 1: Add UnknownRoute Component and Catch-All Route

**Files:**
- Modify: `frontend/src/App.tsx:35-47` (add `UnknownRoute` component after `ProtectedRoute`)

- [ ] **Step 1: Add UnknownRoute component**

In `frontend/src/App.tsx`, add the following component after the `ProtectedRoute` function (around line 47):

```tsx
function UnknownRoute() {
  const { user } = useAuth()
  return <Navigate to={user ? '/' : '/login'} replace />
}
```

- [ ] **Step 2: Add catch-all route to Routes**

In `frontend/src/App.tsx`, find the closing `</Routes>` tag (around line 160) and add the catch-all route just before it:

```tsx
<Route path="*" element={<UnknownRoute />} />
```

The Routes section should end like:
```tsx
          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <AnimatedPage>
                  <BudgetPage />
                </AnimatedPage>
              </ProtectedRoute>
            }
          />
        </Route>
```

Should become:
```tsx
          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <AnimatedPage>
                  <BudgetPage />
                </AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<UnknownRoute />} />
        </Route>
```

- [ ] **Step 3: Verify the build**

Run: `cd /Users/karsa/proj/ai-payrecord2/frontend && npm run build 2>&1 | tail -20`
Expected: Build completes without errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
feat: add catch-all route for unknown paths

Add UnknownRoute component and path="*" route to handle
unmatched routes. Unauthenticated users redirect to /login,
authenticated users redirect to /.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Verification

After implementation, verify:

1. **Build passes** - `npm run build` completes without errors
2. **Manual testing** (via Playwright):
   - Log in, then manually navigate to `/nonexistent-page` - should redirect to `/`
   - Log out, then navigate to `/nonexistent-page` - should redirect to `/login`
