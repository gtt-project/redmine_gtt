/**
 * Safe comparison evaluation for the geocoder result checks.
 *
 * The operator and the expected value come from the admin-configured
 * geocoder options, the actual value from the geocoder API response.
 * Both used to be concatenated into JavaScript source and run through
 * Function(), which executed configuration and API data as code.
 * The lookup table below supports the same comparison operators
 * without evaluating anything.
 */

const OPERATORS: Record<string, (left: any, right: any) => boolean> = {
  // Loose equality is intentional: configured values are strings while
  // API responses may be numbers ("200" == 200).
  /* eslint-disable eqeqeq */
  '==': (left, right) => left == right,
  '!=': (left, right) => left != right,
  /* eslint-enable eqeqeq */
  '===': (left, right) => left === right,
  '!==': (left, right) => left !== right,
  '>': (left, right) => left > right,
  '>=': (left, right) => left >= right,
  '<': (left, right) => left < right,
  '<=': (left, right) => left <= right,
};

/**
 * Interpret a configured operand the way the former Function() based
 * evaluator did: values were JS literals, so "200" was a number,
 * "true" a boolean and "'OK'" a single-quoted string.
 */
function parseOperand(value: any): any {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (/^'.*'$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'undefined') {
    return undefined;
  }
  // Number() accepts the JS numeric forms JSON does not ('+1', '.5',
  // '08', '0x10', 'Infinity', 'NaN'); non-numeric strings fall through.
  if (trimmed !== '') {
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) || trimmed === 'NaN') {
      return numeric;
    }
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

/**
 * Evaluate a comparison between two values with a specified operator.
 *
 * @param left - The left-hand side value of the comparison.
 * @param operator - The operator to use in the comparison.
 * @param right - The right-hand side value of the comparison.
 * @returns The result of the comparison; false for unknown operators.
 */
export function evaluateComparison(left: any, operator: any, right: any): boolean {
  const compare = OPERATORS[String(operator).trim()];
  if (!compare) {
    console.error(`[GTT] Unsupported comparison operator: ${operator}`);
    return false;
  }
  return compare(left, parseOperand(right));
}
