
const mockQuery = jest.fn();

const mPool = {
    query: mockQuery,
    connect: jest.fn().mockResolvedValue({
        query: mockQuery,
        release: jest.fn()
    }),
    end: jest.fn(),
    on: jest.fn()
};

// The Pool constructor mock
const Pool = jest.fn(() => mPool);

// Expose the mockQuery on the constructor for easy access in tests
Pool.mockQuery = mockQuery;

module.exports = {
    Pool,
    mockQuery, // Export directly
    types: {
        setTypeParser: jest.fn()
    }
};
