const Wallet = require('../models/Wallet');

describe('Payment service schema guards', () => {
  test('Wallet enforces one wallet per user', () => {
    expect(Wallet.schema.indexes()).toEqual(expect.arrayContaining([
      [
        { user: 1 },
        expect.objectContaining({ unique: true }),
      ],
    ]));
  });
});
