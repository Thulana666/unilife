/**
 * tests/chat/chat.test.js
 * Feature: Chat System
 *
 * Tests the GET / POST routes in app/api/chat/route.js.
 *
 * Mocks:
 *  - lib/db                → no real DB connection
 *  - models/Message        → controlled find / create responses
 *  - lib/cloudinary        → file uploads skipped
 *  - lib/pushNotification  → fire-and-forget, not under test
 *  - next-auth             → mock session
 *  - lib/authOptions       → required by getServerSession
 */

import { GET, POST } from "@/app/api/chat/route";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("@/lib/db", () => jest.fn().mockResolvedValue(undefined));

jest.mock("@/lib/pushNotification", () => ({
  pushNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/cloudinary", () => ({
  __esModule: true,
  default: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

jest.mock("@/lib/authOptions", () => ({ authOptions: {} }));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      id: "user_001",
      name: "Thulana Silva",
      email: "IT23319110@my.sliit.lk",
      role: "student",
      year: 2,
      semester: 1,
    },
  }),
}));

const mockFind = jest.fn();
const mockCreate = jest.fn();
jest.mock("@/models/Message", () => ({
  __esModule: true,
  default: {
    find: (...args) => mockFind(...args),
    create: (...args) => mockCreate(...args),
  },
}));

// ─── Fixture data ─────────────────────────────────────────────────────────────

const sampleMessages = [
  {
    _id: "msg_001",
    text: "Hello everyone!",
    sender: "Thulana Silva",
    email: "IT23319110@my.sliit.lk",
    year: 2,
    semester: 1,
    fileUrl: null,
    isNotice: false,
  },
  {
    _id: "msg_002",
    text: "",
    sender: "Dr. Perera",
    email: "drperera@my.sliit.lk",
    year: 2,
    semester: 1,
    fileUrl: "https://res.cloudinary.com/unilife/raw/upload/chat_doc.pdf",
    fileName: "chat_doc.pdf",
    fileType: "application/pdf",
    isNotice: false,
  },
  {
    _id: "msg_003",
    text: "Final exams rescheduled to next week.",
    sender: "Admin User",
    email: "admin@my.sliit.lk",
    year: 2,
    semester: 1,
    fileUrl: null,
    isNotice: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGetRequest(params = {}) {
  const url = new URL(`http://localhost/api/chat`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() };
}

function buildPostRequest(formEntries = {}) {
  const formData = new Map(Object.entries(formEntries));
  return {
    formData: jest.fn().mockResolvedValue({
      get: (key) => formData.get(key) ?? null,
    }),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Feature: Chat System", () => {
  beforeEach(() => {
    mockFind.mockReset();
    mockCreate.mockReset();
    // Default: find returns chainable sort mock
    mockFind.mockReturnValue({ sort: jest.fn().mockResolvedValue(sampleMessages) });
  });

  // ── Fetch messages by year and semester ────────────────────────────────────

  test("should fetch messages by year and semester", async () => {
    const req = buildGetRequest({ year: "2", semester: "1" });
    const res = await GET(req);
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
    // Verify the query was built with correct year/semester
    expect(mockFind).toHaveBeenCalledWith({ year: "2", semester: "1" });
  });

  // ── Send a text message ────────────────────────────────────────────────────

  test("should send message", async () => {
    const savedMsg = {
      _id: "msg_new",
      text: "Study group at 3pm!",
      sender: "Thulana Silva",
      email: "IT23319110@my.sliit.lk",
      year: 2,
      semester: 1,
      fileUrl: null,
      isNotice: false,
    };
    mockCreate.mockResolvedValue(savedMsg);

    const req = buildPostRequest({
      text: "Study group at 3pm!",
      sender: "Thulana Silva",
      email: "IT23319110@my.sliit.lk",
      year: "2",
      semester: "1",
      isNotice: "false",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.text).toBe("Study group at 3pm!");
    expect(data.sender).toBe("Thulana Silva");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  // ── Sender stored correctly ────────────────────────────────────────────────

  test("should save sender correctly in the message", async () => {
    const savedMsg = {
      _id: "msg_004",
      text: "Hi!",
      sender: "Dr. Perera",
      email: "drperera@my.sliit.lk",
      year: 2,
      semester: 1,
      isNotice: false,
    };
    mockCreate.mockResolvedValue(savedMsg);

    const req = buildPostRequest({
      text: "Hi!",
      sender: "Dr. Perera",
      email: "drperera@my.sliit.lk",
      year: "2",
      semester: "1",
      isNotice: "false",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.sender).toBe("Dr. Perera");
    expect(data.email).toBe("drperera@my.sliit.lk");
  });

  // ── Attachment – fileUrl present ───────────────────────────────────────────

  test("should handle message with attachment (fileUrl exists in DB record)", async () => {
    // When a file upload has already been processed and Message.create
    // persists it, verify fileUrl is non-null in the response.
    const savedMsgWithFile = {
      _id: "msg_005",
      text: "",
      sender: "Dr. Perera",
      email: "drperera@my.sliit.lk",
      year: 2,
      semester: 1,
      fileUrl: "https://res.cloudinary.com/unilife/raw/upload/chat_doc.pdf",
      fileName: "chat_doc.pdf",
      fileType: "application/pdf",
      isNotice: false,
    };
    mockCreate.mockResolvedValue(savedMsgWithFile);

    // Simulate a POST without a real File object (no file key in FormData)
    const req = buildPostRequest({
      text: "",
      sender: "Dr. Perera",
      email: "drperera@my.sliit.lk",
      year: "2",
      semester: "1",
      isNotice: "false",
      // No 'file' key → Cloudinary branch is skipped
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.fileUrl).toBe(
      "https://res.cloudinary.com/unilife/raw/upload/chat_doc.pdf"
    );
    expect(data.fileName).toBe("chat_doc.pdf");
  });

  // ── Special notice (isNotice = true) ──────────────────────────────────────

  test("should handle special notice (isNotice = true)", async () => {
    const noticeMsg = {
      _id: "msg_006",
      text: "Lab cancelled tomorrow.",
      sender: "Admin User",
      email: "admin@my.sliit.lk",
      year: 2,
      semester: 1,
      fileUrl: null,
      isNotice: true,
    };
    mockCreate.mockResolvedValue(noticeMsg);

    const req = buildPostRequest({
      text: "Lab cancelled tomorrow.",
      sender: "Admin User",
      email: "admin@my.sliit.lk",
      year: "2",
      semester: "1",
      isNotice: "true",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.isNotice).toBe(true);
    expect(data.text).toMatch(/Lab cancelled/i);
  });
});
