// A sample external dependency
import leftPad from 'left-pad';

/**
 * A sample function using an external dependency that prepends a space to a string
 */
function pad(s) {
  return leftPad(s, s.length + 1);
}
