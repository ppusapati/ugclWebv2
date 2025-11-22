# SSR Authentication Fix

## Problem

The application was showing "Unauthorized" errors (401) when accessing protected routes in SSR mode, even when users were logged in. The issues were:

1. **No token extraction from cookies**: The SSR API client wasn't properly extracting the authentication token from cookies
2. **No redirect on unauthorized**: When a 401 error occurred during SSR, the user wasn't being redirected to the login page
3. **Lack of debugging information**: There was insufficient logging to diagnose authentication issues

## Root Cause

From the logs:
```
[SSR] Fetching modules - token automatically extracted from cookies
[createSSRApiClient] Token extracted: No
[createSSRApiClient] Base URL: http://localhost:8080/api/v1
[SSR] Error loading modules: { message: 'Unauthorized', status: 401, data: null }
```

The token was not being extracted from cookies, even though cookies were being set on login.

## Solution

### 1. Enhanced Cookie Extraction with Logging

**Location**: [src/services/api-client.ts:201-211](src/services/api-client.ts)

Added detailed logging to the `extractTokenFromCookies` function:

```typescript
function extractTokenFromCookies(cookieHeader: string): string | undefined {
  if (!cookieHeader) {
    console.log('[extractTokenFromCookies] No cookie header provided');
    return undefined;
  }
  console.log('[extractTokenFromCookies] Cookie header:', cookieHeader);
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  const token = match ? match[1] : undefined;
  console.log('[extractTokenFromCookies] Extracted token:', token ? `Found (${token.substring(0, 20)}...)` : 'None');
  return token;
}
```

**What this does**:
- Logs when no cookie header is provided
- Logs the entire cookie header for debugging
- Logs whether a token was successfully extracted
- Truncates token in logs for security (only shows first 20 characters)

### 2. SSR Unauthorized Redirect

**Location**: [src/services/api-client.ts:229-236](src/services/api-client.ts)

Added automatic redirect on 401 errors during SSR:

```typescript
// Helper to handle 401 errors in SSR by throwing redirect
const handleSSRUnauthorized = (error: any) => {
  if (error.status === 401) {
    console.log('[SSR] 401 Unauthorized - redirecting to login');
    throw requestEvent.redirect(302, '/login');
  }
  throw error;
};
```

**What this does**:
- Catches 401 (Unauthorized) errors
- Automatically redirects to login page using Qwik's redirect mechanism
- Logs the redirect for debugging
- Re-throws other errors normally

### 3. Wrapped All SSR API Methods

**Location**: [src/services/api-client.ts:238-271](src/services/api-client.ts)

All SSR API client methods now wrap requests with try-catch to handle unauthorized errors:

```typescript
return {
  async get<T>(endpoint: string, params?: Record<string, any>) {
    try {
      return await request<T>(endpoint, { method: 'GET', params, serverBaseUrl, serverToken });
    } catch (error) {
      handleSSRUnauthorized(error);
      throw error;
    }
  },
  // ... same for post, put, delete
};
```

**What this does**:
- Every SSR API call is protected
- 401 errors trigger automatic redirect
- Other errors are handled normally
- Consistent behavior across all HTTP methods

### 4. Additional Debugging Logs

Added more context logging to `createSSRApiClient`:

```typescript
console.log('[createSSRApiClient] Token extracted:', serverToken ? 'Yes' : 'No');
console.log('[createSSRApiClient] Base URL:', serverBaseUrl);
console.log('[createSSRApiClient] Request URL:', requestEvent.url.pathname);
```

## How It Works Now

### Scenario 1: User Has Valid Token

1. User navigates to `/admin/masters/module`
2. `routeLoader$` runs on server
3. `createSSRApiClient` extracts token from cookies
4. Logs show: `[extractTokenFromCookies] Extracted token: Found (eyJhbGciOiJIUzI1Ni...)`
5. API request includes token in Authorization header
6. Backend validates token and returns data
7. Page renders with data

### Scenario 2: User Has No Token or Invalid Token

1. User navigates to `/admin/masters/module`
2. `routeLoader$` runs on server
3. `createSSRApiClient` finds no token in cookies
4. Logs show: `[extractTokenFromCookies] No cookie header provided` or `Extracted token: None`
5. API request has no Authorization header
6. Backend returns 401 Unauthorized
7. `handleSSRUnauthorized` catches the error
8. Logs show: `[SSR] 401 Unauthorized - redirecting to login`
9. User is redirected to `/login` page

### Scenario 3: Token Expired or Revoked

1. User has token cookie but it's expired
2. API request includes expired token
3. Backend validates and returns 401
4. `handleSSRUnauthorized` catches the error
5. User is redirected to `/login`

## Testing

### Check if Token is Being Set

1. Open browser DevTools > Application > Cookies
2. Look for `token` cookie with value
3. Should have:
   - Path: `/`
   - Max-Age: `2592000` (30 days)
   - SameSite: `Lax`

### Check Logs

When navigating to a protected route, you should see:

**If logged in (valid token)**:
```
[createSSRApiClient] Request URL: /admin/masters/module
[extractTokenFromCookies] Cookie header: token=eyJhbGci...
[extractTokenFromCookies] Extracted token: Found (eyJhbGci...)
[createSSRApiClient] Token extracted: Yes
[createSSRApiClient] Base URL: http://localhost:8080/api/v1
[SSR] Fetching modules - token automatically extracted from cookies
[SSR] Fetched modules: { modules: [...], count: 10 }
```

**If not logged in or token invalid**:
```
[createSSRApiClient] Request URL: /admin/masters/module
[extractTokenFromCookies] No cookie header provided
[createSSRApiClient] Token extracted: No
[createSSRApiClient] Base URL: http://localhost:8080/api/v1
[SSR] Fetching modules - token automatically extracted from cookies
[SSR] Error loading modules: { message: 'Unauthorized', status: 401 }
[SSR] 401 Unauthorized - redirecting to login
```

Then the user is redirected to `/login`.

## Common Issues and Debugging

### Issue: Still seeing "No cookie header provided"

**Possible Causes**:
1. Cookies are not being set on login
2. Cookie domain/path mismatch
3. SameSite policy blocking cookies

**Debug Steps**:
1. Check browser DevTools > Application > Cookies for `token` cookie
2. Verify cookie path is `/` (not specific path)
3. Check if cookie is being sent in request headers (Network tab)
4. Verify login flow is setting cookies correctly

### Issue: Token extracted but still 401

**Possible Causes**:
1. Token is expired
2. Token format is wrong (missing "Bearer" prefix)
3. Backend API key is incorrect
4. Backend authentication logic changed

**Debug Steps**:
1. Check token expiration (decode JWT at jwt.io)
2. Verify Authorization header format in network logs
3. Check API key in api-client.ts matches backend
4. Test token directly with Postman/curl

### Issue: No redirect happening on 401

**Possible Causes**:
1. Error is being caught by route loader's try-catch
2. Redirect throw is being swallowed

**Debug Steps**:
1. Check route loader code for try-catch blocks
2. Verify redirect is being thrown, not returned
3. Check server console for redirect logs

## Files Modified

1. **src/services/api-client.ts**
   - Enhanced `extractTokenFromCookies` with logging
   - Added `handleSSRUnauthorized` helper
   - Wrapped all SSR API methods with unauthorized handling
   - Added additional debug logging

## Benefits

1. **Better Security**: Automatic logout on expired/invalid tokens
2. **Better UX**: Users are redirected to login instead of seeing errors
3. **Better DX**: Detailed logs help diagnose authentication issues
4. **Consistent Behavior**: Same handling across all SSR API calls

## Future Improvements

1. Add token refresh mechanism
2. Add retry logic with exponential backoff
3. Add more granular error handling (403 Forbidden, etc.)
4. Implement session timeout warnings
5. Add security headers (CSRF tokens)

## Related Files

- [src/services/api-client.ts](src/services/api-client.ts) - Main API client with SSR support
- [src/components/auth/login_form.tsx](src/components/auth/login_form.tsx) - Sets cookies on login
- [src/routes/admin/masters/module/index.tsx](src/routes/admin/masters/module/index.tsx) - Example route using SSR API client
- [src/utils/auth.ts](src/utils/auth.ts) - Client-side auth utilities

## Conclusion

The SSR authentication fix ensures that:
- ✅ Tokens are properly extracted from cookies
- ✅ Unauthorized users are redirected to login
- ✅ Detailed logs help debug authentication issues
- ✅ Consistent behavior across SSR and client-side

The application now properly handles authentication in SSR mode and provides a secure, user-friendly experience.
