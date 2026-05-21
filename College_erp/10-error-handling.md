# 10 — Error Handling

## What This Covers

The centralized ApiResponse pattern, how errors propagate through the stack, inconsistencies in error handling across controllers, and what a production error handling strategy looks like.

---

## The ApiResponse Class

```js
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;  // Auto-derived
  }

  static success(data, message)      { return new ApiResponse(200, data, message); }
  static created(data, message)      { return new ApiResponse(201, data, message); }
  static badRequest(message)         { return new ApiResponse(400, null, message); }
  static unauthorized(message)       { return new ApiResponse(401, null, message); }
  static forbidden(message)          { return new ApiResponse(403, null, message); }
  static notFound(message)           { return new ApiResponse(404, null, message); }
  static conflict(message)           { return new ApiResponse(409, null, message); }
  static internalServerError(message){ return new ApiResponse(500, null, message); }
  static error(message, statusCode)  { return new ApiResponse(statusCode, null, message); }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}
```

### Why This Pattern?

1. **Consistent response shape**: Every API response has `{ success, message, data }`. Frontend can rely on this structure.
2. **Chainable API**: `ApiResponse.success(data).send(res)` reads naturally.
3. **Self-documenting**: `ApiResponse.conflict("Email exists")` is clearer than `res.status(409).json({...})`.
4. **Auto-computed success**: `success = statusCode < 400` — impossible to have a 200 status with `success: false`.

### Design Pattern: Builder/Factory

Uses the **static factory method** pattern. Instead of `new ApiResponse(400, null, "Bad request")`, you write `ApiResponse.badRequest("Bad request")`. This hides the constructor complexity and provides semantic method names.

---

## Error Handling Patterns in Controllers

### Pattern 1: Explicit try-catch (Most Controllers)

```js
const loginAdminController = async (req, res) => {
  try {
    // ... business logic
    return ApiResponse.success({ token }, "Login successful").send(res);
  } catch (error) {
    console.error("Login Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};
```

**Pros**: Every controller handles its own errors. Error messages are specific.
**Cons**: Lots of repeated try-catch boilerplate across controllers.

### Pattern 2: Mongoose Error Differentiation

```js
} catch (error) {
  if (error.code === 11000) {
    return ApiResponse.conflict("Already exists").send(res);
  }
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");
    return ApiResponse.badRequest(messages).send(res);
  }
  return ApiResponse.internalServerError().send(res);
}
```

**What this handles**:
- `error.code === 11000`: MongoDB duplicate key violation (unique constraint)
- `error.name === "ValidationError"`: Mongoose schema validation failure
- Default: Any unexpected error returns 500

**Why this matters**: Without this, all errors return 500, making debugging impossible.

---

## Inconsistency: ApiResponse vs Raw `res.json()`

The marks controller uses raw responses instead of ApiResponse:

```js
// marks.controller.js — inconsistent with the rest
res.status(400).json({ success: false, message: "Invalid input data" });
res.status(500).json({ success: false, message: "Internal Server Error" });
```

The notice, branch, and subject controllers use `ApiResponse.error()`:
```js
return ApiResponse.error("No Notices Found", 404).send(res);
```

**Impact**: Frontend has to handle slightly different response shapes. The data structure is the same but the code path differs.

**Why it happened**: Different developers or different development phases. The marks controller was likely written before ApiResponse was adopted.

---

## What's Missing: Global Error Handler

Express supports a global error-handling middleware, but it's not used:

```js
// This would catch unhandled errors from any controller
app.use((err, req, res, next) => {
  console.error(err.stack);
  ApiResponse.internalServerError("Something went wrong").send(res);
});
```

Without this, unhandled promise rejections or thrown errors crash the server.

### What's also missing:

- **`asyncHandler` wrapper**: Would eliminate try-catch in every controller
- **Custom error classes**: `NotFoundError`, `ValidationError`, etc. with predefined status codes
- **Request validation middleware**: Libraries like `joi` or `express-validator` to validate before hitting the controller

---

## Frontend Error Handling

### Toast Notifications

```js
try {
  const response = await axiosWrapper.post("/student/login", formData);
  // Success path
} catch (error) {
  toast.dismiss();
  toast.error(error.response?.data?.message || "Login failed");
}
```

**How it works**:
1. On error, `toast.error()` shows a red notification
2. Uses optional chaining (`?.`) to safely access nested error properties
3. Fallback message ("Login failed") if the response structure is unexpected

### Axios Interceptor (Global Error Handling)

```js
axiosWrapper.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message === "Invalid or expired token") {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);  // Still reject — component-level catch fires too
  }
);
```

**Order**: Interceptor runs first, then component-level catch. The interceptor handles token expiry; the component handles other errors.

---

## What Could Break If Changed

1. **Remove try-catch from a controller** → Unhandled promise rejection crashes the Node process
2. **Remove `return` before `ApiResponse`** → Controller continues executing, sends two responses → "Cannot set headers after they are sent" crash
3. **Change response shape** → Frontend `error.response?.data?.message` path breaks
4. **Remove `console.error`** → Errors become invisible; debugging becomes impossible
5. **Change `success` calculation** → `success = statusCode < 400` means a 204 (No Content) shows as success. If changed to `=== 200`, many success responses are misclassified.

---

## Most Likely Interview Questions

**Q: How do you handle errors in your project?**
> Each controller uses try-catch with the ApiResponse utility class. Different error types get different HTTP status codes: 400 for validation errors, 401 for auth failures, 404 for missing resources, 409 for conflicts, 500 for server errors. Mongoose-specific errors like duplicate keys and validation failures are caught and translated to appropriate responses. The frontend uses toast notifications for user-facing errors and an Axios interceptor for global token-expiry handling.

**Q: What's the advantage of the ApiResponse class over plain res.json()?**
> Consistency — every response has the same shape. Semantic methods — `.badRequest()` is clearer than `.status(400)`. Auto-computed `success` field. Chainable `.send(res)`. And it's impossible to accidentally return a 200 status with `success: false`.

**Q: What would you improve about your error handling?**
> Add a global error-handling middleware to catch unhandled errors. Implement an `asyncHandler` wrapper to eliminate per-controller try-catch. Create custom error classes for domain-specific errors. Add request validation middleware (joi/zod) before controllers. And standardize the marks controller to use ApiResponse.

---

## Cross/Follow-up Questions

- *What happens if an async error is not caught?* → In Node.js, unhandled promise rejections used to crash the process silently. In Node 15+, they terminate the process with a non-zero exit code.
- *Why not use Express's built-in error handler?* → It requires passing errors to `next(error)`. Since controllers use try-catch directly, errors never reach `next()`.
- *How would you add request validation?* → Use `express-validator` or `joi` as middleware before the controller. This separates validation from business logic.

---

## Why This Implementation Matters

Error handling reveals code maturity. Interviewers look for:
- Consistent error formats
- Awareness of different error types (validation, auth, not found, server)
- Understanding of error propagation (middleware → controller → response)
- Knowledge of production error monitoring (logging, alerting)

---

## Common Mistakes / Edge Cases

1. **Swallowed errors**: `catch(error) { return ApiResponse.internalServerError().send(res) }` — the error is logged but the details are lost in the response. Good for security, bad for debugging.
2. **Double response**: Missing `return` sends a response, then continues to the next `return` — "headers already sent" error
3. **`res.json()` after `res.send()`**: Can't send two responses for one request
4. **Error inside error handler**: If `ApiResponse.send()` itself throws, there's no fallback
5. **Async/await without catch**: Forgetting `await` doesn't trigger the catch block — the promise rejection is unhandled
