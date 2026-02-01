import { resend, emailConfig } from "./client";
import {
  paymentReminderTemplate,
  payoutReceivedTemplate,
  circleJoinedTemplate,
  circleStartedTemplate,
  creditScoreUpdateTemplate,
} from "./templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://halo.fun";

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminder({
  email,
  userName,
  circleName,
  circleId,
  amount,
  dueDate,
}: {
  email: string;
  userName: string;
  circleName: string;
  circleId: string;
  amount: number;
  dueDate: Date;
}): Promise<NotificationResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject: `Payment Reminder: ${circleName}`,
      html: paymentReminderTemplate({
        userName,
        circleName,
        amount: amount.toLocaleString(),
        dueDate: dueDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        circleUrl: `${APP_URL}/circles/${circleId}`,
      }),
    });

    if (error) {
      console.error("Failed to send payment reminder:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Error sending payment reminder:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send payout received notification
 */
export async function sendPayoutNotification({
  email,
  userName,
  circleName,
  amount,
  transactionHash,
}: {
  email: string;
  userName: string;
  circleName: string;
  amount: number;
  transactionHash?: string;
}): Promise<NotificationResult> {
  try {
    const transactionUrl = transactionHash
      ? `https://stellar.expert/explorer/testnet/tx/${transactionHash}`
      : undefined;

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject: `Payout Received: ${amount.toLocaleString()} USDC`,
      html: payoutReceivedTemplate({
        userName,
        circleName,
        amount: amount.toLocaleString(),
        transactionUrl,
      }),
    });

    if (error) {
      console.error("Failed to send payout notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Error sending payout notification:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send circle joined confirmation
 */
export async function sendCircleJoined({
  email,
  userName,
  circleName,
  circleId,
  contributionAmount,
  frequency,
  position,
}: {
  email: string;
  userName: string;
  circleName: string;
  circleId: string;
  contributionAmount: number;
  frequency: string;
  position: number;
}): Promise<NotificationResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject: `Welcome to ${circleName}!`,
      html: circleJoinedTemplate({
        userName,
        circleName,
        contributionAmount: contributionAmount.toLocaleString(),
        frequency,
        position,
        circleUrl: `${APP_URL}/circles/${circleId}`,
      }),
    });

    if (error) {
      console.error("Failed to send circle joined email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Error sending circle joined email:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send circle started notification
 */
export async function sendCircleStarted({
  email,
  userName,
  circleName,
  circleId,
  firstPaymentDue,
}: {
  email: string;
  userName: string;
  circleName: string;
  circleId: string;
  firstPaymentDue: Date;
}): Promise<NotificationResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject: `${circleName} Has Started!`,
      html: circleStartedTemplate({
        userName,
        circleName,
        firstPaymentDue: firstPaymentDue.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        circleUrl: `${APP_URL}/circles/${circleId}`,
      }),
    });

    if (error) {
      console.error("Failed to send circle started email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Error sending circle started email:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send credit score update notification
 */
export async function sendCreditScoreUpdate({
  email,
  userName,
  newScore,
  previousScore,
  reason,
}: {
  email: string;
  userName: string;
  newScore: number;
  previousScore: number;
  reason: string;
}): Promise<NotificationResult> {
  try {
    const change = newScore - previousScore;
    const subject =
      change >= 0
        ? `Your Credit Score Increased by ${change} Points!`
        : `Credit Score Update: ${newScore}`;

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject,
      html: creditScoreUpdateTemplate({
        userName,
        newScore,
        previousScore,
        change,
        reason,
        dashboardUrl: `${APP_URL}/credit`,
      }),
    });

    if (error) {
      console.error("Failed to send credit score update:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Error sending credit score update:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Send bulk payment reminders for a circle
 */
export async function sendBulkPaymentReminders({
  circleId,
  circleName,
  amount,
  dueDate,
  members,
}: {
  circleId: string;
  circleName: string;
  amount: number;
  dueDate: Date;
  members: Array<{ email: string; name: string }>;
}): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const member of members) {
    const result = await sendPaymentReminder({
      email: member.email,
      userName: member.name,
      circleName,
      circleId,
      amount,
      dueDate,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
