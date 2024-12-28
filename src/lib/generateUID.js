import crypto from 'crypto';

// The number of random digits to create the UID with
export const NUM_RANDOM_DIGITS = 7;
// The number of security digits (security digits are equal to the sum of the original digits)
export const NUM_SECURITY_DIGITS = (9 * NUM_RANDOM_DIGITS).toString().length;

export const generateUID = () => {
  // The main random digits of the UID
  const randomSegment = crypto.randomInt(Math.pow(10, NUM_RANDOM_DIGITS - 1), Math.pow(10, NUM_RANDOM_DIGITS) - 1);
  // The digit sum segment of the UID
  let digitSum = 0;

  // For each character in the random segment's string representation
  for (const c of randomSegment.toString()) {
    // Add the digit to the digit sum
    digitSum += parseInt(c);
  }

  // Append the two strings and return the result
  return randomSegment.toString() + digitSum.toString();
}