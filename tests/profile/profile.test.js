/**
 * tests/profile/profile.test.js
 * Feature: User Profile
 *
 * Tests GET (fetch profile), PUT (update name/email), and PATCH
 * (change password) routes in app/api/profile/route.js.
 *
 * Mocks:
 *  - lib/db          → no real DB
 *  - models/User     → controlled find / update
 *  - bcrypt          → deterministic compare/hash
 *  - next-auth       → mock session
 *  - lib/authOptions → required by getServerSession
 */

import { GET, PUT, PATCH } from "@/app/api/profile/route";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("@/lib/db", () => jest.fn().mockResolvedValue(undefined));
jest.mock("@/lib/authOptions", () => ({ authOptions: {} }));

const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();
jest.mock("bcrypt", () => ({
  compare: (...args) => mockBcryptCompare(...args),
  hash: (...args) => mockBcryptHash(...args),
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args) => mockGetServerSession(...args),
}));

const mockFindOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();

// save() is instance-level; we attach it to the user object in each test
jest.mock("@/models/User", () => ({
  __esModule: true,
  default: {
    findOne: (...args) => mockFindOne(...args),
    findOneAndUpdate: (...args) => mockFindOneAndUpdate(...args),
  },
}));

// ─── Fixture session ─────────────────────────────────────────────────────────

const session = {
  user: {
    id: "stu_001",
    name: "Thulana Silva",
    email: "IT23319110@my.sliit.lk",
    role: "student",
    year: 2,
    semester: 1,
  },
};

// ─── Fixture user document ────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    _id: "stu_001",
    name: "Thulana Silva",
    email: "IT23319110@my.sliit.lk",
    role: "student",
    year: 2,
    semester: 1,
    createdAt: new Date("2025-01-01"),
    password: "$2b$10$hashedpassword",
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Feature: Profile", () => {
  beforeEach(() => {
    mockFindOne.mockReset();
    mockFindOneAndUpdate.mockReset();
    mockBcryptCompare.mockReset();
    mockBcryptHash.mockReset();
    mockGetServerSession.mockReset();
  });

  // ── Fetch user profile ────────────────────────────────────────────────────

  test("should fetch user profile", async () => {
    mockGetServerSession.mockResolvedValue(session);

    const userRecord = makeUser();
    // select("-password") chained – mock it as a plain object return
    mockFindOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(userRecord),
    });

    // GET has no body
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe("Thulana Silva");
    expect(data.email).toBe("IT23319110@my.sliit.lk");
    expect(data.role).toBe("student");
    // password must never appear
    expect(data.password).toBeUndefined();
  });

  // ── Fetch profile: unauthenticated ────────────────────────────────────────

  test("should return 401 when fetching profile without authentication", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/unauthorised/i);
  });

  // ── Update name / email ───────────────────────────────────────────────────

  test("should update profile name and email", async () => {
    mockGetServerSession.mockResolvedValue(session);

    // No duplicate email found
    mockFindOne.mockResolvedValue(null);

    const updatedUser = makeUser({
      name: "Thulana De Silva",
      email: "IT23319110@my.sliit.lk",
    });
    mockFindOneAndUpdate.mockResolvedValue(updatedUser);

    const req = buildRequest({
      name: "Thulana De Silva",
      email: "IT23319110@my.sliit.lk",
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe("Thulana De Silva");
    expect(data.message).toBe("Profile updated successfully");
  });

  // ── Update: invalid email domain ──────────────────────────────────────────

  test("should reject profile update with non-SLIIT email", async () => {
    mockGetServerSession.mockResolvedValue(session);

    const req = buildRequest({
      name: "Thulana Silva",
      email: "thulana@gmail.com", // ← invalid domain
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/@my\.sliit\.lk/i);
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
  });

  // ── Update: empty name rejected ───────────────────────────────────────────

  test("should reject profile update with empty name", async () => {
    mockGetServerSession.mockResolvedValue(session);

    const req = buildRequest({
      name: "",
      email: "IT23319110@my.sliit.lk",
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/name is required/i);
  });

  // ── Change password (correct current password) ────────────────────────────

  test("should change password with correct current password", async () => {
    mockGetServerSession.mockResolvedValue(session);

    const userRecord = makeUser();
    mockFindOne.mockResolvedValue(userRecord);
    mockBcryptCompare.mockResolvedValue(true); // current password matches
    mockBcryptHash.mockResolvedValue("$2b$10$newHashedPassword");

    const req = buildRequest({
      currentPassword: "OldPass123!",
      newPassword: "NewPass456!",
      confirmPassword: "NewPass456!",
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Password changed successfully");
    expect(userRecord.save).toHaveBeenCalledTimes(1);
  });

  // ── Change password: wrong current password ───────────────────────────────

  test("should reject password change with wrong current password", async () => {
    mockGetServerSession.mockResolvedValue(session);

    const userRecord = makeUser();
    mockFindOne.mockResolvedValue(userRecord);
    mockBcryptCompare.mockResolvedValue(false); // mismatch

    const req = buildRequest({
      currentPassword: "WrongOldPass!",
      newPassword: "NewPass456!",
      confirmPassword: "NewPass456!",
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/current password is incorrect/i);
    expect(userRecord.save).not.toHaveBeenCalled();
  });

  // ── Change password: new passwords don't match ────────────────────────────

  test("should reject password change when new passwords do not match", async () => {
    mockGetServerSession.mockResolvedValue(session);

    const req = buildRequest({
      currentPassword: "OldPass123!",
      newPassword: "NewPass456!",
      confirmPassword: "DifferentPass789!",
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/do not match/i);
  });

  // ── Change password: too short ────────────────────────────────────────────

  test("should reject new password shorter than 6 characters", async () => {
    mockGetServerSession.mockResolvedValue(session);

    const req = buildRequest({
      currentPassword: "OldPass123!",
      newPassword: "abc",
      confirmPassword: "abc",
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/at least 6/i);
  });
});
