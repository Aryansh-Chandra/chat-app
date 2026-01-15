import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Use Gmail App Password
        },
    });

    // Email options
    const mailOptions = {
        from: `ChatApp <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

// Password reset email template
export const getPasswordResetEmail = (resetUrl, userName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #111b21; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #00a884 0%, #008069 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
              🔐 Password Reset
            </h1>
          </td>
        </tr>
        <tr>
          <td style="background-color: #202c33; padding: 40px 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #e9edef; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Hi <strong>${userName}</strong>,
            </p>
            <p style="color: #8696a0; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
              We received a request to reset your password. Click the button below to create a new password. This link will expire in <strong style="color: #e9edef;">10 minutes</strong>.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="text-align: center; padding: 20px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00a884 0%, #008069 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(0, 168, 132, 0.3);">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #8696a0; font-size: 14px; line-height: 1.6; margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #374248;">
              If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            <p style="color: #667781; font-size: 12px; line-height: 1.6; margin: 20px 0 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #00a884; word-break: break-all;">${resetUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px; text-align: center;">
            <p style="color: #667781; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} ChatApp. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Welcome email template
export const getWelcomeEmail = (userName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ChatApp</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #111b21; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <tr>
          <td style="background: linear-gradient(135deg, #00a884 0%, #008069 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
              🎉 Welcome to ChatApp!
            </h1>
          </td>
        </tr>
        <tr>
          <td style="background-color: #202c33; padding: 40px 30px; border-radius: 0 0 16px 16px;">
            <p style="color: #e9edef; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Hi <strong>${userName}</strong>,
            </p>
            <p style="color: #8696a0; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
              Thank you for joining ChatApp! We're excited to have you on board.
            </p>
            <div style="background-color: #111b21; border-radius: 12px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #00a884; margin: 0 0 15px; font-size: 16px;">Here's what you can do:</h3>
              <ul style="color: #8696a0; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
                <li>💬 Chat with friends in real-time</li>
                <li>📹 Make video and audio calls</li>
                <li>👥 Create group chats</li>
                <li>📁 Share files and images</li>
                <li>🖥️ Share your screen</li>
              </ul>
            </div>
            <p style="color: #8696a0; font-size: 15px; line-height: 1.6; margin: 0;">
              Start connecting with your friends today!
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px; text-align: center;">
            <p style="color: #667781; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} ChatApp. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export default sendEmail;
