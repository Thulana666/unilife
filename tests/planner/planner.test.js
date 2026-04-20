/**
 * tests/planner/planner.test.js
 * Feature: Study Planner
 *
 * Tests POST (create), GET (fetch plans), and DELETE routes
 * in app/api/planner/route.js.
 *
 * Mocks:
 *  - lib/db                → no real DB
 *  - models/Planner        → controlled CRUD operations
 *  - lib/pushNotification  → side-effect silenced
 *  - next-auth             → mock session
 *  - lib/authOptions       → required by getServerSession
 */

import { GET, POST, DELETE } from "@/app/api/planner/route";

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

jest.mock("@/models/Planner", () => ({
  __esModule: true,
  default: {
    find: (...args) => mockFind(...args),
    create: (...args) => mockCreate(...args),
    findById: (...args) => mockFindById(...args),
    findByIdAndDelete: (...args) => mockFindByIdAndDelete(...args),
  },
}));

// ─── Fixture sessions ────────────────────────────────────────────────────────

const lecturerSession = {
  user: {
    id: "lec_001",
    name: "Dr. Perera",
    email: "drperera@my.sliit.lk",
    role: "lecturer",
    year: null,
    semester: null,
  },
};

const studentSession = {
  user: {
    id: "stu_001",
    name: "Thulana Silva",
    email: "IT23319110@my.sliit.lk",
    role: "student",
    year: 2,
    semester: 1,
  },
};

const adminSession = {
  user: {
    id: "adm_001",
    name: "Admin User",
    email: "admin@my.sliit.lk",
    role: "admin",
  },
};

// ─── Fixture data ─────────────────────────────────────────────────────────────

const samplePlan = {
  _id: "plan_001",
  title: "Algorithms Revision",
  subject: "IT2030",
  description: "Cover dynamic programming chapter",
  date: "2026-05-05",
  time: "09:00",
  day: "MON",
  priority: "High",
  status: "Pending",
  semester: "1",
  year: 2,
  venue: "Online",
  createdBy: "drperera@my.sliit.lk",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGetRequest(params = {}) {
  const url = new URL("http://localhost/api/planner");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() };
}

function buildPostRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}

function buildDeleteRequest(params = {}) {
  const url = new URL("http://localhost/api/planner");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Feature: Study Planner", () => {
  beforeEach(() => {
    mockFind.mockReset();
    mockCreate.mockReset();
    mockFindById.mockReset();
    mockFindByIdAndDelete.mockReset();
    mockGetServerSession.mockReset();
  });

  // ── Create study plan ─────────────────────────────────────────────────────

  test("should create study plan (lecturer)", async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockCreate.mockResolvedValue(samplePlan);

    const req = buildPostRequest({
      title: "Algorithms Revision",
      subject: "IT2030",
      description: "Cover dynamic programming chapter",
      date: "2026-05-05",
      time: "09:00",
      day: "MON",
      priority: "High",
      semester: "1",
      year: 2,
      venue: "Online",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.title).toBe("Algorithms Revision");
    expect(data.priority).toBe("High");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  // ── Fail to create without required fields ─────────────────────────────────

  test("should fail to create plan without required fields", async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);

    // Missing title
    const req = buildPostRequest({
      subject: "IT2030",
      year: 2,
      semester: 1,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });

  // ── Fetch plans (student) ──────────────────────────────────────────────────

  test("should fetch plans for logged-in student", async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockFind.mockReturnValue({
      sort: jest.fn().mockResolvedValue([samplePlan]),
    });

    const req = buildGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].title).toBe("Algorithms Revision");
  });

  // ── Fetch plans: unauthenticated ───────────────────────────────────────────

  test("should return 401 when not authenticated on GET", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = buildGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/unauthorised/i);
  });

  // ── Delete plan (owner) ────────────────────────────────────────────────────

  test("should delete plan if user is the creator", async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockFindById.mockResolvedValue({
      ...samplePlan,
      createdBy: "drperera@my.sliit.lk",
    });
    mockFindByIdAndDelete.mockResolvedValue({});

    const req = buildDeleteRequest({ id: "plan_001" });
    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Planner entry deleted");
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith("plan_001");
  });

  // ── Delete plan (admin) ────────────────────────────────────────────────────

  test("should delete any plan as admin", async () => {
    mockGetServerSession.mockResolvedValue(adminSession);
    mockFindById.mockResolvedValue({
      ...samplePlan,
      createdBy: "drperera@my.sliit.lk", // different owner than admin
    });
    mockFindByIdAndDelete.mockResolvedValue({});

    const req = buildDeleteRequest({ id: "plan_001" });
    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Planner entry deleted");
  });

  // ── Delete plan: missing ID ────────────────────────────────────────────────

  test("should return 400 when deleting without an ID", async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);

    const req = buildDeleteRequest(); // no id param
    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/id required/i);
  });
});
