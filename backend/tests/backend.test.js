const { validate } = require('../src/middleware/validate');

const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe('validate middleware', () => {
  beforeEach(() => mockNext.mockClear());

  test('passes when all required fields present', () => {
    const mw = validate({ email: { required: true, isEmail: true } });
    const req = mockReq({ email: 'test@example.com' });
    const res = mockRes();
    mw(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('rejects missing required field', () => {
    const mw = validate({ email: { required: true } });
    const req = mockReq({});
    const res = mockRes();
    mw(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('rejects invalid email', () => {
    const mw = validate({ email: { required: true, isEmail: true } });
    const req = mockReq({ email: 'not-an-email' });
    const res = mockRes();
    mw(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('rejects field below minLength', () => {
    const mw = validate({ password: { required: true, minLength: 8 } });
    const req = mockReq({ password: 'short' });
    const res = mockRes();
    mw(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(422);
  });
});

const errorHandler = require('../src/middleware/errorHandler');

describe('errorHandler middleware', () => {
  const next = jest.fn();

  test('handles generic error with 500', () => {
    const err = new Error('Something broke');
    const res = mockRes();
    errorHandler(err, {}, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Something broke' })
    );
  });

  test('handles custom statusCode', () => {
    const err = new Error('Not found');
    err.statusCode = 404;
    const res = mockRes();
    errorHandler(err, {}, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('handles Multer LIMIT_FILE_SIZE', () => {
    const err = new Error('File too large');
    err.code = 'LIMIT_FILE_SIZE';
    const res = mockRes();
    errorHandler(err, {}, res, next);
    expect(res.status).toHaveBeenCalledWith(413);
  });

  test('handles Mongoose duplicate key (code 11000)', () => {
    const err = new Error('Duplicate');
    err.code = 11000;
    err.keyValue = { email: 'x@x.com' };
    const res = mockRes();
    errorHandler(err, {}, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('socket emitProgress', () => {
  test('does not throw when socket not initialised', () => {
    const { emitProgress } = require('../src/config/socket');
    expect(() => emitProgress('user123', 'video456', { stage: 'Test', progress: 50 })).not.toThrow();
  });
});
