import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET, POST } from '@/app/api/circles/route';
import { createAdminClient } from '@/lib/supabase/admin';
import { createMockSession, createMockUser, createMockCircle } from '../setup';

// Type the mocked functions
const mockedGetServerSession = vi.mocked(getServerSession);
const mockedCreateAdminClient = vi.mocked(createAdminClient);

// Helper to create a chainable supabase mock
function createSupabaseMock(mockData: { data: any; error: any } = { data: null, error: null }) {
  const chainable: any = {};
  chainable.from = vi.fn(() => chainable);
  chainable.select = vi.fn(() => chainable);
  chainable.insert = vi.fn(() => chainable);
  chainable.update = vi.fn(() => chainable);
  chainable.delete = vi.fn(() => chainable);
  chainable.eq = vi.fn(() => chainable);
  chainable.neq = vi.fn(() => chainable);
  chainable.in = vi.fn(() => chainable);
  chainable.order = vi.fn(() => Promise.resolve(mockData));
  chainable.single = vi.fn(() => Promise.resolve(mockData));
  chainable.maybeSingle = vi.fn(() => Promise.resolve(mockData));
  chainable.limit = vi.fn(() => chainable);
  return chainable;
}

describe('GET /api/circles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedGetServerSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/circles');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns user circles when authenticated', async () => {
    const session = createMockSession();
    mockedGetServerSession.mockResolvedValueOnce(session);

    const mockCircles = [
      {
        payout_position: 1,
        has_received_payout: false,
        joined_at: new Date().toISOString(),
        circles: createMockCircle({ name: 'Circle 1' }),
      },
      {
        payout_position: 2,
        has_received_payout: false,
        joined_at: new Date().toISOString(),
        circles: createMockCircle({ id: 'circle-2', name: 'Circle 2' }),
      },
    ];

    const supabaseMock = createSupabaseMock({ data: mockCircles, error: null });
    mockedCreateAdminClient.mockReturnValue(supabaseMock);

    const request = new NextRequest('http://localhost:3000/api/circles');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.circles).toHaveLength(2);
    expect(json.circles[0].circles.name).toBe('Circle 1');
  });

  it('returns 500 when database error occurs', async () => {
    const session = createMockSession();
    mockedGetServerSession.mockResolvedValueOnce(session);

    const supabaseMock = createSupabaseMock({
      data: null,
      error: { message: 'Database error' }
    });
    mockedCreateAdminClient.mockReturnValue(supabaseMock);

    const request = new NextRequest('http://localhost:3000/api/circles');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to fetch circles');
  });
});

describe('POST /api/circles', () => {
  const validCircleData = {
    name: 'Test Circle',
    contributionAmount: 100,
    memberCount: 5,
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockedGetServerSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/circles', {
      method: 'POST',
      body: JSON.stringify(validCircleData),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 404 when user not found in database', async () => {
    const session = createMockSession();
    mockedGetServerSession.mockResolvedValueOnce(session);

    const supabaseMock = createSupabaseMock({ data: null, error: null });
    mockedCreateAdminClient.mockReturnValue(supabaseMock);

    const request = new NextRequest('http://localhost:3000/api/circles', {
      method: 'POST',
      body: JSON.stringify(validCircleData),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('User not found');
  });

  it('returns 400 when name is too short', async () => {
    const session = createMockSession();
    (session.user as any).onboardingCompleted = true;
    mockedGetServerSession.mockResolvedValueOnce(session);

    const request = new NextRequest('http://localhost:3000/api/circles', {
      method: 'POST',
      body: JSON.stringify({ ...validCircleData, name: 'AB' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 when member count is invalid', async () => {
    const session = createMockSession();
    (session.user as any).onboardingCompleted = true;
    mockedGetServerSession.mockResolvedValueOnce(session);

    const request = new NextRequest('http://localhost:3000/api/circles', {
      method: 'POST',
      body: JSON.stringify({ ...validCircleData, memberCount: 2 }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 when member count exceeds maximum', async () => {
    const session = createMockSession();
    (session.user as any).onboardingCompleted = true;
    mockedGetServerSession.mockResolvedValueOnce(session);

    const request = new NextRequest('http://localhost:3000/api/circles', {
      method: 'POST',
      body: JSON.stringify({ ...validCircleData, memberCount: 15 }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 when contribution amount is too low', async () => {
    const session = createMockSession();
    (session.user as any).onboardingCompleted = true;
    mockedGetServerSession.mockResolvedValueOnce(session);

    const request = new NextRequest('http://localhost:3000/api/circles', {
      method: 'POST',
      body: JSON.stringify({ ...validCircleData, contributionAmount: 5 }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 when start date is too soon', async () => {
    const session = createMockSession();
    (session.user as any).onboardingCompleted = true;
    mockedGetServerSession.mockResolvedValueOnce(session);

    const mockUser = createMockUser();

    // Create a more complex mock that handles different tables
    const supabaseMock: any = {};
    supabaseMock.from = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
            })),
          })),
        };
      }
      if (table === 'memberships') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ count: 0 })),
            })),
          })),
        };
      }
      return supabaseMock;
    });
    mockedCreateAdminClient.mockReturnValue(supabaseMock);

    const request = new NextRequest('http://localhost:3000/api/circles', {
      method: 'POST',
      body: JSON.stringify({
        ...validCircleData,
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Start date must be at least 3 days from today');
  });

  it('returns 400 when wallet not bound', async () => {
    const session = createMockSession();
    (session.user as any).onboardingCompleted = true;
    mockedGetServerSession.mockResolvedValueOnce(session);

    const mockUser = createMockUser({ wallet_address: null });
    const supabaseMock = createSupabaseMock({ data: mockUser, error: null });
    mockedCreateAdminClient.mockReturnValue(supabaseMock);

    const request = new NextRequest('http://localhost:3000/api/circles', {
      method: 'POST',
      body: JSON.stringify(validCircleData),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Please connect your wallet first');
  });

  it('returns 400 when user has too many active circles', async () => {
    const session = createMockSession();
    (session.user as any).onboardingCompleted = true;
    mockedGetServerSession.mockResolvedValueOnce(session);

    const mockUser = createMockUser();

    const supabaseMock: any = {};
    supabaseMock.from = vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
            })),
          })),
        };
      }
      if (table === 'memberships') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ count: 3 })),
            })),
          })),
        };
      }
      return supabaseMock;
    });
    mockedCreateAdminClient.mockReturnValue(supabaseMock);

    const request = new NextRequest('http://localhost:3000/api/circles', {
      method: 'POST',
      body: JSON.stringify(validCircleData),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Maximum 3 active circles allowed');
  });
});
