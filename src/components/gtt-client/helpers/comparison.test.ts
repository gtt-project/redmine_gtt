import { describe, it, expect, vi } from 'vitest';

import { evaluateComparison } from './comparison';

// evaluateComparison(left, operator, right): `left` is the actual geocoder
// API value, used as-is; `right` is the admin-configured operand, parsed the
// way the former Function() evaluator interpreted JS literals.
describe('evaluateComparison', () => {
  describe('operators', () => {
    it('treats "200" and 200 as equal under loose equality (the documented case)', () => {
      expect(evaluateComparison(200, '==', '200')).toBe(true);
      expect(evaluateComparison('200', '==', '200')).toBe(true);
    });

    it('supports loose inequality', () => {
      expect(evaluateComparison(200, '!=', '201')).toBe(true);
      expect(evaluateComparison(200, '!=', '200')).toBe(false);
    });

    it('supports strict equality (operand parsed to its literal type)', () => {
      // right "200" parses to the number 200, so a numeric left matches
      expect(evaluateComparison(200, '===', '200')).toBe(true);
      // a string left does not strictly equal the parsed number
      expect(evaluateComparison('200', '===', '200')).toBe(false);
    });

    it('supports strict inequality', () => {
      expect(evaluateComparison('200', '!==', '200')).toBe(true);
      expect(evaluateComparison(200, '!==', '200')).toBe(false);
    });

    it('supports the ordering operators', () => {
      expect(evaluateComparison(5, '>', '3')).toBe(true);
      expect(evaluateComparison(3, '>', '5')).toBe(false);
      expect(evaluateComparison(5, '>=', '5')).toBe(true);
      expect(evaluateComparison(3, '<', '5')).toBe(true);
      expect(evaluateComparison(5, '<=', '5')).toBe(true);
      expect(evaluateComparison(6, '<=', '5')).toBe(false);
    });

    it('trims surrounding whitespace from the operator', () => {
      expect(evaluateComparison(1, ' == ', '1')).toBe(true);
    });

    it('returns false and logs for an unknown operator', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(evaluateComparison(1, 'LIKE', 1)).toBe(false);
      expect(error).toHaveBeenCalledOnce();
      error.mockRestore();
    });
  });

  describe('operand parsing', () => {
    it('strips single quotes to keep a numeric-looking string a string', () => {
      expect(evaluateComparison('200', '===', "'200'")).toBe(true);
      expect(evaluateComparison(200, '===', "'200'")).toBe(false);
    });

    it('matches a quoted text operand', () => {
      expect(evaluateComparison('OK', '==', "'OK'")).toBe(true);
      expect(evaluateComparison('OK', '===', "'OK'")).toBe(true);
    });

    it('parses an unquoted text operand as a bare string (JSON fallback)', () => {
      // The old Function() evaluator threw ReferenceError for a bare-string
      // left operand; the lookup table compares them as plain strings.
      expect(evaluateComparison('OK', '==', 'OK')).toBe(true);
      expect(evaluateComparison('OK', '!=', 'NG')).toBe(true);
    });

    it('parses JS numeric forms that JSON rejects', () => {
      expect(evaluateComparison(1, '===', '+1')).toBe(true);
      expect(evaluateComparison(0.5, '===', '.5')).toBe(true);
      expect(evaluateComparison(16, '===', '0x10')).toBe(true);
    });

    it('parses boolean and undefined literals', () => {
      expect(evaluateComparison(true, '===', 'true')).toBe(true);
      expect(evaluateComparison(false, '===', 'false')).toBe(true);
      expect(evaluateComparison(undefined, '===', 'undefined')).toBe(true);
    });

    it('treats NaN as a number, not the string "NaN"', () => {
      // NaN never equals anything, so the comparison is false, but the point
      // is that the operand is parsed numerically rather than as text.
      expect(evaluateComparison('NaN', '===', 'NaN')).toBe(false);
      expect(evaluateComparison(5, '>', 'NaN')).toBe(false);
    });

    it('leaves a non-string operand untouched', () => {
      expect(evaluateComparison(200, '===', 200)).toBe(true);
      expect(evaluateComparison(true, '===', true)).toBe(true);
    });
  });
});
