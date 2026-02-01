/**
 * Email Templates for Halo Protocol
 *
 * These templates use a simple HTML structure with inline styles
 * for maximum email client compatibility.
 */

const baseStyles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    background-color: #0B0F1A;
    color: #E5E7EB;
  `,
  header: `
    text-align: center;
    margin-bottom: 32px;
  `,
  logo: `
    font-size: 24px;
    font-weight: bold;
    color: #FFFFFF;
    text-decoration: none;
  `,
  card: `
    background-color: #111827;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  `,
  heading: `
    font-size: 20px;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0 0 16px 0;
  `,
  text: `
    font-size: 16px;
    line-height: 1.6;
    color: #9CA3AF;
    margin: 0 0 16px 0;
  `,
  button: `
    display: inline-block;
    background-color: #FFFFFF;
    color: #0B0F1A;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
  `,
  highlight: `
    background-color: #1F2937;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
  `,
  amount: `
    font-size: 32px;
    font-weight: bold;
    color: #FFFFFF;
  `,
  footer: `
    text-align: center;
    font-size: 12px;
    color: #6B7280;
    margin-top: 32px;
  `,
};

interface EmailTemplateProps {
  userName: string;
  [key: string]: any;
}

/**
 * Payment Reminder Email
 */
export function paymentReminderTemplate({
  userName,
  circleName,
  amount,
  dueDate,
  circleUrl,
}: EmailTemplateProps & {
  circleName: string;
  amount: string;
  dueDate: string;
  circleUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder - Halo Protocol</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F1A;">
  <div style="${baseStyles.container}">
    <div style="${baseStyles.header}">
      <a href="https://halo.fun" style="${baseStyles.logo}">Halo</a>
    </div>

    <div style="${baseStyles.card}">
      <h1 style="${baseStyles.heading}">Payment Reminder</h1>
      <p style="${baseStyles.text}">
        Hi ${userName},
      </p>
      <p style="${baseStyles.text}">
        Your contribution for <strong>${circleName}</strong> is due soon.
      </p>

      <div style="${baseStyles.highlight}">
        <p style="margin: 0; color: #9CA3AF;">Amount Due</p>
        <p style="${baseStyles.amount}">${amount} USDC</p>
        <p style="margin: 8px 0 0; color: #9CA3AF;">Due by ${dueDate}</p>
      </div>

      <p style="${baseStyles.text}">
        Make your payment on time to build your credit score and support your circle members.
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${circleUrl}" style="${baseStyles.button}">Pay Now</a>
      </div>
    </div>

    <div style="${baseStyles.footer}">
      <p>Halo Protocol - Building Credit Together</p>
      <p>
        <a href="https://x.com/halodotfun" style="color: #9CA3AF;">Twitter</a> |
        <a href="https://t.me/halodotfun" style="color: #9CA3AF;">Telegram</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Payout Received Email
 */
export function payoutReceivedTemplate({
  userName,
  circleName,
  amount,
  transactionUrl,
}: EmailTemplateProps & {
  circleName: string;
  amount: string;
  transactionUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Received - Halo Protocol</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F1A;">
  <div style="${baseStyles.container}">
    <div style="${baseStyles.header}">
      <a href="https://halo.fun" style="${baseStyles.logo}">Halo</a>
    </div>

    <div style="${baseStyles.card}">
      <h1 style="${baseStyles.heading}">Payout Received!</h1>
      <p style="${baseStyles.text}">
        Hi ${userName},
      </p>
      <p style="${baseStyles.text}">
        Great news! You've received your payout from <strong>${circleName}</strong>.
      </p>

      <div style="${baseStyles.highlight}">
        <p style="margin: 0; color: #9CA3AF;">Amount Received</p>
        <p style="${baseStyles.amount}">${amount} USDC</p>
      </div>

      <p style="${baseStyles.text}">
        The funds have been sent to your connected wallet.
      </p>

      ${
        transactionUrl
          ? `
      <div style="text-align: center; margin-top: 24px;">
        <a href="${transactionUrl}" style="${baseStyles.button}">View Transaction</a>
      </div>
      `
          : ""
      }
    </div>

    <div style="${baseStyles.footer}">
      <p>Halo Protocol - Building Credit Together</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Circle Joined Email
 */
export function circleJoinedTemplate({
  userName,
  circleName,
  contributionAmount,
  frequency,
  position,
  circleUrl,
}: EmailTemplateProps & {
  circleName: string;
  contributionAmount: string;
  frequency: string;
  position: number;
  circleUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${circleName} - Halo Protocol</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F1A;">
  <div style="${baseStyles.container}">
    <div style="${baseStyles.header}">
      <a href="https://halo.fun" style="${baseStyles.logo}">Halo</a>
    </div>

    <div style="${baseStyles.card}">
      <h1 style="${baseStyles.heading}">Welcome to ${circleName}!</h1>
      <p style="${baseStyles.text}">
        Hi ${userName},
      </p>
      <p style="${baseStyles.text}">
        You've successfully joined the circle. Here are your details:
      </p>

      <div style="${baseStyles.highlight}">
        <p style="margin: 0 0 8px; color: #9CA3AF;">Contribution Amount</p>
        <p style="font-size: 20px; font-weight: bold; color: #FFFFFF; margin: 0 0 16px;">
          ${contributionAmount} USDC / ${frequency}
        </p>
        <p style="margin: 0 0 8px; color: #9CA3AF;">Your Payout Position</p>
        <p style="font-size: 20px; font-weight: bold; color: #FFFFFF; margin: 0;">
          #${position}
        </p>
      </div>

      <p style="${baseStyles.text}">
        You'll receive your payout when it's your turn in the rotation.
        Make sure to contribute on time each period to build your credit score!
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${circleUrl}" style="${baseStyles.button}">View Circle</a>
      </div>
    </div>

    <div style="${baseStyles.footer}">
      <p>Halo Protocol - Building Credit Together</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Circle Started Email
 */
export function circleStartedTemplate({
  userName,
  circleName,
  firstPaymentDue,
  circleUrl,
}: EmailTemplateProps & {
  circleName: string;
  firstPaymentDue: string;
  circleUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Circle Started - Halo Protocol</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F1A;">
  <div style="${baseStyles.container}">
    <div style="${baseStyles.header}">
      <a href="https://halo.fun" style="${baseStyles.logo}">Halo</a>
    </div>

    <div style="${baseStyles.card}">
      <h1 style="${baseStyles.heading}">${circleName} Has Started!</h1>
      <p style="${baseStyles.text}">
        Hi ${userName},
      </p>
      <p style="${baseStyles.text}">
        Great news! Your circle is now full and the first round has begun.
      </p>

      <div style="${baseStyles.highlight}">
        <p style="margin: 0 0 8px; color: #9CA3AF;">First Payment Due</p>
        <p style="font-size: 20px; font-weight: bold; color: #FFFFFF; margin: 0;">
          ${firstPaymentDue}
        </p>
      </div>

      <p style="${baseStyles.text}">
        Make your first contribution to get things rolling!
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${circleUrl}" style="${baseStyles.button}">Make Payment</a>
      </div>
    </div>

    <div style="${baseStyles.footer}">
      <p>Halo Protocol - Building Credit Together</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Credit Score Update Email
 */
export function creditScoreUpdateTemplate({
  userName,
  newScore,
  previousScore,
  change,
  reason,
  dashboardUrl,
}: EmailTemplateProps & {
  newScore: number;
  previousScore: number;
  change: number;
  reason: string;
  dashboardUrl: string;
}): string {
  const isIncrease = change > 0;
  const changeText = isIncrease ? `+${change}` : `${change}`;
  const changeColor = isIncrease ? "#10B981" : "#EF4444";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Score Update - Halo Protocol</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F1A;">
  <div style="${baseStyles.container}">
    <div style="${baseStyles.header}">
      <a href="https://halo.fun" style="${baseStyles.logo}">Halo</a>
    </div>

    <div style="${baseStyles.card}">
      <h1 style="${baseStyles.heading}">Credit Score Update</h1>
      <p style="${baseStyles.text}">
        Hi ${userName},
      </p>
      <p style="${baseStyles.text}">
        Your Halo credit score has been updated.
      </p>

      <div style="${baseStyles.highlight}; text-align: center;">
        <p style="margin: 0 0 8px; color: #9CA3AF;">Your New Score</p>
        <p style="font-size: 48px; font-weight: bold; color: #FFFFFF; margin: 0;">
          ${newScore}
        </p>
        <p style="font-size: 18px; color: ${changeColor}; margin: 8px 0 0;">
          ${changeText} points
        </p>
      </div>

      <p style="${baseStyles.text}">
        <strong>Reason:</strong> ${reason}
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${dashboardUrl}" style="${baseStyles.button}">View Details</a>
      </div>
    </div>

    <div style="${baseStyles.footer}">
      <p>Halo Protocol - Building Credit Together</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
