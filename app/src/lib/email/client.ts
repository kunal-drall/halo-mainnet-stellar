import { Resend } from "resend";

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const emailConfig = {
  from: process.env.EMAIL_FROM || "Halo Protocol <notifications@halo.fun>",
  replyTo: process.env.EMAIL_REPLY_TO || "support@halo.fun",
};
