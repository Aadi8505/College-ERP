# 05 — State Management

## What This Covers

Redux store setup, token persistence via localStorage, the AxiosWrapper interceptor pattern, and how frontend state flows through the application.

---

## State Architecture

```
                    ┌──────────────────────┐
                    │    Redux Store       │
                    │                      │
                    │  userData: {}        │ ← User profile object
                    │  userToken: ""       │ ← JWT token string
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
        setUserData()    setUserToken()   useSelector()
              │                │                │
              ▼                ▼                ▼
        Components      Login.jsx        All components
        that update      on login         that read state
```

### Dual Storage: Redux + localStorage

| Storage | What | Purpose | Survives Refresh? |
|---------|------|---------|-------------------|
| Redux | `userData`, `userToken` | In-memory access for components | ❌ No |
| localStorage | `userToken`, `userType` | Persist auth across refreshes | ✅ Yes |

**Why both?** Redux provides reactive updates (components re-render when token changes). localStorage persists data across page refreshes. On app start, the token is read from localStorage to determine if the user is already logged in.

---

## Redux Setup

### Action Types (`action.js`)

```js
export const USER_TOKEN = "USER_TOKEN";
export const USER_DATA = "USER_DATA";
```

Only two action types. Minimal by design — the app doesn't have complex state requirements.

### Action Creators (`actions.js`)

```js
export const setUserData = (data) => ({ type: USER_DATA, payload: data });
export const setUserToken = (data) => ({ type: USER_TOKEN, payload: data });
```

Plain action creators, no thunks, no sagas. Async operations (API calls) happen in components, not in Redux middleware.

### Reducer (`reducers.js`)

```js
let initialState = { userData: {}, userToken: "" };

export const reducers = (state = initialState, action) => {
  switch (action.type) {
    case USER_DATA:
      return { ...state, userData: action.payload };
    case USER_TOKEN:
      return { ...state, userToken: action.payload };
    default:
      return state;
  }
};
```

Single reducer, no `combineReducers()`. Appropriate for the simple state shape.

### Store (`store.js`)

```js
const mystore = createStore(
  reducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
```

**Notable**: Uses `legacy_createStore` — the older Redux API. Redux Toolkit's `configureStore` is the modern recommendation.

**DevTools integration**: The `window.__REDUX_DEVTOOLS_EXTENSION__` line enables Redux DevTools browser extension for debugging. The `&&` short-circuit prevents errors when the extension isn't installed.

---

## Why Legacy Redux vs Redux Toolkit?

| Aspect | Legacy Redux (Chosen) | Redux Toolkit |
|--------|----------------------|---------------|
| Boilerplate | More files (action.js, actions.js, reducers.js) | Single `createSlice()` |
| Immutability | Manual spread operator | Built-in Immer |
| Async | Not needed here | `createAsyncThunk` |
| Learning curve | Lower for simple apps | Slightly steeper |

**Interview answer**: "We used legacy Redux because the state management needs are minimal — just two values. Redux Toolkit would be better for a larger app with async thunks and normalized state. For just storing a token and user data, legacy Redux keeps things explicit and easy to understand."

---

## AxiosWrapper: The Interceptor Pattern

```js
const axiosWrapper = axios.create({
  baseURL: baseApiURL(),    // REACT_APP_APILINK env variable
});

axiosWrapper.interceptors.response.use(
  (response) => response,   // Success: pass through unchanged
  (error) => {
    if (
      error.response?.data?.message === "Invalid or expired token" &&
      error.response?.data?.success === false &&
      error.response?.data?.data === null
    ) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);
```

### What It Does

1. **Centralized base URL**: All requests go through `axiosWrapper` — changing the API URL only requires changing one environment variable.
2. **Auto-logout on token expiry**: When the backend returns a 401 with the specific "Invalid or expired token" message, the interceptor clears localStorage and redirects to the login page.

### Why This Approach?

Without the interceptor, every component would need try-catch logic to handle token expiry. With it, token expiry is handled globally — zero per-component code.

### Why check the exact message string?

```js
error.response?.data?.message === "Invalid or expired token"
```

Not every 401 should trigger auto-logout. For example, a wrong password during login also returns 401 but shouldn't clear the token. The specific message match prevents false positives.

### Limitation

This is **brittle** — if the backend error message changes even slightly, auto-logout stops working. A better approach: use a custom error code or a dedicated header.

---

## Token Persistence Flow

```
                App Start
                    │
                    ▼
         localStorage.getItem("userToken")
                    │
          ┌─────────┼──────────┐
          │ exists              │ null
          ▼                     ▼
    Navigate to                Show
    /{userType}               Login Page
    dashboard
                    │
                    ▼
              API calls
          with Bearer token
                    │
          ┌─────────┼──────────┐
          │ valid               │ expired
          ▼                     ▼
    Render data            AxiosWrapper
                           interceptor:
                           clear storage
                           redirect to /
```

### Login.jsx Token Handling

```js
useEffect(() => {
  const userToken = localStorage.getItem("userToken");
  if (userToken) {
    navigate(`/${localStorage.getItem("userType").toLowerCase()}`);
  }
}, [navigate]);
```

**Edge case**: If `userType` is null (corrupted localStorage), `.toLowerCase()` throws an error. This would crash the app on load.

---

## Data Flow Example: Fetching Student Profile

```
1. Student dashboard loads
2. Component calls: axiosWrapper.get("/student/my-details", { headers })
3. AxiosWrapper prepends baseURL: http://localhost:4000/api/student/my-details
4. Backend auth middleware verifies token → req.userId
5. Controller: studentDetails.findById(req.userId).populate("branchId")
6. Response: ApiResponse.success(user, "My Details Found!")
7. Component: response.data.data → setState
8. Component re-renders with profile data
```

---

## What Could Break If Changed

1. **Remove `window.__REDUX_DEVTOOLS_EXTENSION__` check** → App crashes in browsers without the extension
2. **Change ApiResponse error message** → AxiosWrapper interceptor stops detecting expired tokens
3. **Clear `userType` but not `userToken`** → App tries to redirect but `.toLowerCase()` fails on null
4. **Switch from localStorage to sessionStorage** → Token lost when browser tab is closed
5. **Remove Redux entirely** → Components lose shared state; each would need to fetch user data independently

---

## Most Likely Interview Questions

**Q: How do you manage state in your frontend?**
> We use Redux for global state (user token and user data) and localStorage for persistence across refreshes. The state is minimal — just two values. Components access state via `useSelector` and dispatch actions via `useDispatch`. API calls happen in components directly, not via Redux middleware.

**Q: Why not use Context API instead of Redux?**
> For just two values, Context API would work fine. Redux was chosen for the DevTools integration and the familiar flux pattern. In hindsight, Context API or Zustand would be simpler with less boilerplate.

**Q: How do you handle token expiry on the frontend?**
> We have an Axios response interceptor that checks for "Invalid or expired token" errors. When detected, it clears localStorage and redirects to the login page automatically. This centralizes the expiry logic so individual components don't need to handle it.

**Q: Why localStorage over sessionStorage?**
> localStorage persists even when the browser is closed, so users don't need to log in every time they open a new tab. sessionStorage would be more secure but worse for UX.

---

## Cross/Follow-up Questions

- *What's the difference between Redux and Context API?* → Redux has middleware, DevTools, and a predictable state container. Context is simpler but triggers re-renders on all consumers when any context value changes.
- *How would you add async actions?* → Use Redux Toolkit's `createAsyncThunk` or middleware like `redux-thunk` for API calls within Redux.
- *What about state normalization?* → For this simple state shape, it's not needed. For complex data (list of students with nested branches), `normalizeR` or Redux Toolkit's `createEntityAdapter` would help.

---

## Why This Implementation Matters

State management questions test if you understand:
- Client-side data lifecycle (memory vs. disk persistence)
- The observer pattern (Redux store → subscribed components)
- Error handling patterns (interceptors vs. per-component try-catch)
- Tradeoffs between state management solutions

---

## Common Mistakes / Edge Cases

1. **Stale token in Redux**: If localStorage is cleared externally (DevTools), Redux still has the old token until the page refreshes
2. **Missing `userType`**: If only `userToken` is set, navigation fails because `userType` is null
3. **Multiple tabs**: Logging out in one tab doesn't clear localStorage in other tabs — they continue with the old token until an API call fails
4. **`window.__REDUX_DEVTOOLS_EXTENSION__` in SSR**: Would fail server-side because `window` doesn't exist. Not an issue here (CRA is client-only) but worth knowing.
