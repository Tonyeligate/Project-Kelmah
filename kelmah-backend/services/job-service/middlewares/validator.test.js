const Joi = require('joi');
const { validate } = require('./validator');

describe('validate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next when schema validation passes', () => {
    const schema = Joi.object({ foo: Joi.string().required() });
    req.body = { foo: 'bar' };

    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 with error details when validation fails', () => {
    const schema = Joi.object({ foo: Joi.string().required().messages({ 'any.required': 'foo required' }) });
    req.body = {};

    validate(schema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation error',
      errors: expect.arrayContaining(['foo required'])
    });
    expect(next).not.toHaveBeenCalled();
  });
}); 