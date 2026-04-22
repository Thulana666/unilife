/**
 * tests/assignment/assignment.test.js
 * Feature: Assignments
 *
 * Tests POST (create), GET (fetch by semester), and DELETE routes
 * in app/api/assignments/route.js.
 *
 * Mocks:
 *  - lib/db                → no real DB
 *  - models/Assignment     → controlled CRUD operations
 *  - lib/pushNotification  → side-effect silenced
 *  - next-auth             → mock session per role
 *  - lib/authOptions       → required by getServerSession
 */

import { GET, POST, DELETE } from "@/app/api/assignments/route";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("@/lib/db", () => jest.fn().mockResolvedValue(undefined));
jest.mock("@/lib/authOptions", () => ({ authOptions: {} }));
jest.mock("@/lib/pushNotification", () => ({
  pushNotification: jest.fn().mockResolvedValue(undefined),
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args) => mockGetServerSession(...args),
}));

const mockFind = jest.fn();
const mockCreate = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndDelete = jest.fn();

jest.mock("@/models/Assignment", () => ({
  __esModule: true,
  default: {
    find: (...args) => mockFind(...args),
    create: (...args) => mockCreate(...args),
    findById: (...args) => mockFindById(...args),
    findByIdAndDelete: (...args) => mockFindByIdAndDelete(...args),
  },
}));

// ─── Fixture sessions ────────────────────────────────────────────────────────

const studentSession = {
  user: {
    id: "user_stu_01",
    name: "Thulana Silva",
    email: "IT23319110@my.sliit.lk",
    role: "student",
    year: 2,
    semester: 1,
  },
};

const lecturerSession = {
  user: {
    id: "user_lec_01",
    name: "Dr. Perera",
    email: "drperera@my.sliit.lk",
    role: "lecturer",
  },
};

const adminSession = {
  user: {
    id: "user_adm_01",
    name: "Admin User",
    email: "admin@my.sliit.lk",
    role: "admin",
  },
};

// ─── Fixture data ─────────────────────────────────────────────────────────────

const sampleAssignment = {
  _id: "asgn_001",
  title: "Data Structures Lab Report",
  description: "Submit PDF via portal",
  dueDate: new Date("2026-05-10"),
  dueTime: "23:59",
  course: "IT2020",
  status: "pending",
  year: 2,
  semester: 1,
  userId: "user_stu_01",
  isLecturerAssignment: false,
};

const lecturerAssignment = {
  _id: "asgn_002",
  title: "Algorithm Design Assignment",
  course: "IT2030",
  dueDate: new Date("2026-05-15"),
  year: "2",
  semester: "1",
  isLecturerAssignment: true,
  userId: "user_lec_01",
  uploadedBy: "drperera@my.sliit.lk",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGetRequest(params = {}) {
  const url = new URL("http://localhost/api/assignments");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() };
}

function buildPostRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}

function buildDeleteRequest(params = {}) {
  const url = new URL("http://localhost/api/assignments");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return {
    url: url.toString(),
    json: jest.fn().mockResolvedValue({}),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Feature: Assignments", () => {
  beforeEach(() => {
    mockFind.mockReset();
    mockCreate.mockReset();
    mockFindById.mockReset();
    mockFindByIdAndDelete.mockReset();
    mockGetServerSession.mockReset();
  });

  // ── Create assignment (student) ────────────────────────────────────────────

  test("should create assignment (student)", async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockCreate.mockResolvedValue({ ...sampleAssignment });

    const req = buildPostRequest({
      title: "Data Structures Lab Report",
      description: "Submit PDF via portal",
      dueDate: "2026-05-10",
      course: "IT2020",
      year: 2,
      semester: 1,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.title).toBe("Data Structures Lab Report");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  // ── Create assignment (lecturer – broadcaster) ─────────────────────────────

  test("should create lecturer broadcast assignment with isLecturerAssignment=true", async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockCreate.mockResolvedValue({ ...lecturerAssignment });

    const req = buildPostRequest({
      title: "Algorithm Design Assignment",
      course: "IT2030",
      dueDate: "2026-05-15",
      year: "2",
      semester: "1",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.isLecturerAssignment).toBe(true);
    expect(data.uploadedBy).toBe("drperera@my.sliit.lk");
  });

  // ── Fetch assignments by semester (student) ────────────────────────────────

  test("should fetch assignments by semester for a student", async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockFind.mockReturnValue({
      sort: jest.fn().mockResolvedValue([sampleAssignment]),
    });

    const req = buildGetRequest({ semester: "1", year: "2" });
    const res = await GET(req);
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data[0].semester).toBe(1);
  });

  // ── Unauthorised GET ───────────────────────────────────────────────────────

  test("should return 401 when not authenticated on GET", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = buildGetRequest({ semester: "1" });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/unauthorised/i);
  });

  // ── Delete assignment (admin) ──────────────────────────────────────────────

  test("should delete assignment (admin)", async () => {
    mockGetServerSession.mockResolvedValue(adminSession);
    mockFindById.mockResolvedValue({
      ...sampleAssignment,
      userId: "user_stu_01",
    });
    mockFindByIdAndDelete.mockResolvedValue({});

    const req = buildDeleteRequest({ id: "asgn_001" });
    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Deleted");
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith("asgn_001");
  });

  // ── Delete assignment (lecturer) ───────────────────────────────────────────

  test("should delete assignment (lecturer)", async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockFindById.mockResolvedValue({
      ...sampleAssignment,
      userId: "user_lec_01",
    });
    mockFindByIdAndDelete.mockResolvedValue({});

    const req = buildDeleteRequest({ id: "asgn_001" });
    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Deleted");
  });

  // ── Delete: missing ID ─────────────────────────────────────────────────────

  test("should return 400 when deleting without providing an ID", async () => {
    mockGetServerSession.mockResolvedValue(adminSession);

    // No id param; body also empty
    const req = {
      url: "http://localhost/api/assignments",
      json: jest.fn().mockRejectedValue(new SyntaxError("Unexpected end")),
    };

    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/id required/i);
  });
});
