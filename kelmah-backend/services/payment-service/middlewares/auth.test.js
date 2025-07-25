const { authenticate } = require('./auth');
const jwt = require('jsonwebtoken');

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

  it('returns 401 if no Authorization header', () => {
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if token is invalid', () => {
    req.headers.authorization = 'Bearer badtoken';
    jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('invalid'); });

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next for a valid token', () => {
    const decoded = { id: 'user123' };
    req.headers.authorization = 'Bearer goodtoken';
    jest.spyOn(jwt, 'verify').mockReturnValue(decoded);

    authenticate(req, res, next);
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
  });
}); 