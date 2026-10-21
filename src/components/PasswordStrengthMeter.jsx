// ============================================================
// PasswordStrengthMeter.jsx
// A reusable component that displays a strength indicator bar
// below a password input.
//
// Strength rules (all must pass for "Strong"):
//   • At least 8 characters
//   • At least one uppercase letter (A-Z)
//   • At least one lowercase letter (a-z)
//   • At least one digit (0-9)
//   • At least one special character (!@#$%^&* …)
//
// Props:
//   password {string} - the current password value
// ============================================================

import './PasswordStrengthMeter.css';

/**
 * Analyses the password and returns a score object.
 *
 * @param {string} password
 * @returns {{ score: number, label: string, color: string, hints: string[] }}
 *   score  0-4   (number of rules passed)
 *   label  'Weak' | 'Fair' | 'Good' | 'Strong'
 *   color  CSS hex colour for the progress bar
 *   hints  Array of rules that still need to be satisfied
 */
function analysePassword(password) {
  // Each rule: [test function, hint message if it fails]
  const rules = [
    [(p) => p.length >= 8,               'At least 8 characters'],
    [(p) => /[A-Z]/.test(p),             'At least one uppercase letter'],
    [(p) => /[a-z]/.test(p),             'At least one lowercase letter'],
    [(p) => /[0-9]/.test(p),             'At least one number'],
    [(p) => /[^A-Za-z0-9]/.test(p),      'At least one special character (!@#$%…)'],
  ];

  const passed = rules.filter(([test]) => test(password));
  const hints  = rules
    .filter(([test]) => !test(password))
    .map(([, hint]) => hint);

  const score = passed.length; // 0-5

  // Map score bands to labels and colours
  const band = Math.min(Math.floor(score / 5 * 4), 3); // 0-3
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#e53e3e', '#ed8936', '#ecc94b', '#48bb78'];

  return {
    score,
    totalRules: rules.length,
    label:  labels[band],
    color:  colors[band],
    hints,
    isStrong: score === rules.length, // all rules passed
  };
}

/**
 * PasswordStrengthMeter
 *
 * Renders a multi-segment progress bar and a list of unmet rules.
 * Meant to be placed directly below a password <input>.
 *
 * @param {{ password: string }} props
 */
function PasswordStrengthMeter({ password }) {
  // Don't render anything until the user starts typing
  if (!password) return null;

  const { score, totalRules, label, color, hints } = analysePassword(password);

  return (
    <div className="psm-wrapper">

      {/* Segmented progress bar */}
      <div className="psm-bar-track">
        {Array.from({ length: totalRules }).map((_, i) => (
          <div
            key={i}
            className="psm-bar-segment"
            style={{ background: i < score ? color : '#e2e8f0' }}
          />
        ))}
      </div>

      {/* Strength label */}
      <span className="psm-label" style={{ color }}>
        {label}
      </span>

      {/* Unmet rules list */}
      {hints.length > 0 && (
        <ul className="psm-hints">
          {hints.map((hint) => (
            <li key={hint}>✗ {hint}</li>
          ))}
        </ul>
      )}

    </div>
  );
}

export { analysePassword };
export default PasswordStrengthMeter;
