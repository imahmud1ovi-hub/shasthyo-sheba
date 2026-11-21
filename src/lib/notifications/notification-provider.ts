import { prisma } from "@/lib/db/prisma";

export interface NotificationPayload {
  userId: string;
  titleEn: string;
  titleBn: string;
  messageEn: string;
  messageBn: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<void>;
}

export class DbMockNotificationProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        titleEn: payload.titleEn,
        titleBn: payload.titleBn,
        messageEn: payload.messageEn,
        messageBn: payload.messageBn,
      },
    });
    console.info(
      `[SHASTHYO SHEBA NOTIFICATION] user=${payload.userId} | ${payload.titleEn}: ${payload.messageEn}`
    );
  }
}

export const notificationProvider: NotificationProvider =
  new DbMockNotificationProvider();
