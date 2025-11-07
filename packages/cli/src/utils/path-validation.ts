import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Validates a user-provided path to prevent path traversal attacks
 * @param userPath - The path provided by the user
 * @param baseDir - The base directory to restrict paths to (defaults to current working directory)
 * @returns The resolved safe path
 * @throws Error if the path attempts to escape the base directory
 */
export async function validatePath(userPath: string, baseDir: string = process.cwd()): Promise<string> {
  // Normalize and resolve paths to prevent traversal
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(baseDir, userPath);

  // Check if the resolved path starts with the base directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error(
      `[Security] Path traversal detected: "${userPath}" resolves outside the project directory`
    );
  }

  // Additional checks for dangerous patterns
  const dangerousPatterns = [
    /\.\.[\/\\]/,  // Parent directory references
    /^[\/\\]/,     // Absolute paths (unless explicitly allowed)
    /~/,           // Home directory references
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(userPath)) {
      throw new Error(
        `[Security] Potentially dangerous path pattern detected in: "${userPath}"`
      );
    }
  }

  return resolvedPath;
}

/**
 * Safely creates a directory, ensuring it's within the project
 * @param dirPath - The directory path to create
 * @param baseDir - The base directory to restrict to
 */
export async function safeCreateDirectory(dirPath: string, baseDir: string = process.cwd()): Promise<void> {
  const safePath = await validatePath(dirPath, baseDir);
  await fs.mkdir(safePath, { recursive: true });
}

/**
 * Safely reads a file, ensuring it's within the allowed directory
 * @param filePath - The file path to read
 * @param baseDir - The base directory to restrict to
 * @returns The file contents
 */
export async function safeReadFile(filePath: string, baseDir: string = process.cwd()): Promise<string> {
  const safePath = await validatePath(filePath, baseDir);
  return await fs.readFile(safePath, 'utf-8');
}

/**
 * Safely writes a file, ensuring it's within the allowed directory
 * @param filePath - The file path to write
 * @param content - The content to write
 * @param baseDir - The base directory to restrict to
 */
export async function safeWriteFile(
  filePath: string,
  content: string,
  baseDir: string = process.cwd()
): Promise<void> {
  const safePath = await validatePath(filePath, baseDir);

  // Ensure the directory exists
  const dirPath = path.dirname(safePath);
  await fs.mkdir(dirPath, { recursive: true });

  await fs.writeFile(safePath, content, 'utf-8');
}

/**
 * Validates and sanitizes a locale code
 * @param locale - The locale code to validate
 * @returns The sanitized locale code
 * @throws Error if the locale code is invalid
 */
export function validateLocale(locale: string): string {
  // Locale codes should match BCP 47 format (e.g., en, en-US, zh-Hans)
  const localePattern = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/;

  if (!locale || typeof locale !== 'string') {
    throw new Error('[Validation] Invalid locale: must be a non-empty string');
  }

  if (locale.length > 20) {
    throw new Error('[Validation] Invalid locale: too long (max 20 characters)');
  }

  if (!localePattern.test(locale)) {
    // Be lenient and allow common patterns like en_US
    const normalizedLocale = locale.replace(/_/g, '-');
    if (!localePattern.test(normalizedLocale)) {
      throw new Error(
        `[Validation] Invalid locale format: "${locale}". Expected format: en, en-US, zh-Hans, etc.`
      );
    }
    return normalizedLocale;
  }

  return locale;
}

/**
 * Sanitizes user input to prevent command injection
 * @param input - The user input to sanitize
 * @returns The sanitized input
 */
export function sanitizeInput(input: string): string {
  // Remove or escape potentially dangerous characters
  return input.replace(/[`$;|&<>]/g, '');
}
