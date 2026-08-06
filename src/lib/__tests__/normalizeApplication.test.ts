import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock all Firebase SDK modules BEFORE importing firebase.ts.
// firebase.ts runs module-level code (initializeApp, getFirestore, getAuth)
// that would fail in a Node/vitest environment without mocks.
// ---------------------------------------------------------------------------

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocFromServer: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('../../firebase-applet-config.json', () => ({
  default: {
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123',
  },
}));

// Now it is safe to import the function under test.
import { normalizeApplication } from '../firebase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fully-formed nested application document (data sub-object style). */
function makeNestedApp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test_id_001',
    email: 'Alice@Example.COM',
    status: 'submitted',
    lastSavedAt: '2025-01-01T00:00:00.000Z',
    submittedAt: '2025-01-02T00:00:00.000Z',
    data: {
      firstName: 'Alice',
      lastName: 'Smith',
      middleName: 'Jo',
      dateOfBirth: '1990-01-01',
      phone: '555-0100',
      address: '123 Main St',
      employment: 'Engineer',
      position: 'Senior',
      degrees: 'BS Computer Science',
      honors: 'Magna Cum Laude',
      organizations: 'ACM',
      priorKnowledge: 'Some',
      essay1: 'Essay one text',
      essay2: '',
      essay3: '',
      essay4: '',
      essay5: '',
      isFraternityMember: 'no',
      fraternityDetails: '',
      hasAkaFamily: 'no',
      akaFamilyDetails: '',
      previousApplied: 'no',
      previousAppliedDetails: '',
      socialUrls: 'https://linkedin.com/in/alice',
    },
    ...overrides,
  };
}

/** Build a flat application document (no .data sub-object). */
function makeFlatApp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'flat_id_002',
    email: 'bob@example.com',
    status: 'draft',
    lastSavedAt: '2025-02-01T00:00:00.000Z',
    firstName: 'Bob',
    lastName: 'Jones',
    middleName: '',
    dateOfBirth: '1985-06-15',
    phone: '555-0200',
    address: '456 Oak Ave',
    employment: 'Teacher',
    position: 'Lead',
    degrees: 'BA Education',
    honors: '',
    organizations: '',
    priorKnowledge: '',
    essay1: 'My story',
    essay2: '',
    essay3: '',
    essay4: '',
    essay5: '',
    isFraternityMember: false,
    fraternityDetails: '',
    hasAkaFamily: false,
    akaFamilyDetails: '',
    previousApplied: false,
    previousAppliedDetails: '',
    socialUrls: '',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('normalizeApplication', () => {
  // ── 1. Null / undefined guard ─────────────────────────────────────────────
  describe('returns null for falsy input', () => {
    it('returns null when called with null', () => {
      expect(normalizeApplication(null)).toBeNull();
    });

    it('returns null when called with undefined', () => {
      expect(normalizeApplication(undefined)).toBeNull();
    });

    it('returns null when called with false', () => {
      expect(normalizeApplication(false)).toBeNull();
    });

    it('returns null when called with 0', () => {
      expect(normalizeApplication(0)).toBeNull();
    });
  });

  // ── 2. Perfectly-formed nested document (.data sub-object) ────────────────
  describe('nested document (app.data is an object)', () => {
    it('reads firstName from data.firstName', () => {
      const result = normalizeApplication(makeNestedApp());
      expect(result.data.firstName).toBe('Alice');
    });

    it('preserves all required top-level fields', () => {
      const result = normalizeApplication(makeNestedApp());
      expect(result).toMatchObject({
        id: 'test_id_001',
        email: 'alice@example.com', // lowercase normalised
        status: 'submitted',
      });
    });

    it('carries through lastSavedAt', () => {
      const result = normalizeApplication(makeNestedApp());
      expect(result.lastSavedAt).toBe('2025-01-01T00:00:00.000Z');
    });

    it('carries through submittedAt', () => {
      const result = normalizeApplication(makeNestedApp());
      expect(result.submittedAt).toBe('2025-01-02T00:00:00.000Z');
    });

    it('data.isFraternityMember is preserved from data sub-object', () => {
      const result = normalizeApplication(makeNestedApp());
      expect(result.data.isFraternityMember).toBe('no');
    });

    it('data.socialUrls is preserved from data sub-object', () => {
      const result = normalizeApplication(makeNestedApp());
      expect(result.data.socialUrls).toBe('https://linkedin.com/in/alice');
    });

    it('falls back to top-level firstName when data.firstName is missing', () => {
      const app = makeNestedApp();
      delete (app as any).data.firstName;
      (app as any).firstName = 'TopLevelAlice';
      const result = normalizeApplication(app);
      expect(result.data.firstName).toBe('TopLevelAlice');
    });
  });

  // ── 3. Flat document (no .data sub-object) ─────────────────────────────────
  describe('flat document (no app.data sub-object)', () => {
    it('reads firstName from top-level app.firstName', () => {
      const result = normalizeApplication(makeFlatApp());
      expect(result.data.firstName).toBe('Bob');
    });

    it('reads lastName from top-level app.lastName', () => {
      const result = normalizeApplication(makeFlatApp());
      expect(result.data.lastName).toBe('Jones');
    });

    it('coerces boolean false isFraternityMember to "no"', () => {
      const result = normalizeApplication(makeFlatApp({ isFraternityMember: false }));
      expect(result.data.isFraternityMember).toBe('no');
    });

    it('coerces boolean true isFraternityMember to "yes"', () => {
      const result = normalizeApplication(makeFlatApp({ isFraternityMember: true }));
      expect(result.data.isFraternityMember).toBe('yes');
    });

    it('coerces string "yes" isFraternityMember to "yes"', () => {
      const result = normalizeApplication(makeFlatApp({ isFraternityMember: 'yes' }));
      expect(result.data.isFraternityMember).toBe('yes');
    });

    it('preserves id from flat document', () => {
      const result = normalizeApplication(makeFlatApp());
      expect(result.id).toBe('flat_id_002');
    });

    it('preserves status from flat document', () => {
      const result = normalizeApplication(makeFlatApp());
      expect(result.status).toBe('draft');
    });

    it('also reads first_name (snake_case alias) for firstName', () => {
      const app = {
        id: 'snake_case_id',
        email: 'carol@example.com',
        first_name: 'Carol',
        last_name: 'White',
      };
      const result = normalizeApplication(app);
      expect(result.data.firstName).toBe('Carol');
    });
  });

  // ── 4. app.data is a JSON string ───────────────────────────────────────────
  describe('data as JSON string (should be parsed)', () => {
    it('parses a valid JSON string in app.data', () => {
      const jsonData = JSON.stringify({
        firstName: 'Dana',
        lastName: 'Brown',
        email: 'dana@example.com',
      });
      const app = {
        id: 'json_string_id',
        email: 'dana@example.com',
        data: jsonData,
      };
      const result = normalizeApplication(app);
      expect(result.data.firstName).toBe('Dana');
    });

    it('falls back to top-level fields when JSON string is malformed', () => {
      const app = {
        id: 'bad_json_id',
        email: 'evan@example.com',
        data: '{ bad json !!!',
        firstName: 'Evan',
      };
      const result = normalizeApplication(app);
      // dataObj will be null after failed parse → falls back to flat extraction
      expect(result.data.firstName).toBe('Evan');
    });

    it('does not throw on malformed JSON string', () => {
      const app = {
        email: 'fran@example.com',
        data: '{invalid json',
      };
      expect(() => normalizeApplication(app)).not.toThrow();
    });
  });

  // ── 5. Empty object — should return defaults, not crash ───────────────────
  describe('empty object', () => {
    it('does not throw on an empty object', () => {
      expect(() => normalizeApplication({})).not.toThrow();
    });

    it('returns status "draft" as default for empty object', () => {
      const result = normalizeApplication({});
      expect(result.status).toBe('draft');
    });

    it('returns empty string for data.firstName on empty object', () => {
      const result = normalizeApplication({});
      expect(result.data.firstName).toBe('');
    });

    it('generates an id from email when id is absent', () => {
      const result = normalizeApplication({ email: 'gen@example.com' });
      // id should contain something derived from the email
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('returns empty string for id-derived value when email is also absent', () => {
      const result = normalizeApplication({});
      expect(typeof result.id).toBe('string');
    });
  });

  // ── 6. Always returns shape { id, email, status, lastSavedAt, data } ──────
  describe('guaranteed output shape', () => {
    const cases = [
      { label: 'nested doc', input: makeNestedApp() },
      { label: 'flat doc', input: makeFlatApp() },
      { label: 'empty object', input: {} },
      { label: 'minimal email-only', input: { email: 'x@x.com' } },
    ];

    for (const { label, input } of cases) {
      it(`has all required fields for: ${label}`, () => {
        const result = normalizeApplication(input);
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('lastSavedAt');
        expect(result).toHaveProperty('data');
        expect(typeof result.data).toBe('object');
      });
    }
  });

  // ── 7. data.firstName is always a string, never undefined ─────────────────
  describe('data.firstName type guarantee', () => {
    it('is a string for nested doc', () => {
      expect(typeof normalizeApplication(makeNestedApp()).data.firstName).toBe('string');
    });

    it('is a string for flat doc', () => {
      expect(typeof normalizeApplication(makeFlatApp()).data.firstName).toBe('string');
    });

    it('is a string (empty) for empty object', () => {
      expect(typeof normalizeApplication({}).data.firstName).toBe('string');
    });

    it('is never undefined', () => {
      expect(normalizeApplication({}).data.firstName).not.toBeUndefined();
      expect(normalizeApplication(makeNestedApp()).data.firstName).not.toBeUndefined();
    });
  });

  // ── 8. Email is always normalised to lowercase ─────────────────────────────
  describe('email normalisation', () => {
    it('lowercases a mixed-case email', () => {
      const result = normalizeApplication({ email: 'Alice@Example.COM' });
      expect(result.email).toBe('alice@example.com');
    });

    it('trims whitespace from email', () => {
      const result = normalizeApplication({ email: '  bob@example.com  ' });
      expect(result.email).toBe('bob@example.com');
    });

    it('returns empty string when email is absent', () => {
      const result = normalizeApplication({});
      expect(result.email).toBe('');
    });

    it('lowercases the email from a nested doc', () => {
      const result = normalizeApplication(makeNestedApp({ email: 'ALICE@EXAMPLE.COM' }));
      expect(result.email).toBe('alice@example.com');
    });
  });
});
