/**
 * نظام التشفير المتقدم لمنصة زايلو
 * Advanced Encryption System for Xylo Platform
 *
 * يستخدم AES-256-GCM للتشفير مع مصادقة إضافية
 * Provides AES-256-GCM encryption with additional authentication
 */

import * as crypto from 'crypto';

// ==================== Types ====================

export interface EncryptedData {
  encrypted: string;      // البيانات المشفرة (Base64)
  iv: string;             // Initialization Vector (Base64)
  authTag: string;        // Authentication Tag (Base64)
  version: number;        // إصدار خوارزمية التشفير
  algorithm: string;      // اسم الخوارزمية
}

export interface KeyDerivationOptions {
  password: string;
  salt?: string;
  iterations?: number;
  keyLength?: number;
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  authTagLength: number;
  saltLength: number;
  iterations: number;
}

// ==================== Configuration ====================

const DEFAULT_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,          // 256 bits
  ivLength: 16,           // 128 bits (GCM standard)
  authTagLength: 16,      // 128 bits
  saltLength: 64,         // 512 bits
  iterations: 100000,     // PBKDF2 iterations
};

// ==================== Core Encryption Functions ====================

/**
 * تشفير البيانات باستخدام AES-256-GCM
 * Encrypt data using AES-256-GCM
 *
 * @param plaintext - النص المراد تشفيره
 * @param key - مفتاح التشفير (32 bytes)
 * @returns البيانات المشفرة مع IV و AuthTag
 */
export function encrypt(plaintext: string, key: Buffer): EncryptedData {
  // التحقق من طول المفتاح
  if (key.length !== DEFAULT_CONFIG.keyLength) {
    throw new Error(`Invalid key length. Expected ${DEFAULT_CONFIG.keyLength} bytes, got ${key.length}`);
  }

  // إنشاء IV عشوائي
  const iv = crypto.randomBytes(DEFAULT_CONFIG.ivLength);

  // إنشاء cipher
  const cipher = crypto.createCipheriv(
    DEFAULT_CONFIG.algorithm,
    key,
    iv,
    { authTagLength: DEFAULT_CONFIG.authTagLength }
  );

  // تشفير البيانات
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // الحصول على AuthTag
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    version: 1,
    algorithm: DEFAULT_CONFIG.algorithm,
  };
}

/**
 * فك تشفير البيانات المشفرة بـ AES-256-GCM
 * Decrypt data encrypted with AES-256-GCM
 *
 * @param encryptedData - البيانات المشفرة
 * @param key - مفتاح فك التشفير (32 bytes)
 * @returns النص الأصلي
 */
export function decrypt(encryptedData: EncryptedData, key: Buffer): string {
  // التحقق من طول المفتاح
  if (key.length !== DEFAULT_CONFIG.keyLength) {
    throw new Error(`Invalid key length. Expected ${DEFAULT_CONFIG.keyLength} bytes, got ${key.length}`);
  }

  // التحقق من الإصدار
  if (encryptedData.version !== 1) {
    throw new Error(`Unsupported encryption version: ${encryptedData.version}`);
  }

  // تحويل البيانات من Base64
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');

  // التحقق من طول IV
  if (iv.length !== DEFAULT_CONFIG.ivLength) {
    throw new Error(`Invalid IV length. Expected ${DEFAULT_CONFIG.ivLength} bytes, got ${iv.length}`);
  }

  // إنشاء decipher
  const decipher = crypto.createDecipheriv(
    encryptedData.algorithm || DEFAULT_CONFIG.algorithm,
    key,
    iv,
    { authTagLength: DEFAULT_CONFIG.authTagLength }
  );

  // تعيين AuthTag للتحقق من الصحة
  decipher.setAuthTag(authTag);

  // فك التشفير
  let decrypted: string;
  try {
    decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
  } catch {
    throw new Error('Decryption failed: Authentication tag verification failed');
  }

  return decrypted;
}

/**
 * تشفير كائن JSON
 * Encrypt a JSON object
 */
export function encryptObject<T>(obj: T, key: Buffer): EncryptedData {
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString, key);
}

/**
 * فك تشفير كائن JSON
 * Decrypt a JSON object
 */
export function decryptObject<T>(encryptedData: EncryptedData, key: Buffer): T {
  const jsonString = decrypt(encryptedData, key);
  return JSON.parse(jsonString) as T;
}

// ==================== Key Management ====================

/**
 * اشتقاق مفتاح من كلمة مرور باستخدام PBKDF2
 * Derive a key from a password using PBKDF2
 */
export function deriveKeyFromPassword(options: KeyDerivationOptions): {
  key: Buffer;
  salt: string;
} {
  const salt = options.salt
    ? Buffer.from(options.salt, 'base64')
    : crypto.randomBytes(DEFAULT_CONFIG.saltLength);

  const key = crypto.pbkdf2Sync(
    options.password,
    salt,
    options.iterations || DEFAULT_CONFIG.iterations,
    options.keyLength || DEFAULT_CONFIG.keyLength,
    'sha512'
  );

  return {
    key,
    salt: salt.toString('base64'),
  };
}

/**
 * إنشاء مفتاح تشفير عشوائي
 * Generate a random encryption key
 */
export function generateKey(): Buffer {
  return crypto.randomBytes(DEFAULT_CONFIG.keyLength);
}

/**
 * إنشاء مفتاح تشفير بصيغة Base64
 * Generate a base64-encoded encryption key
 */
export function generateKeyBase64(): string {
  return generateKey().toString('base64');
}

/**
 * تحويل مفتاح من Base64 إلى Buffer
 * Convert a key from Base64 to Buffer
 */
export function keyFromBase64(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== DEFAULT_CONFIG.keyLength) {
    throw new Error(`Invalid key length. Expected ${DEFAULT_CONFIG.keyLength} bytes, got ${key.length}`);
  }
  return key;
}

// ==================== Hashing Functions ====================

/**
 * إنشاء hash باستخدام SHA-256
 * Create a hash using SHA-256
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * إنشاء hash باستخدام SHA-512
 * Create a hash using SHA-512
 */
export function hash512(data: string): string {
  return crypto.createHash('sha512').update(data).digest('hex');
}

/**
 * إنشاء HMAC
 * Create an HMAC
 */
export function createHmac(data: string, key: string | Buffer): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

// ==================== Secure Random ====================

/**
 * إنشاء سلسلة عشوائية آمنة
 * Generate a secure random string
 */
export function randomString(length: number = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * إنشاء رقم عشوائي آمن
 * Generate a secure random number
 */
export function randomInt(min: number, max: number): number {
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValid = Math.pow(256, bytesNeeded) - 1;
  const limit = maxValid - (maxValid % range);

  let result: number;
  do {
    result = crypto.randomBytes(bytesNeeded).readUIntBE(0, bytesNeeded);
  } while (result >= limit);

  return min + (result % range);
}

/**
 * إنشاء UUID آمن
 * Generate a secure UUID
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

// ==================== Key Rotation Support ====================

/**
 * إعادة تشفير البيانات بمفتاح جديد
 * Re-encrypt data with a new key
 */
export function reEncrypt(
  encryptedData: EncryptedData,
  oldKey: Buffer,
  newKey: Buffer
): EncryptedData {
  const plaintext = decrypt(encryptedData, oldKey);
  return encrypt(plaintext, newKey);
}

/**
 * تدوير مفتاح التشفير الرئيسي
 * Rotate the master encryption key
 */
export async function rotateMasterKey(
  oldMasterKey: Buffer,
  newMasterKey: Buffer,
  dataToRotate: Array<{ id: string; encryptedData: EncryptedData }>
): Promise<Array<{ id: string; newEncryptedData: EncryptedData }>> {
  const results: Array<{ id: string; newEncryptedData: EncryptedData }> = [];

  for (const item of dataToRotate) {
    try {
      const newEncryptedData = reEncrypt(item.encryptedData, oldMasterKey, newMasterKey);
      results.push({
        id: item.id,
        newEncryptedData,
      });
    } catch (error) {
      console.error(`Failed to rotate key for item ${item.id}:`, error);
    }
  }

  return results;
}

// ==================== Serialization ====================

/**
 * تحويل البيانات المشفرة إلى سلسلة JSON
 * Serialize encrypted data to JSON string
 */
export function serializeEncryptedData(data: EncryptedData): string {
  return JSON.stringify(data);
}

/**
 * تحويل سلسلة JSON إلى بيانات مشفرة
 * Deserialize JSON string to encrypted data
 */
export function deserializeEncryptedData(json: string): EncryptedData {
  return JSON.parse(json) as EncryptedData;
}

// ==================== Verification ====================

/**
 * التحقق من صحة البيانات المشفرة
 * Verify encrypted data integrity
 */
export function verifyEncryptedData(encryptedData: EncryptedData): boolean {
  try {
    if (!encryptedData.encrypted || !encryptedData.iv || !encryptedData.authTag) {
      return false;
    }

    Buffer.from(encryptedData.encrypted, 'base64');
    Buffer.from(encryptedData.iv, 'base64');
    Buffer.from(encryptedData.authTag, 'base64');

    const iv = Buffer.from(encryptedData.iv, 'base64');
    if (iv.length !== DEFAULT_CONFIG.ivLength) {
      return false;
    }

    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    if (authTag.length !== DEFAULT_CONFIG.authTagLength) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ==================== Exports ====================

export const encryption = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  deriveKeyFromPassword,
  generateKey,
  generateKeyBase64,
  keyFromBase64,
  hash,
  hash512,
  createHmac,
  randomString,
  randomInt,
  generateUUID,
  reEncrypt,
  rotateMasterKey,
  serializeEncryptedData,
  deserializeEncryptedData,
  verifyEncryptedData,
};

export default encryption;
