/**
 * نظام إدارة بوابات الدفع الديناميكية لمنصة زايلو
 * Dynamic Payment Gateways Management System for Xylo Platform
 *
 * يوفر إدارة آمنة وديناميكية لبوابات الدفع بدون تخزين المفاتيح في الكود
 * Provides secure and dynamic payment gateway management without storing keys in code
 */

import { prisma } from '@/lib/db';
import { keyManager } from '@/lib/encryption/key-manager';
import { encrypt, decrypt, EncryptedData, verifyEncryptedData } from '@/lib/encryption/core';

// ==================== Types ====================

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  displayName: string;
  displayNameAr: string | null;
  provider: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'SUSPENDED';
  environment: 'SANDBOX' | 'PRODUCTION';

  // Credentials (decrypted when needed)
  apiKey: string;
  apiSecret: string;
  webhookSecret?: string;
  clientId?: string;
  clientSecret?: string;

  // Configuration
  webhookUrl?: string;
  callbackUrl?: string;
  supportedCurrencies: string[];
  supportedPaymentMethods: string[];
  minAmount: number;
  maxAmount: number;
  feePercentage: number;
  feeFixed: number;

  // Display
  logo?: string;
  icon?: string;
  sortOrder: number;
  showInApp: boolean;
  showInWeb: boolean;
}

export interface CreateGatewayInput {
  name: string;
  displayName: string;
  displayNameAr?: string;
  provider: string;
  environment?: 'SANDBOX' | 'PRODUCTION';

  // Credentials (will be encrypted)
  apiKey: string;
  apiSecret: string;
  webhookSecret?: string;
  clientId?: string;
  clientSecret?: string;

  // Configuration
  webhookUrl?: string;
  callbackUrl?: string;
  supportedCurrencies?: string[];
  supportedPaymentMethods?: string[];
  minAmount?: number;
  maxAmount?: number;
  feePercentage?: number;
  feeFixed?: number;

  // Display
  logo?: string;
  icon?: string;
  sortOrder?: number;
  showInApp?: boolean;
  showInWeb?: boolean;
}

export interface UpdateGatewayInput {
  displayName?: string;
  displayNameAr?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'SUSPENDED';
  environment?: 'SANDBOX' | 'PRODUCTION';

  // Credentials (will be encrypted if provided)
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  clientId?: string;
  clientSecret?: string;

  // Configuration
  webhookUrl?: string;
  callbackUrl?: string;
  supportedCurrencies?: string[];
  supportedPaymentMethods?: string[];
  minAmount?: number;
  maxAmount?: number;
  feePercentage?: number;
  feeFixed?: number;

  // Display
  logo?: string;
  icon?: string;
  sortOrder?: number;
  showInApp?: boolean;
  showInWeb?: boolean;
}

export interface GatewayTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// ==================== Gateway Manager Class ====================

class PaymentGatewayManager {
  private gatewayCache: Map<string, { config: PaymentGatewayConfig; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * إنشاء بوابة دفع جديدة مع تشفير البيانات الحساسة
   * Create a new payment gateway with encrypted credentials
   */
  async createGateway(input: CreateGatewayInput): Promise<PaymentGatewayConfig> {
    // التحقق من عدم وجود بوابة بنفس الاسم
    const existing = await prisma.paymentGateway.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new Error(`Gateway with name "${input.name}" already exists`);
    }

    // تشفير البيانات الحساسة
    const encryptedApiKey = this.encryptCredential(input.apiKey, input.name, 'apiKey');
    const encryptedApiSecret = this.encryptCredential(input.apiSecret, input.name, 'apiSecret');
    const encryptedWebhookSecret = input.webhookSecret
      ? this.encryptCredential(input.webhookSecret, input.name, 'webhookSecret')
      : null;
    const encryptedClientId = input.clientId
      ? this.encryptCredential(input.clientId, input.name, 'clientId')
      : null;
    const encryptedClientSecret = input.clientSecret
      ? this.encryptCredential(input.clientSecret, input.name, 'clientSecret')
      : null;

    // إنشاء البوابة في قاعدة البيانات
    const gateway = await prisma.paymentGateway.create({
      data: {
        name: input.name,
        displayName: input.displayName,
        displayNameAr: input.displayNameAr || null,
        provider: input.provider as any,
        status: 'INACTIVE', // البوابة غير مفعلة افتراضياً
        environment: (input.environment || 'SANDBOX') as any,

        // البيانات المشفرة
        apiKeyEnc: this.serializeEncrypted(encryptedApiKey),
        apiSecretEnc: this.serializeEncrypted(encryptedApiSecret),
        webhookSecretEnc: encryptedWebhookSecret ? this.serializeEncrypted(encryptedWebhookSecret) : null,
        clientIdEnc: encryptedClientId ? this.serializeEncrypted(encryptedClientId) : null,
        clientSecretEnc: encryptedClientSecret ? this.serializeEncrypted(encryptedClientSecret) : null,

        // التكوين
        webhookUrl: input.webhookUrl,
        callbackUrl: input.callbackUrl,
        supportedCurrencies: input.supportedCurrencies || ['USD', 'SAR', 'EUR'],
        supportedPaymentMethods: input.supportedPaymentMethods || [],
        minAmount: input.minAmount || 0.5,
        maxAmount: input.maxAmount || 10000,
        feePercentage: input.feePercentage || 2.9,
        feeFixed: input.feeFixed || 0.30,

        // العرض
        logo: input.logo,
        icon: input.icon,
        sortOrder: input.sortOrder || 0,
        showInApp: input.showInApp ?? true,
        showInWeb: input.showInWeb ?? true,
      },
    });

    return this.mapToConfig(gateway);
  }

  /**
   * تحديث بوابة دفع موجودة
   * Update an existing payment gateway
   */
  async updateGateway(id: string, input: UpdateGatewayInput): Promise<PaymentGatewayConfig> {
    const existing = await prisma.paymentGateway.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Gateway with id "${id}" not found`);
    }

    // تحضير بيانات التحديث
    const updateData: Record<string, unknown> = {
      ...input,
    };

    // تشفير البيانات الحساسة إذا تم تقديمها
    if (input.apiKey) {
      updateData.apiKeyEnc = this.serializeEncrypted(
        this.encryptCredential(input.apiKey, existing.name, 'apiKey')
      );
    }

    if (input.apiSecret) {
      updateData.apiSecretEnc = this.serializeEncrypted(
        this.encryptCredential(input.apiSecret, existing.name, 'apiSecret')
      );
    }

    if (input.webhookSecret !== undefined) {
      updateData.webhookSecretEnc = input.webhookSecret
        ? this.serializeEncrypted(this.encryptCredential(input.webhookSecret, existing.name, 'webhookSecret'))
        : null;
    }

    if (input.clientId !== undefined) {
      updateData.clientIdEnc = input.clientId
        ? this.serializeEncrypted(this.encryptCredential(input.clientId, existing.name, 'clientId'))
        : null;
    }

    if (input.clientSecret !== undefined) {
      updateData.clientSecretEnc = input.clientSecret
        ? this.serializeEncrypted(this.encryptCredential(input.clientSecret, existing.name, 'clientSecret'))
        : null;
    }

    // حذف الحقول غير المشفرة من التحديث
    delete updateData.apiKey;
    delete updateData.apiSecret;
    delete updateData.webhookSecret;
    delete updateData.clientId;
    delete updateData.clientSecret;

    // تحديث البوابة
    const gateway = await prisma.paymentGateway.update({
      where: { id },
      data: updateData,
    });

    // مسح الكاش
    this.gatewayCache.delete(existing.name);
    this.gatewayCache.delete(id);

    return this.mapToConfig(gateway);
  }

  /**
   * الحصول على بوابة دفع بمفاتيحها المفكوكة
   * Get a payment gateway with decrypted credentials
   */
  async getGatewayWithCredentials(idOrName: string): Promise<PaymentGatewayConfig | null> {
    // التحقق من الكاش
    const cached = this.gatewayCache.get(idOrName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.config;
    }

    // البحث في قاعدة البيانات
    const gateway = await prisma.paymentGateway.findFirst({
      where: {
        OR: [
          { id: idOrName },
          { name: idOrName },
        ],
      },
    });

    if (!gateway) {
      return null;
    }

    const config = this.mapToConfig(gateway);

    // تخزين في الكاش
    this.gatewayCache.set(gateway.id, {
      config,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
    this.gatewayCache.set(gateway.name, {
      config,
      expiresAt: Date.now() + this.CACHE_TTL,
    });

    return config;
  }

  /**
   * الحصول على جميع البوابات النشطة
   * Get all active gateways
   */
  async getActiveGateways(): Promise<PaymentGatewayConfig[]> {
    const gateways = await prisma.paymentGateway.findMany({
      where: {
        status: 'ACTIVE',
        showInWeb: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return gateways.map(g => this.mapToConfig(g));
  }

  /**
   * الحصول على قائمة البوابات (بدون مفاتيح)
   * Get list of gateways (without credentials)
   */
  async listGateways(includeInactive: boolean = false): Promise<Array<Omit<PaymentGatewayConfig, 'apiKey' | 'apiSecret' | 'webhookSecret' | 'clientId' | 'clientSecret'> & { hasCredentials: boolean }>> {
    const gateways = await prisma.paymentGateway.findMany({
      where: includeInactive ? {} : { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
    });

    return gateways.map(g => ({
      id: g.id,
      name: g.name,
      displayName: g.displayName,
      displayNameAr: g.displayNameAr,
      provider: g.provider,
      status: g.status,
      environment: g.environment,
      supportedCurrencies: g.supportedCurrencies,
      supportedPaymentMethods: g.supportedPaymentMethods,
      minAmount: g.minAmount,
      maxAmount: g.maxAmount,
      feePercentage: g.feePercentage,
      feeFixed: g.feeFixed,
      logo: g.logo,
      icon: g.icon,
      sortOrder: g.sortOrder,
      showInApp: g.showInApp,
      showInWeb: g.showInWeb,
      hasCredentials: !!(g.apiKeyEnc && g.apiSecretEnc),
    }));
  }

  /**
   * تغيير حالة البوابة
   * Change gateway status
   */
  async setGatewayStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'SUSPENDED'): Promise<void> {
    await prisma.paymentGateway.update({
      where: { id },
      data: { status },
    });

    // مسح الكاش
    this.gatewayCache.delete(id);
    const gateway = await prisma.paymentGateway.findUnique({ where: { id } });
    if (gateway) {
      this.gatewayCache.delete(gateway.name);
    }
  }

  /**
   * اختبار اتصال البوابة
   * Test gateway connection
   */
  async testGateway(id: string): Promise<GatewayTestResult> {
    const config = await this.getGatewayWithCredentials(id);

    if (!config) {
      return {
        success: false,
        message: 'Gateway not found',
        timestamp: new Date(),
      };
    }

    try {
      // اختبار البوابة حسب نوعها
      let testResult: { success: boolean; message: string; details?: Record<string, unknown> };

      switch (config.provider.toUpperCase()) {
        case 'STRIPE':
          testResult = await this.testStripeGateway(config);
          break;
        case 'PAYPAL':
          testResult = await this.testPaypalGateway(config);
          break;
        case 'MOYASAR':
        case 'STC_PAY':
          testResult = await this.testMoyasarGateway(config);
          break;
        default:
          testResult = {
            success: true,
            message: 'Test not implemented for this provider',
          };
      }

      // تحديث سجل الاختبار
      await prisma.paymentGateway.update({
        where: { id },
        data: {
          lastTestAt: new Date(),
          lastTestResult: JSON.stringify(testResult.details || {}),
          lastTestStatus: testResult.success ? 'success' : 'failed',
        },
      });

      return {
        ...testResult,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.paymentGateway.update({
        where: { id },
        data: {
          lastTestAt: new Date(),
          lastTestResult: errorMessage,
          lastTestStatus: 'failed',
        },
      });

      return {
        success: false,
        message: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * حذف بوابة دفع
   * Delete a payment gateway
   */
  async deleteGateway(id: string): Promise<void> {
    await prisma.paymentGateway.delete({
      where: { id },
    });

    // مسح الكاش
    this.gatewayCache.delete(id);
  }

  // ==================== Private Methods ====================

  /**
   * تشفير بيانات الاعتماد
   * Encrypt a credential
   */
  private encryptCredential(value: string, gatewayName: string, fieldType: string): EncryptedData {
    return keyManager.encryptGatewayData(value, `${gatewayName}:${fieldType}`);
  }

  /**
   * فك تشفير بيانات الاعتماد
   * Decrypt a credential
   */
  private decryptCredential(encryptedData: EncryptedData, gatewayName: string, fieldType: string): string {
    return keyManager.decryptGatewayData(encryptedData, `${gatewayName}:${fieldType}`);
  }

  /**
   * تحويل البيانات المشفرة إلى سلسلة للتخزين
   * Serialize encrypted data for storage
   */
  private serializeEncrypted(data: EncryptedData): string {
    return JSON.stringify(data);
  }

  /**
   * تحويل سلسلة إلى بيانات مشفرة
   * Deserialize string to encrypted data
   */
  private deserializeEncrypted(data: string): EncryptedData | null {
    try {
      const parsed = JSON.parse(data) as EncryptedData;
      if (verifyEncryptedData(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * تحويل نموذج Prisma إلى تكوين البوابة
   * Map Prisma model to gateway config
   */
  private mapToConfig(gateway: any): PaymentGatewayConfig {
    const apiKeyEnc = this.deserializeEncrypted(gateway.apiKeyEnc);
    const apiSecretEnc = this.deserializeEncrypted(gateway.apiSecretEnc);
    const webhookSecretEnc = gateway.webhookSecretEnc
      ? this.deserializeEncrypted(gateway.webhookSecretEnc)
      : null;
    const clientIdEnc = gateway.clientIdEnc
      ? this.deserializeEncrypted(gateway.clientIdEnc)
      : null;
    const clientSecretEnc = gateway.clientSecretEnc
      ? this.deserializeEncrypted(gateway.clientSecretEnc)
      : null;

    return {
      id: gateway.id,
      name: gateway.name,
      displayName: gateway.displayName,
      displayNameAr: gateway.displayNameAr,
      provider: gateway.provider,
      status: gateway.status,
      environment: gateway.environment,

      // فك التشفير
      apiKey: apiKeyEnc ? this.decryptCredential(apiKeyEnc, gateway.name, 'apiKey') : '',
      apiSecret: apiSecretEnc ? this.decryptCredential(apiSecretEnc, gateway.name, 'apiSecret') : '',
      webhookSecret: webhookSecretEnc
        ? this.decryptCredential(webhookSecretEnc, gateway.name, 'webhookSecret')
        : undefined,
      clientId: clientIdEnc
        ? this.decryptCredential(clientIdEnc, gateway.name, 'clientId')
        : undefined,
      clientSecret: clientSecretEnc
        ? this.decryptCredential(clientSecretEnc, gateway.name, 'clientSecret')
        : undefined,

      // التكوين
      webhookUrl: gateway.webhookUrl || undefined,
      callbackUrl: gateway.callbackUrl || undefined,
      supportedCurrencies: gateway.supportedCurrencies,
      supportedPaymentMethods: gateway.supportedPaymentMethods,
      minAmount: gateway.minAmount,
      maxAmount: gateway.maxAmount,
      feePercentage: gateway.feePercentage,
      feeFixed: gateway.feeFixed,

      // العرض
      logo: gateway.logo || undefined,
      icon: gateway.icon || undefined,
      sortOrder: gateway.sortOrder,
      showInApp: gateway.showInApp,
      showInWeb: gateway.showInWeb,
    };
  }

  /**
   * اختبار بوابة Stripe
   * Test Stripe gateway
   */
  private async testStripeGateway(config: PaymentGatewayConfig): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    try {
      const response = await fetch('https://api.stripe.com/v1/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Stripe-Version': '2023-10-16',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Stripe connection successful',
          details: {
            available: data.available,
            livemode: data.livemode,
          },
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: error.error?.message || 'Stripe connection failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * اختبار بوابة PayPal
   * Test PayPal gateway
   */
  private async testPaypalGateway(config: PaymentGatewayConfig): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    const baseUrl = config.environment === 'PRODUCTION'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    try {
      // الحصول على access token
      const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'PayPal connection successful',
          details: {
            app_id: data.app_id,
            scope: data.scope,
          },
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: error.error_description || 'PayPal connection failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * اختبار بوابة Moyasar
   * Test Moyasar gateway
   */
  private async testMoyasarGateway(config: PaymentGatewayConfig): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
    try {
      const response = await fetch('https://api.moyasar.com/v1/invoices', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(config.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok || response.status === 401) {
        // 401 means the key is valid but no invoices
        return {
          success: true,
          message: 'Moyasar connection successful',
        };
      } else {
        return {
          success: false,
          message: 'Moyasar connection failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}

// ==================== Singleton Instance ====================

export const paymentGatewayManager = new PaymentGatewayManager();

// ==================== Exports ====================

export default paymentGatewayManager;
