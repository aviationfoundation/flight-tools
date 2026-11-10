// Certificate codes are read aloud and typed by hand, so the alphabet leaves out the
// characters people confuse: 0 and O, 1, I and L, and U. The accounts service issues them.
export const CERTIFICATE_CODE = /^[2-9A-HJKMNP-TV-Z]{12}$/;

/** A code as people type it (lower case, spaces, hyphens) in its stored form, or null. */
export function normaliseCertificateCode(input: string): string | null {
  const code = input.slice(0, 40).toUpperCase().replace(/[\s-]/g, '');
  return CERTIFICATE_CODE.test(code) ? code : null;
}

/** The code in groups of four, the way it is printed. */
export function printedCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, '$1-');
}
