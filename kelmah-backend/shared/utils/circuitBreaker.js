class CircuitBreaker {
  constructor(action, options = {}) {
    this.action = action;
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownMs = options.cooldownMs || 30000;
    this.timeoutMs = options.timeoutMs || 10000;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.nextTry = 0;
  }

  async fire(...args) {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now > this.nextTry) {
        this.state = 'HALF';
      } else {
        const err = new Error('Circuit open');
        err.code = 'CIRCUIT_OPEN';
        throw err;
      }
    }

    try {
      const result = await Promise.race([
        this.action(...args),
        new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('Timeout'), { code: 'ETIMEDOUT' })), this.timeoutMs))
      ]);
      this.success();
      return result;
    } catch (err) {
      this.fail();
      throw err;
    }
  }

  success() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  fail() {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextTry = Date.now() + this.cooldownMs;
    }
  }
}

module.exports = { CircuitBreaker };


