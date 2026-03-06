/**
 * نظام الرسائل الخاصة المشفرة لمنصة زايلو
 * Private Messaging System with Encryption for Xylo Platform
 *
 * يدعم التشفير من الطرف إلى الطرف (E2EE) مع أساسيات لبروتوكول Signal
 * Supports End-to-End Encryption (E2EE) with Signal protocol foundations
 */

import * as crypto from 'crypto';
import { prisma } from '@/lib/db';
import { keyManager } from '@/lib/encryption/key-manager';
import { encrypt, decrypt, EncryptedData, generateKey, hash, randomString } from '@/lib/encryption/core';

// ==================== Types ====================

export interface PrivateMessageData {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;              // المحتوى المفكوك
  messageType: 'text' | 'image' | 'file' | 'gift';
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  replyToId?: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'DELETED';
  createdAt: Date;
  readAt?: Date;
}

export interface ConversationData {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'SUPPORT';
  name?: string;
  avatar?: string;
  participants: Array<{
    userId: string;
    role: 'owner' | 'admin' | 'member';
    unreadCount: number;
    lastReadAt?: Date;
  }>;
  lastMessage?: {
    preview: string;
    senderId: string;
    sentAt: Date;
  };
  isEncrypted: boolean;
  createdAt: Date;
}

export interface SendMessageInput {
  receiverId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'gift';
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  replyToId?: string;
}

export interface E2EEKeyPair {
  publicKey: string;
  privateKeyEnc: string;  // مشفر بمفتاح المستخدم
}

// ==================== Messaging Service Class ====================

class PrivateMessagingService {
  /**
   * إنشاء محادثة جديدة
   * Create a new conversation
   */
  async createConversation(
    participants: string[],
    type: 'DIRECT' | 'GROUP' | 'SUPPORT' = 'DIRECT',
    name?: string
  ): Promise<ConversationData> {
    // التحقق من عدد المشاركين
    if (type === 'DIRECT' && participants.length !== 2) {
      throw new Error('Direct conversation must have exactly 2 participants');
    }

    // البحث عن محادثة موجودة للمحادثات المباشرة
    if (type === 'DIRECT') {
      const existingConversation = await this.findDirectConversation(participants[0], participants[1]);
      if (existingConversation) {
        return existingConversation;
      }
    }

    // إنشاء المحادثة
    const conversation = await prisma.conversation.create({
      data: {
        type,
        name: name || null,
        isEncrypted: true,
        participants: {
          create: participants.map((userId, index) => ({
            userId,
            role: index === 0 ? 'owner' : 'member',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return this.mapToConversationData(conversation);
  }

  /**
   * إرسال رسالة مشفرة
   * Send an encrypted message
   */
  async sendMessage(
    senderId: string,
    input: SendMessageInput
  ): Promise<PrivateMessageData> {
    // إنشاء أو الحصول على المحادثة
    let conversation = await this.findDirectConversation(senderId, input.receiverId);

    if (!conversation) {
      conversation = await this.createConversation([senderId, input.receiverId], 'DIRECT');
    }

    // تشفير المحتوى
    const encryptedContent = this.encryptMessageContent(input.content, conversation.id);

    // إنشاء الرسالة
    const message = await prisma.privateMessage.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId: input.receiverId,
        contentEnc: encryptedContent.encrypted,
        contentIv: encryptedContent.iv,
        contentAuthTag: encryptedContent.authTag,
        messageType: input.messageType || 'text',
        attachments: input.attachments || null,
        replyToId: input.replyToId,
        status: 'SENT',
      },
    });

    // تحديث آخر رسالة في المحادثة
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: this.createPreview(input.content),
      },
    });

    // زيادة عداد الرسائل غير المقروءة للمستلم
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId: input.receiverId,
        },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    return this.mapToMessageData(message, input.content);
  }

  /**
   * الحصول على رسائل محادثة
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: PrivateMessageData[]; hasMore: boolean }> {
    // التحقق من صلاحية الوصول
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new Error('Access denied: You are not a participant in this conversation');
    }

    const skip = (page - 1) * limit;

    const messages = await prisma.privateMessage.findMany({
      where: {
        conversationId,
        deletedFor: { has: userId },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

    // فك تشفير الرسائل
    const decryptedMessages = messagesToReturn.map(msg => {
      const decryptedContent = this.decryptMessageContent({
        encrypted: msg.contentEnc,
        iv: msg.contentIv,
        authTag: msg.contentAuthTag,
        version: 1,
        algorithm: 'aes-256-gcm',
      }, conversationId);

      return this.mapToMessageData(msg, decryptedContent);
    });

    return {
      messages: decryptedMessages.reverse(),
      hasMore,
    };
  }

  /**
   * تحديد الرسائل كمقروءة
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await prisma.$transaction([
      // تحديث حالة الرسائل
      prisma.privateMessage.updateMany({
        where: {
          conversationId,
          receiverId: userId,
          status: { not: 'READ' },
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      }),

      // إعادة تعيين عداد الرسائل غير المقروءة
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: {
          unreadCount: 0,
          lastReadAt: new Date(),
        },
      }),
    ]);
  }

  /**
   * حذف رسالة
   * Delete a message
   */
  async deleteMessage(messageId: string, userId: string, deleteForEveryone: boolean = false): Promise<void> {
    const message = await prisma.privateMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (deleteForEveryone) {
      // التحقق من أن المستخدم هو المرسل
      if (message.senderId !== userId) {
        throw new Error('You can only delete your own messages for everyone');
      }

      await prisma.privateMessage.update({
        where: { id: messageId },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
        },
      });
    } else {
      // حذف للمستخدم الحالي فقط
      await prisma.privateMessage.update({
        where: { id: messageId },
        data: {
          deletedFor: { push: userId },
        },
      });
    }
  }

  /**
   * الحصول على محادثات المستخدم
   * Get user conversations
   */
  async getUserConversations(userId: string): Promise<ConversationData[]> {
    const participations = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        leftAt: null,
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          lastMessageAt: 'desc',
        },
      },
    });

    return participations.map(p => this.mapToConversationData(p.conversation));
  }

  /**
   * توليد مفاتيح E2EE للمستخدم
   * Generate E2EE key pair for user
   */
  async generateUserE2EEKeys(userId: string, userPassword: string): Promise<E2EEKeyPair> {
    // توليد زوج مفاتيح RSA
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // تشفير المفتاح الخاص بكلمة مرور المستخدم
    const key = this.deriveKeyFromPassword(userPassword, userId);
    const encryptedPrivateKey = encrypt(privateKey, key);

    // حفظ المفاتيح في قاعدة البيانات
    await prisma.user.update({
      where: { id: userId },
      data: {
        publicKey,
        privateKeyEnc: JSON.stringify(encryptedPrivateKey),
      },
    });

    return {
      publicKey,
      privateKeyEnc: JSON.stringify(encryptedPrivateKey),
    };
  }

  /**
   * تشفير رسالة لمستلم معين (E2EE)
   * Encrypt message for specific recipient (E2EE)
   */
  async encryptForRecipient(
    message: string,
    recipientId: string
  ): Promise<{ encrypted: string; keyId: string }> {
    // الحصول على المفتاح العام للمستلم
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { publicKey: true },
    });

    if (!recipient?.publicKey) {
      throw new Error('Recipient does not have E2EE keys');
    }

    // توليد مفتاح عشوائي للرسالة
    const messageKey = generateKey();

    // تشفير الرسالة بمفتاح الرسالة
    const encryptedMessage = encrypt(message, messageKey);

    // تشفير مفتاح الرسالة بالمفتاح العام للمستلم
    const encryptedKey = crypto.publicEncrypt(
      {
        key: recipient.publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      messageKey
    );

    return {
      encrypted: JSON.stringify({
        message: encryptedMessage,
        key: encryptedKey.toString('base64'),
      }),
      keyId: hash(recipientId + Date.now()).substring(0, 16),
    };
  }

  // ==================== Private Methods ====================

  /**
   * تشفير محتوى الرسالة
   * Encrypt message content
   */
  private encryptMessageContent(content: string, conversationId: string): EncryptedData {
    return keyManager.encryptMessage(content, conversationId);
  }

  /**
   * فك تشفير محتوى الرسالة
   * Decrypt message content
   */
  private decryptMessageContent(encryptedData: EncryptedData, conversationId: string): string {
    return keyManager.decryptMessage(encryptedData, conversationId);
  }

  /**
   * اشتقاق مفتاح من كلمة مرور
   * Derive key from password
   */
  private deriveKeyFromPassword(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  }

  /**
   * إنشاء معاينة للرسالة
   * Create message preview
   */
  private createPreview(content: string): string {
    const maxLength = 50;
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  /**
   * البحث عن محادثة مباشرة موجودة
   * Find existing direct conversation
   */
  private async findDirectConversation(userId1: string, userId2: string): Promise<ConversationData | null> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            userId: { in: [userId1, userId2] },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    // التحقق من أن المحادثة تحتوي على المشاركين المطلوبين فقط
    if (conversation.participants.length !== 2) {
      return null;
    }

    return this.mapToConversationData(conversation);
  }

  /**
   * تحويل نموذج Prisma إلى بيانات المحادثة
   * Map Prisma model to conversation data
   */
  private mapToConversationData(conversation: any): ConversationData {
    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name || undefined,
      avatar: conversation.avatar || undefined,
      participants: conversation.participants.map((p: any) => ({
        userId: p.userId,
        role: p.role,
        unreadCount: p.unreadCount,
        lastReadAt: p.lastReadAt || undefined,
      })),
      lastMessage: conversation.lastMessagePreview ? {
        preview: conversation.lastMessagePreview,
        senderId: conversation.participants.find((p: any) => p.role === 'owner')?.userId || '',
        sentAt: conversation.lastMessageAt || conversation.createdAt,
      } : undefined,
      isEncrypted: conversation.isEncrypted,
      createdAt: conversation.createdAt,
    };
  }

  /**
   * تحويل نموذج Prisma إلى بيانات الرسالة
   * Map Prisma model to message data
   */
  private mapToMessageData(message: any, decryptedContent: string): PrivateMessageData {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: decryptedContent,
      messageType: message.messageType,
      attachments: message.attachments || undefined,
      replyToId: message.replyToId || undefined,
      status: message.status,
      createdAt: message.createdAt,
      readAt: message.readAt || undefined,
    };
  }
}

// ==================== Singleton Instance ====================

export const privateMessaging = new PrivateMessagingService();

// ==================== Exports ====================

export default privateMessaging;
