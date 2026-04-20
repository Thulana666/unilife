/**
 * tests/notes/notes.test.js
 * Feature: Notes
 *
 * Tests POST (upload note), GET (fetch by semester), and DELETE routes
 * in app/api/notes/route.js.
 *
 * Mocks:
 *  - lib/db                → no real DB
 *  - models/Notes          → controlled CRUD
 *  - lib/cloudinary        → file uploads skipped
 *  - lib/pushNotification  → side-effect silenced
 *  - next-auth             → mock session per role
 *  - lib/authOptions       → required by getServerSession
 *
 * Note: The POST route only accepts multipart/form-data, so our request
 * mock returns a FormData-like object and the appropriate content-type header.
 */

import { GET, POST, DELETE } from "@/app/api/notes/route";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("@/lib/db", () => jest.fn().mockResolvedValue(undefined));
jest.mock("@/lib/authOptions", () => ({ authOptions: {} }));
jest.mock("@/lib/pushNotification", () => ({
  pushNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/cloudinary", () => ({
  __esModule: true,
  default: {
    uploader: {
      upload_stream: jest.fn((_opts, cb) => ({
        // Returns a writable-stream-like object whose .end() triggers the callback
        end: jest.fn(() =>
          cb(null, {
            secure_url:
              "https://res.cloudinary.com/unilife/raw/upload/test_note.pdf",
          })
        ),
      })),
    },
  },
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args) => mockGetServerSession(...args),
}));

const mockFind = jest.fn();
const mockCreate = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndDelete = jest.fn();

jest.mock("@/models/Notes", () => ({
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

const adminSession = {
  user: {
    id: "adm_001",
    name: "Admin User",
    email: "admin@my.sliit.lk",
    role: "admin",
  },
};

// ─── Fixture data ─────────────────────────────────────────────────────────────

const sampleNote = {
  _id: "note_001",
  title: "Data Structures Lecture 1",
  description: "Introduction to arrays and linked lists",
  subject: "IT2020",
  fileUrl: "https://res.cloudinary.com/unilife/raw/upload/ds_lec1.pdf",
  fileName: "ds_lec1.pdf",
  fileType: "application/pdf",
  year: 2,
  semester: 1,
  uploadedBy: "drperera@my.sliit.lk",
  uploadedByName: "Dr. Perera",
  uploaderRole: "lecturer",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGetRequest(params = {}) {
  const url = new URL("http://localhost/api/notes");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() };
}

/**
 * Build a multipart POST request mock.  The file mock is an object with
 * arrayBuffer() so the Cloudinary upload branch is exercised.
 */
function buildPostRequest(fields = {}, includeFile = true) {
  const fakeFile = includeFile
    ? {
        name: "test_note.pdf",
        type: "application/pdf",
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      }
    : null;

  // Use a plain object (not Map) so spread works correctly
  const formData = {
    title: "Data Structures Lecture 1",
    description: "Introduction to arrays and linked lists",
    subject: "IT2020",
    year: "2",
    semester: "1",
    ...fields,
  };

  return {
    headers: {
      get: (name) =>
        name === "content-type" ? "multipart/form-data" : null,
    },
    formData: jest.fn().mockResolvedValue({
      get: (key) => {
        if (key === "file") return fakeFile;
        return Object.prototype.hasOwnProperty.call(formData, key)
          ? formData[key]
          : null;
      },
    }),
  };
}

function buildDeleteRequest(params = {}) {
  const url = new URL("http://localhost/api/notes");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Feature: Notes", () => {
  beforeEach(() => {
    mockFind.mockReset();
    mockCreate.mockReset();
    mockFindById.mockReset();
    mockFindByIdAndDelete.mockReset();
    mockGetServerSession.mockReset();
  });

  // ── Upload note ────────────────────────────────────────────────────────────

  test("should upload note with file (lecturer)", async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockCreate.mockResolvedValue(sampleNote);

    const req = buildPostRequest();
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.title).toBe("Data Structures Lecture 1");
    expect(data.subject).toBe("IT2020");
    expect(data.fileUrl).toMatch(/cloudinary/i);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  // ── Upload note: unauthenticated ───────────────────────────────────────────

  test("should return 403 when uploading note without authentication", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = buildPostRequest();
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/access denied/i);
  });

  // ── Fetch notes by semester (student) ─────────────────────────────────────

  test("should fetch notes by semester for a student", async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockFind.mockReturnValue({
      sort: jest.fn().mockResolvedValue([sampleNote]),
    });

    const req = buildGetRequest({ year: "2", semester: "1" });
    const res = await GET(req);
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].semester).toBe(1);
    expect(data[0].year).toBe(2);
  });

  // ── Fetch notes: unauthenticated ───────────────────────────────────────────

  test("should return 401 when fetching notes without authentication", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = buildGetRequest({ year: "2", semester: "1" });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/unauthorised/i);
  });

  // ── Delete note (admin) ────────────────────────────────────────────────────

  test("should delete note as admin", async () => {
    mockGetServerSession.mockResolvedValue(adminSession);
    mockFindById.mockResolvedValue({
      ...sampleNote,
      uploadedBy: "drperera@my.sliit.lk",
    });
    mockFindByIdAndDelete.mockResolvedValue({});

    const req = buildDeleteRequest({ id: "note_001" });
    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith("note_001");
  });

  // ── Delete note (owner) ────────────────────────────────────────────────────

  test("should delete note if user is the original uploader", async () => {
    mockGetServerSession.mockResolvedValue(lecturerSession);
    mockFindById.mockResolvedValue({
      ...sampleNote,
      uploadedBy: "drperera@my.sliit.lk", // same as session email
    });
    mockFindByIdAndDelete.mockResolvedValue({});

    const req = buildDeleteRequest({ id: "note_001" });
    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  // ── Delete note: forbidden (not owner, not admin) ──────────────────────────

  test("should return 403 when student tries to delete another user's note", async () => {
    mockGetServerSession.mockResolvedValue(studentSession);
    mockFindById.mockResolvedValue({
      ...sampleNote,
      uploadedBy: "drperera@my.sliit.lk", // different from student email
    });

    const req = buildDeleteRequest({ id: "note_001" });
    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toMatch(/access denied/i);
  });
});
