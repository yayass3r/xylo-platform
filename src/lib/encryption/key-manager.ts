/**
 * مدير مفاتيح التشفير لمنصة زايلو
 * Encryption Key Manager for Xylo Platform
 *
 * يوفر إدارة آمنة لمفاتيح التشفير مع دعم التدوير والتخزين المؤقت
 * Provides secure key management with rotation and caching support
 */

import * as crypto from 'crypto';
import { encrypt, decrypt, EncryptedData, generateKey, keyFromBase64 } from './core';

// ==================== Types ====================

export interface MasterKeyConfig {
  masterKey: Buffer;
  masterKeyVersion: number;
  createdAt: Date;
  previousKeys?: Array<{
    version: number;
    key: Buffer;
    retiredAt: Date;
  }>;
}

export interface KeyMetadata {
  id: string;
  version: number;
  createdAt: Date;
  expiresAt?: Date;
  isRotating?: boolean;
}

// ==================== Key Manager Class ====================

class KeyManager {
  private masterKey: Buffer | null = null;
  private masterKeyVersion: number = 0;
  private keyCache: Map<string, { key: Buffer; expiresAt: number }> = new Map();
  private previousKeys: Array<{ version: number; key: Buffer; retiredAt: Date }> = [];

  // Cache TTL in milliseconds (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;

  /**
   * تهيئة مدير المفاتيح بالمفتاح الرئيسي
   * Initialize the key manager with the master key
   */
  initialize(masterKeyBase64: string, version: number = 1): void {
    this.masterKey = keyFromBase64(masterKeyBase64);
    this.masterKeyVersion = version;

    // مسح الكاش عند تهيئة مفتاح جديد
    this.keyCache.clear();
  }

  /**
   * الحصول على المفتاح الرئيسي الحالي
   * Get the current master key
   */
  getMasterKey(): Buffer {
    if (!this.masterKey) {
      throw new Error('Key manager not initialized. Call initialize() first.');
    }
    return this.masterKey;
  }

  /**
   * الحصول على إصدار المفتاح الرئيسي
   * Get the master key version
   */
  getMasterKeyVersion(): number {
    return this.masterKeyVersion;
  }

  /**
   * تدوير المفتاح الرئيسي
   * Rotate the master key
   */
  rotateMasterKey(newMasterKeyBase64: string): void {
    if (!this.masterKey) {
      throw new Error('Cannot rotate: key manager not initialized');
    }

    // حفظ المفتاح القديم
    this.previousKeys.push({
      version: this.masterKeyVersion,
      key: this.masterKey,
      retiredAt: new Date(),
    });

    // الاحتفاظ بآخر 3 مفاتيح سابقة فقط
    if (this.previousKeys.length > 3) {
      this.previousKeys.shift();
    }

    // تعيين المفتاح الجديد
    this.masterKey = keyFromBase64(newMasterKeyBase64);
    this.masterKeyVersion++;

    // مسح الكاش
    this.keyCache.clear();
  }

  /**
   * الحصول على مفتاح سابق حسب الإصدار
   * Get a previous key by version
   */
  getPreviousKey(version: number): Buffer | null {
    const previousKey = this.previousKeys.find(k => k.version === version);
    return previousKey?.key || null;
  }

  /**
   * توليد مفتاح مشتق لغرض معين
   * Generate a derived key for a specific purpose
   */
  derivePurposeKey(purpose: string, context?: string): Buffer {
    if (!this.masterKey) {
      throw new Error('Key manager not initialized');
    }

    const cacheKey = `${purpose}:${context || 'default'}`;

    // التحقق من الكاش
    const cached = this.keyCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.key;
    }

    // اشتقاق مفتاح جديد
    const info = Buffer.from(`${purpose}:${context || 'default'}:v${this.masterKeyVersion}`);
    const derivedKey = crypto.createHmac('sha256', this.masterKey)
      .update(info)
      .digest()
      .slice(0, 32); // 32 bytes for AES-256

    // تخزين في الكاش
    this.keyCache.set(cacheKey, {
      key: derivedKey,
      expiresAt: Date.now() + this.CACHE_TTL,
    });

    return derivedKey;
  }

  /**
   * تشفير بيانات البوابة باستخدام مفتاح خاص
   * Encrypt gateway data using a purpose-specific key
   */
  encryptGatewayData(data: string, gatewayId: string): EncryptedData {
    const key = this.derivePurposeKey('gateway', gatewayId);
    return encrypt(data, key);
  }

  /**
   * فك تشفير بيانات البوابة
   * Decrypt gateway data
   */
  decryptGatewayData(encryptedData: EncryptedData, gatewayId: string): string {
    const key = this.derivePurposeKey('gateway', gatewayId);
    return decrypt(encryptedData, key);
  }

  /**
   * تشفير محتوى رسالة
   * Encrypt message content
   */
  encryptMessage(content: string, conversationId: string): EncryptedData {
    const key = this.derivePurposeKey('message', conversationId);
    return encrypt(content, key);
  }

  /**
   * فك تشفير محتوى رسالة
   * Decrypt message content
   */
  decryptMessage(encryptedData: EncryptedData, conversationId: string): string {
    const key = this.derivePurposeKey('message', conversationId);
    return decrypt(encryptedData, key);
  }

  /**
   * تشفير بيانات حساسة للمستخدم
   * Encrypt sensitive user data
   */
  encryptUserData(data: string, userId: string): EncryptedData {
    const key = this.derivePurposeKey('userdata', userId);
    return encrypt(data, key);
  }

  /**
   * فك تشفير بيانات المستخدم
   * Decrypt user data
   */
  decryptUserData(encryptedData: EncryptedData, userId: string): string {
    const key = this.derivePurposeKey('userdata', userId);
    return decrypt(encryptedData, key);
  }

  /**
   * مسح الكاش
   * Clear the key cache
   */
  clearCache(): void {
    this.keyCache.clear();
  }

  /**
   * الحصول على إحصائيات الكاش
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.keyCache.size,
      keys: Array.from(this.keyCache.keys()),
    };
  }
}

// ==================== Singleton Instance ====================

export const keyManager = new KeyManager();

// ==================== Helper Functions ====================

/**
 * تهيئة نظام التشفير من متغيرات البيئة
 * Initialize encryption system from environment variables
 */
export function initializeEncryption(): void {
  // المفتاح الرئيسي يجب أن يكون في متغير بيئة آمن
  // أو يمكن جلبه من خدمة إدارة مفاتيح (مثل AWS KMS, HashiCorp Vault)
  const masterKeyBase64 = process.env.MASTER_ENCRYPTION_KEY;

  if (!masterKeyBase64) {
    throw new Error(
      'MASTER_ENCRYPTION_KEY environment variable is required. ' +
      'Generate one using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }

  const version = parseInt(process.env.MASTER_KEY_VERSION || '1', 10);

  keyManager.initialize(masterKeyBase64, version);

  console.log(`[Encryption] Initialized with master key version ${version}`);
}

/**
 * إنشاء مفتاح رئيسي جديد (للإعداد الأولي فقط)
 * Generate a new master key (for initial setup only)
 */
export function generateMasterKey(): string {
  return generateKey().toString('base64');
}

/**
 * التحقق من تهيئة نظام التشفير
 * Check if encryption system is initialized
 */
export function isEncryptionInitialized(): boolean {
  try {
    keyManager.getMasterKey();
    return true;
  } catch {
    return false;
  }
}

// ==================== Exports ====================

export default keyManager;
