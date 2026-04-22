/**
 * tests/auth/login.test.js
 * Feature: Authentication – Login
 *
 * Tests the POST /api/login route handler directly.
 * Mocks:
 *  - lib/db      → no real DB connection
 *  - models/User → controlled findOne responses
 *  - bcrypt      → deterministic compare results
 */

import { POST } from "@/app/api/login/route";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("@/lib/db", () => jest.fn().mockResolvedValue(undefined));

const mockBcryptCompare = jest.fn();
jest.mock("bcrypt", () => ({
  compare: (...args) => mockBcryptCompare(...args),
}));

const mockFindOne = jest.fn();
jest.mock("@/models/User", () => ({
  __esModule: true,
  default: {
    findOne: (...args) => mockFindOne(...args),
  },
}));

// ─── Shared fixture ──────────────────────────────────────────────────────────

const storedUser = {
  _id: "user_001",
  name: "Thulana Silva",
  email: "IT23319110@my.sliit.lk",
  password: "$2b$10$hashedpassword",
  role: "student",
  year: 2,
  semester: 1,
};

function buildRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Feature: Authentication – Login", () => {
  beforeEach(() => {
    mockFindOne.mockReset();
    mockBcryptCompare.mockReset();
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  test("should login with correct credentials", async () => {
    mockFindOne.mockResolvedValue(storedUser);
    mockBcryptCompare.mockResolvedValue(true); // password matches

    const req = buildRequest({
      email: "IT23319110@my.sliit.lk",
      password: "correctPass123",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Login successful");
    expect(data.user.email).toBe("IT23319110@my.sliit.lk");
    expect(data.user.role).toBe("student");
    // Password must NEVER appear in the response
    expect(data.user.password).toBeUndefined();
  });

  // ── Wrong password ─────────────────────────────────────────────────────────

  test("should fail with wrong password", async () => {
    mockFindOne.mockResolvedValue(storedUser);
    mockBcryptCompare.mockResolvedValue(false); // password mismatch

    const req = buildRequest({
      email: "IT23319110@my.sliit.lk",
      password: "wrongPassword",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/invalid password/i);
  });

  // ── User not found ─────────────────────────────────────────────────────────

  test("should fail when user is not found", async () => {
    mockFindOne.mockResolvedValue(null); // no matching user

    const req = buildRequest({
      email: "nobody@my.sliit.lk",
      password: "anypass",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  // ── Role check ─────────────────────────────────────────────────────────────

  test("should return user role in the response", async () => {
    // Test with a lecturer account to verify role is passed through correctly
    const lecturerUser = {
      ...storedUser,
      _id: "lecturer_001",
      email: "JohnDoe@my.sliit.lk",
      role: "lecturer",
    };
    mockFindOne.mockResolvedValue(lecturerUser);
    mockBcryptCompare.mockResolvedValue(true);

    const req = buildRequest({
      email: "JohnDoe@my.sliit.lk",
      password: "lectPass",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.role).toBe("lecturer");
  });

  // ── Admin login ────────────────────────────────────────────────────────────

  test("should allow admin to login successfully", async () => {
    const adminUser = {
      ...storedUser,
      _id: "admin_001",
      email: "admin@my.sliit.lk",
      role: "admin",
    };
    mockFindOne.mockResolvedValue(adminUser);
    mockBcryptCompare.mockResolvedValue(true);

    const req = buildRequest({ email: "admin@my.sliit.lk", password: "adminPass!" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.role).toBe("admin");
  });
});
