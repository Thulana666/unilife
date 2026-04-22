/**
 * tests/notifications/notifications.test.js
 * Feature: Notifications
 *
 * Tests POST (create), GET (fetch by role), and PATCH (mark as read)
 * routes in app/api/notifications/route.js.
 *
 * Mocks:
 *  - lib/db            → no real DB
 *  - models/Notification → controlled CRUD / update
 *  - next-auth         → mock session per role
 *  - lib/authOptions   → required by getServerSession
 */

import { GET, POST, PATCH } from "@/app/api/notifications/route";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("@/lib/db", () => jest.fn().mockResolvedValue(undefined));
jest.mock("@/lib/authOptions", () => ({ authOptions: {} }));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args) => mockGetServerSession(...args),
}));

const mockFind = jest.fn();
const mockCreate = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockUpdateMany = jest.fn();

jest.mock("@/models/Notification", () => ({
  __esModule: true,
  default: {
    find: (...args) => mockFind(...args),
    create: (...args) => mockCreate(...args),
    findByIdAndUpdate: (...args) => mockFindByIdAndUpdate(...args),
    updateMany: (...args) => mockUpdateMany(...args),
  },
}));

// ─── Fixture sessions ────────────────────────────────────────────────────────

const adminSession = {
  user: {
    id: "adm_001",
    name: "Admin User",
    email: "admin@my.sliit.lk",
    role: "admin",
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

const lecturerSession = {
  user: {
    id: "lec_001",
    name: "Dr. Perera",
    email: "drperera@my.sliit.lk",
    role: "lecturer",
  },
};

// ─── Fixture data ─────────────────────────────────────────────────────────────

/**
 * Helper that builds a mock Mongoose document with a toObject() method.
 */
function makeNotif(overrides = {}) {
  const doc = {
    _id: "notif_001",
    recipientRole: "student",
    recipientYear: 2,
    recipientSemester: 1,
    title: "📚 New Assignment",
    message: "Lab report due Friday.",
    type: "assignment",
    link: "/dashboard/assignments",
    readBy: [],
    createdBy: "drperera@my.sliit.lk",
    createdAt: new Date(),
    ...overrides,
  };
  doc.toObject = () => ({ ...doc });
  return doc;
}

function buildGetRequest(params = {}) {
  const url = new URL("http://localhost/api/notifications");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() };
}

function buildPostRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}

function buildPatchRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Feature: Notifications", () => {
  beforeEach(() => {
    mockFind.mockReset();
    mockCreate.mockReset();
    mockFindByIdAndUpdate.mockReset();
    mockUpdateMany.mockReset();
    mockGetServerSession.mockReset();
  });

  // ── Create notification (admin only) ──────────────────────────────────────

  test("should create notification (admin)", async () => {
    mockGetServerSession.mockResolvedValue(adminSession);
    const created = makeNotif();
    mockCreate.mockResolvedValue(created);

    const req = buildPostRequest({
      recipientRole: "student",
      recipientYear: 2,
      recipientSemester: 1,
      title: "📚 New Assignment",
      message: "Lab report due Friday.",
      type: "assignment",
      link: "/dashboard/assignments",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.title).toBe("📚 New Assignment");
    expect(data.recipientRole).toBe("student");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  // ── Create notification: non-admin forbidden ───────────────────────────────

  test("should return 401 when a non-admin tries to create notification", async () => {
    mockGetServerSession.mockResolvedValue(studentSession);

    const req = buildPostRequest({
      recipientRole: "student",
      title: "Unauthorised test",
      message: "Should not be stored",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/unauthorised/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // ── Fetch notifications by role (admin → all) ──────────────────────────────

  test("should fetch notifications for admin (sees all)", async () => {
    mockGetServerSession.mockResolvedValue(adminSession);

    const notifs = [makeNotif(), makeNotif({ _id: "notif_002", recipientRole: "lecturer" })];
    mockFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(notifs),
    });

    const req = buildGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(Array.isArray(data.notifications)).toBe(true);
    expect(data.notifications.length).toBe(2);
    expect(typeof data.unreadCount).toBe("number");
  });

  // ── Fetch notifications: student filtered by semester ──────────────────────

  test("should filter notifications by semester for student", async () => {
    mockGetServerSession.mockResolvedValue(studentSession);

    const studentNotif = makeNotif({ recipientYear: 2, recipientSemester: 1 });
    mockFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([studentNotif]),
    });

    const req = buildGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(data.notifications[0].recipientYear).toBe(2);
    expect(data.notifications[0].recipientSemester).toBe(1);
    // This is a student-targeted notif and the student hasn't read it yet
    expect(data.notifications[0].isRead).toBe(false);
    expect(data.unreadCount).toBe(1);
  });

  // ── Fetch notifications: lecturer ─────────────────────────────────────────

  test("should fetch lecturer notifications by role", async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);

    const lecturerNotif = makeNotif({ recipientRole: "lecturer" });
    mockFind.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([lecturerNotif]),
    });

    const req = buildGetRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(data.notifications[0].recipientRole).toBe("lecturer");
  });

  // ── Mark single notification as read ──────────────────────────────────────

  test("should mark notification as read", async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockFindByIdAndUpdate.mockResolvedValue({});

    const req = buildPatchRequest({ notificationId: "notif_001" });
    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/marked as read/i);
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      "notif_001",
      { $addToSet: { readBy: "IT23319110@my.sliit.lk" } }
    );
  });

  // ── Mark all notifications as read ────────────────────────────────────────

  test("should mark all notifications as read", async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockUpdateMany.mockResolvedValue({ modifiedCount: 3 });

    const req = buildPatchRequest({ markAllRead: true });
    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toMatch(/all marked as read/i);
    expect(mockUpdateMany).toHaveBeenCalledTimes(1);
  });

  // ── Create: missing required fields ───────────────────────────────────────

  test("should fail to create notification without required fields", async () => {
    mockGetServerSession.mockResolvedValue(adminSession);

    // Missing 'message'
    const req = buildPostRequest({
      recipientRole: "student",
      title: "Incomplete notification",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/required/i);
  });
});
