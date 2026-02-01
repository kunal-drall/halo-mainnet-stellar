import { vi, beforeEach, afterEach } from 'vitest';

// ============ Mock NextAuth ============
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth/options', () => ({
  authOptions: {
    providers: [],
    callbacks: {},
  },
}));

// ============ Mock Supabase Admin Client ============
const createMockQueryBuilder = (): any => {
  const mockBuilder: any = {
    from: vi.fn(() => mockBuilder),
    select: vi.fn(() => mockBuilder),
    insert: vi.fn(() => mockBuilder),
    update: vi.fn(() => mockBuilder),
    delete: vi.fn(() => mockBuilder),
    eq: vi.fn(() => mockBuilder),
    neq: vi.fn(() => mockBuilder),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    limit: vi.fn(() => mockBuilder),
    gte: vi.fn(() => mockBuilder),
    lte: vi.fn(() => mockBuilder),
    or: vi.fn(() => mockBuilder),
    in: vi.fn(() => mockBuilder),
  };
  return mockBuilder;
};

const mockSupabaseAdmin = createMockQueryBuilder();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabaseAdmin),
}));

// ============ Mock Stellar Contract Wrappers ============
vi.mock('@/lib/stellar/contracts/identity', () => ({
  identityContract: {
    buildBindWalletTransaction: vi.fn(),
    isBound: vi.fn(),
    getUniqueId: vi.fn(),
    getWallet: vi.fn(),
    getBindingCount: vi.fn(),
    getAdmin: vi.fn(),
  },
}));

vi.mock('@/lib/stellar/contracts/circle', () => ({
  circleContract: {
    buildCreateCircleTransaction: vi.fn(),
    buildJoinCircleTransaction: vi.fn(),
    buildJoinCircleByIdTransaction: vi.fn(),
    buildContributeTransaction: vi.fn(),
    buildProcessPayoutTransaction: vi.fn(),
    getCircleState: vi.fn(),
    getCircleByInvite: vi.fn(),
    isMember: vi.fn(),
    getContributionStatus: vi.fn(),
    getCircleCount: vi.fn(),
  },
}));

vi.mock('@/lib/stellar/contracts/credit', () => ({
  creditContract: {
    getScore: vi.fn(),
    getCreditData: vi.fn(),
    getScoreBreakdown: vi.fn(),
    getOnTimeRate: vi.fn(),
    getUserCount: vi.fn(),
    scoreTier: vi.fn((score: number) => {
      if (score < 450) return 'building';
      if (score < 600) return 'fair';
      if (score < 750) return 'good';
      return 'excellent';
    }),
    tierDisplayName: vi.fn((tier: string) => tier.charAt(0).toUpperCase() + tier.slice(1)),
    tierColor: vi.fn(),
    calculateOnTimeRate: vi.fn((total: number, onTime: number) =>
      total === 0 ? 100 : Math.round((onTime / total) * 100)
    ),
  },
}));

vi.mock('@/lib/stellar/client', () => ({
  stellarClient: {
    getAccount: vi.fn(),
    submitTransaction: vi.fn(),
    simulateTransaction: vi.fn(),
    prepareTransaction: vi.fn(),
    getContract: vi.fn(),
    getNetworkPassphrase: vi.fn(() => 'Test SDF Network ; September 2015'),
    getServer: vi.fn(),
  },
  CONTRACT_ADDRESSES: {
    identity: 'CBRQ7VYKMCNVBT5OGEQLDCNXUWE4OUWAP4BBIZ4MUHLVUD42JDQ5DWGY',
    credit: 'CCVZS2N5RBE5O6EBKQ2UW6M3EPGYU4VPTLDV3PMZEUX3PCHI4K42N6GH',
    circle: 'CDNSZTY4IIJ7Y45FDVRHTTUKLIXNM7P53ZWX3FQ7GHKJ23LSLF4TTJ33',
  },
  USDC_CONTRACT_ADDRESS: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
  addressToScVal: vi.fn(),
  bytesToScVal: vi.fn(),
  i128ToScVal: vi.fn(),
  u32ToScVal: vi.fn(),
  u64ToScVal: vi.fn(),
  symbolToScVal: vi.fn(),
  simulateContractCall: vi.fn(),
  scValToBool: vi.fn(),
  scValToU32: vi.fn(),
  scValToU64: vi.fn(),
  scValToI128: vi.fn(),
  scValToBytes: vi.fn(),
  scValToAddress: vi.fn(),
  scValToSymbol: vi.fn(),
  scValToMap: vi.fn(),
  scValToVec: vi.fn(),
  scValIsNone: vi.fn(),
}));

// ============ Mock Email Client ============
vi.mock('@/lib/email/client', () => ({
  emailClient: {
    send: vi.fn(() => Promise.resolve({ id: 'mock-email-id' })),
  },
}));

// ============ Test Utilities ============

/**
 * Create a mock authenticated session
 */
export function createMockSession(overrides: Partial<{
  user: { id: string; email: string; name: string };
  expires: string;
}> = {}) {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      ...overrides.user,
    },
    expires: overrides.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Create a mock user record
 */
export function createMockUser(overrides: Partial<{
  id: string;
  email: string;
  name: string;
  kyc_status: string;
  wallet_address: string | null;
  unique_id: string | null;
}> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    kyc_status: 'approved',
    wallet_address: 'GDKUDGFWBHGHXVPWT7RCJANSC46XSBO2I5ZVJXOXUDVSC74KMIT7P4JZ',
    unique_id: '0'.repeat(64),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock circle record
 */
export function createMockCircle(overrides: Partial<{
  id: string;
  name: string;
  status: string;
  contribution_amount: number;
  total_members: number;
  current_period: number;
  creator_id: string;
  invite_code: string;
}> = {}) {
  return {
    id: 'test-circle-id',
    name: 'Test Circle',
    status: 'forming',
    contribution_amount: 100000000, // 10 USDC
    total_members: 5,
    current_period: 0,
    creator_id: 'test-user-id',
    invite_code: 'TESTCODE123',
    period_length: 2592000, // 30 days
    grace_period: 604800, // 7 days
    late_fee_percent: 5,
    start_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock membership record
 */
export function createMockMembership(overrides: Partial<{
  id: string;
  circle_id: string;
  user_id: string;
  position: number;
  joined_at: string;
}> = {}) {
  return {
    id: 'test-membership-id',
    circle_id: 'test-circle-id',
    user_id: 'test-user-id',
    position: 1,
    joined_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock contribution record
 */
export function createMockContribution(overrides: Partial<{
  id: string;
  circle_id: string;
  user_id: string;
  period: number;
  amount: number;
  is_late: boolean;
  late_fee: number;
  tx_hash: string;
}> = {}) {
  return {
    id: 'test-contribution-id',
    circle_id: 'test-circle-id',
    user_id: 'test-user-id',
    period: 1,
    amount: 100000000,
    is_late: false,
    late_fee: 0,
    tx_hash: 'mock-tx-hash',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock credit score record
 */
export function createMockCreditScore(overrides: Partial<{
  id: string;
  user_id: string;
  score: number;
  total_payments: number;
  on_time_payments: number;
  late_payments: number;
  missed_payments: number;
  circles_completed: number;
  circles_defaulted: number;
}> = {}) {
  return {
    id: 'test-credit-id',
    user_id: 'test-user-id',
    score: 450,
    total_payments: 5,
    on_time_payments: 4,
    late_payments: 1,
    missed_payments: 0,
    circles_completed: 1,
    circles_defaulted: 0,
    total_volume: 500000000,
    last_synced: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Reset all mocks before each test
 */
beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Clean up after each test
 */
afterEach(() => {
  vi.resetAllMocks();
});

// Export the mock for direct manipulation in tests
export { mockSupabaseAdmin };
