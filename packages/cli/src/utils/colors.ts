// Zero-dependency terminal colors implementation
const getIsColorSupported = () => !process.env.NO_COLOR && 
  process.env.FORCE_COLOR !== '0' && 
  (process.env.FORCE_COLOR === '1' || process.stdout.isTTY);

const colorize = (code: number) => (text: string) => 
  getIsColorSupported() ? `\x1b[${code}m${text}\x1b[0m` : text;

export const colors = {
  reset: colorize(0),
  bold: colorize(1),
  dim: colorize(2),
  red: colorize(31),
  green: colorize(32),
  yellow: colorize(33),
  blue: colorize(34),
  magenta: colorize(35),
  cyan: colorize(36),
  white: colorize(37),
  gray: colorize(90),
  
  // Background colors
  bgRed: colorize(41),
  bgGreen: colorize(42),
  bgYellow: colorize(43),
  bgBlue: colorize(44),
  
  // Combinations
  error: (text: string) => colorize(31)(colorize(1)(text)),
  success: (text: string) => colorize(32)(colorize(1)(text)),
  warning: (text: string) => colorize(33)(colorize(1)(text)),
  info: (text: string) => colorize(34)(colorize(1)(text)),
  
  // Semantic colors
  primary: colorize(36),
  secondary: colorize(90),
};