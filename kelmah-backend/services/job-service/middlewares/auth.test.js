const { authenticateUser, authorizeRoles } = require('./auth');
const jwt = require('jsonwebtoken');

describe('authenticateUser middleware', () => {
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

  it('should return 401 if no Authorization header', () => {
    authenticateUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    req.headers.authorization = 'Bearer invalidtoken';
    jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('fail'); });

    authenticateUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next for valid token', () => {
    const decoded = { userId: '123' };
    req.headers.authorization = 'Bearer validtoken';
    jest.spyOn(jwt, 'verify').mockReturnValue(decoded);

    authenticateUser(req, res, next);
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
  });
});

describe('authorizeRoles middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no req.user', () => {
    authorizeRoles('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user role not allowed', () => {
    req.user = { role: 'user' };
    authorizeRoles('admin', 'moderator')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: insufficient role' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if role is allowed', () => {
    req.user = { role: 'admin' };
    authorizeRoles('admin', 'user')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
}); 