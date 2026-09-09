export type SystemNotificationType =
  | "info"
  | "success"
  | "warning"
  | "error";

export type SystemNotification = {
  id: string;

  type: SystemNotificationType;

  title: string;

  message: string;

  createdAt: string;

  read: boolean;
};