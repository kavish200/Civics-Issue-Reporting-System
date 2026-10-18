const mongoose = require('mongoose');

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    model: jest.fn()
  };
});

const { findNearbyDuplicates, checkForDuplicates } = require('../shared/services/duplicates');

const mockFind = jest.fn();
const mockIssue = { find: mockFind };

beforeEach(() => {
  mongoose.model.mockReturnValue(mockIssue);
  mockFind.mockReset();
});

describe('findNearbyDuplicates', () => {
  const location = { type: 'Point', coordinates: [72.8777, 19.0760] };

  test('calls $nearSphere with correct radius for road_damage', async () => {
    mockFind.mockReturnValue({ lean: () => Promise.resolve([]) });
    await findNearbyDuplicates(location, 'road_damage');
    const query = mockFind.mock.calls[0][0];
    expect(query.location.$nearSphere.$maxDistance).toBe(30);
    expect(query.category).toBe('road_damage');
  });

  test('calls $nearSphere with correct radius for water', async () => {
    mockFind.mockReturnValue({ lean: () => Promise.resolve([]) });
    await findNearbyDuplicates(location, 'water');
    const query = mockFind.mock.calls[0][0];
    expect(query.location.$nearSphere.$maxDistance).toBe(100);
  });

  test('uses provided sinceDate for time filter', async () => {
    const sinceDate = new Date('2024-01-01');
    mockFind.mockReturnValue({ lean: () => Promise.resolve([]) });
    await findNearbyDuplicates(location, 'garbage', sinceDate);
    const query = mockFind.mock.calls[0][0];
    expect(query.createdAt.$gte).toEqual(sinceDate);
  });

  test('excludes Resolved and Rejected statuses', async () => {
    mockFind.mockReturnValue({ lean: () => Promise.resolve([]) });
    await findNearbyDuplicates(location, 'streetlight');
    const query = mockFind.mock.calls[0][0];
    expect(query.status.$nin).toContain('Resolved');
    expect(query.status.$nin).toContain('Rejected');
  });

  test('throws for unknown category', async () => {
    await expect(findNearbyDuplicates(location, 'unknown_cat')).rejects.toThrow('No duplicate rules for category: unknown_cat');
  });

  test('returns array from Issue.find', async () => {
    const mockIssues = [{ _id: '1', category: 'garbage' }];
    mockFind.mockReturnValue({ lean: () => Promise.resolve(mockIssues) });
    const result = await findNearbyDuplicates(location, 'garbage');
    expect(result).toEqual(mockIssues);
  });
});

describe('checkForDuplicates', () => {
  test('returns empty array when location or category missing', async () => {
    const r1 = await checkForDuplicates({ category: 'garbage' });
    const r2 = await checkForDuplicates({ location: {} });
    expect(r1).toEqual([]);
    expect(r2).toEqual([]);
  });

  test('returns empty array for unknown category', async () => {
    const result = await checkForDuplicates({
      location: { type: 'Point', coordinates: [72, 19] },
      category: 'unknown_xyz'
    });
    expect(result).toEqual([]);
  });
});
