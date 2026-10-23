import { CODE_ALPHABET, CODE_LENGTH, generateCode } from './games.service.js';

describe('generateCode', () => {
  it('returns codes of the right length using only the allowed letters', () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateCode();
      expect(code).toHaveLength(CODE_LENGTH);
      for (const ch of code) expect(CODE_ALPHABET).toContain(ch);
    }
  });
});
