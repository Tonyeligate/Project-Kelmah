jest.mock('../../../shared/utils/jwt', () => ({
  verifyAccessToken: jest.fn(),
  decodeUserFromClaims: jest.fn(),
}));

jest.mock('../models', () => ({
  User: {
    findById: jest.fn(),
  },
}));

const { authenticate } = require('./auth');
const jwtUtils = require('../../../shared/utils/jwt');
const { User } = require('../models');

describe('payment-service authenticate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('returns 401 if no Authorization header', async () => {
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer badtoken';
    jwtUtils.verifyAccessToken.mockRejectedValue(new Error('invalid'));

    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token user no longer exists', async () => {
    const claims = { sub: 'deleted-user', email: 'u@e.com', role: 'user', version: 0 };
    req.headers.authorization = 'Bearer gone';
    jwtUtils.verifyAccessToken.mockResolvedValue(claims);
    jwtUtils.decodeUserFromClaims.mockReturnValue({ id: 'deleted-user', email: 'u@e.com', role: 'user', version: 0 });
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User no longer exists' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when the token user is inactive', async () => {
    const claims = { sub: 'inactive-user', email: 'u@e.com', role: 'user', version: 0 };
    req.headers.authorization = 'Bearer inactive';
    jwtUtils.verifyAccessToken.mockResolvedValue(claims);
    jwtUtils.decodeUserFromClaims.mockReturnValue({ id: 'inactive-user', email: 'u@e.com', role: 'user', version: 0 });
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => 'inactive-user' },
          email: 'u@e.com',
          role: 'user',
          isActive: false,
          tokenVersion: 0,
        }),
      }),
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Account is inactive' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next for a valid active token', async () => {
    const claims = { sub: 'user123', email: 'u@e.com', role: 'user', version: 0 };
    req.headers.authorization = 'Bearer goodtoken';
    jwtUtils.verifyAccessToken.mockResolvedValue(claims);
    jwtUtils.decodeUserFromClaims.mockReturnValue({ id: 'user123', email: 'u@e.com', role: 'user', version: 0 });
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: { toString: () => 'user123' },
          email: 'u@e.com',
          role: 'user',
          isActive: true,
          tokenVersion: 0,
        }),
      }),
    });

    await authenticate(req, res, next);
    expect(req.user).toEqual({ id: 'user123', _id: 'user123', email: 'u@e.com', role: 'user', version: 0 });
    expect(next).toHaveBeenCalled();
  });
}); 