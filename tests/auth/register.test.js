/**
 * tests/auth/register.test.js
 * Feature: Authentication – Registration
 *
 * Mocks:
 *  - lib/db          → prevents real MongoDB connections
 *  - models/User     → isolated in-memory behaviour
 *  - bcrypt          → returns deterministic hash values
 *  - lib/pushNotification → fire-and-forget side-effect, not under test
 *
 * The route handler is imported directly and called with a minimal
 * Request-like object so no HTTP server is needed.
 */

import { POST } from "@/app/api/register/route";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("@/lib/db", () => jest.fn().mockResolvedValue(undefined));

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password_mock"),
}));

jest.mock("@/lib/pushNotification", () => ({
  pushNotification: jest.fn().mockResolvedValue(undefined),
}));

// We control User.findOne and User.create per test
const mockFindOne = jest.fn();
const mockCreate = jest.fn();

jest.mock("@/models/User", () => ({
  __esModule: true,
  default: {
    findOne: (...args) => mockFindOne(...args),
    create: (...args) => mockCreate(...args),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a minimal Next.js Request mock whose .json() returns `body`.
 */
function buildRequest(body) {
  return {
    json: jest.fn().mockResolvedValue(body),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Feature: Authentication – Register", () => {
  beforeEach(() => {
    mockFindOne.mockReset();
    mockCreate.mockReset();
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  test("should create user with valid data", async () => {
    // No existing user found
    mockFindOne.mockResolvedValue(null);
    // User.create resolves without error
    mockCreate.mockResolvedValue({
      _id: "user_001",
      name: "Thulana Silva",
      email: "IT23319110@my.sliit.lk",
      role: "student",
    });

    const req = buildRequest({
      name: "Thulana Silva",
      email: "IT23319110@my.sliit.lk",
      password: "SecurePass123!",
      role: "student",
      year: 2,
      semester: 1,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Account created successfully");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  // ── Validation: invalid email domain ───────────────────────────────────────

  test("should fail with invalid email (not @my.sliit.lk)", async () => {
    const req = buildRequest({
      name: "John Doe",
      email: "johndoe@gmail.com", // ← wrong domain
      password: "pass123",
      role: "student",
      year: 1,
      semester: 1,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/campus email/i);
    // User.create should NEVER be reached
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // ── Duplicate user ─────────────────────────────────────────────────────────

  test("should fail if user already exists", async () => {
    // Simulate an existing record
    mockFindOne.mockResolvedValue({
      _id: "existing_001",
      email: "IT23319110@my.sliit.lk",
    });

    const req = buildRequest({
      name: "Another Person",
      email: "IT23319110@my.sliit.lk",
      password: "pass123",
      role: "student",
      year: 1,
      semester: 2,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/already exists/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // ── Validation: missing required fields ────────────────────────────────────

  test("should fail if required fields are missing", async () => {
    // No name provided
    const req = buildRequest({
      email: "IT23000000@my.sliit.lk",
      password: "pass123",
      role: "student",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  // ── Validation: student without year/semester ──────────────────────────────

  test("should fail if student registers without year and semester", async () => {
    mockFindOne.mockResolvedValue(null);

    const req = buildRequest({
      name: "Student X",
      email: "IT23111111@my.sliit.lk",
      password: "pass123",
      role: "student",
      // year and semester intentionally omitted
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/year and semester/i);
  });
});
