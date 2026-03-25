import nodemailer from "nodemailer";

// Lazy initialization of transporter
let transporter = null;

/**
 * Get or create email transporter
 * @returns {Object} Nodemailer transporter
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App password for Gmail
      },
    });
  }
  return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise}
 */
export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"UniLife" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  return getTransporter().sendMail(mailOptions);
};

/**
 * Send OTP email for registration
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise}
 */
export const sendOTPEmail = async (email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Xác thực tài khoản UniLife</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">UniLife</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Xác thực tài khoản của bạn</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Xin chào,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản UniLife. Vui lòng sử dụng mã OTP bên dưới để xác thực email của bạn:</p>
        <div style="background: #fff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea;">
          <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">⏰ Mã OTP này sẽ hết hạn sau <strong>5 phút</strong>.</p>
        <p style="color: #666; font-size: 14px;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">© 2026 UniLife. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Mã xác thực OTP - UniLife",
    html,
  });
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise}
 */
export const sendPasswordResetOTP = async (email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Đặt lại mật khẩu UniLife</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">UniLife</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Đặt lại mật khẩu</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới:</p>
        <div style="background: #fff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px dashed #f5576c;">
          <span style="font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">⏰ Mã OTP này sẽ hết hạn sau <strong>5 phút</strong>.</p>
        <p style="color: #666; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và đảm bảo tài khoản của bạn an toàn.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">© 2026 UniLife. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Đặt lại mật khẩu - UniLife",
    html,
  });
};

export const sendSystemUserPasswordEmail = async (email, fullName, tempPassword, isReissue = false) => {
  const title = isReissue ? "Cấp lại mật khẩu tài khoản UniLife" : "Tài khoản UniLife đã tạo thành công";
  const message = isReissue 
    ? "Quản trị viên vừa cấp lại mật khẩu tạm thời cho tài khoản của bạn. Vui lòng sử dụng mật khẩu bên dưới để đăng nhập:"
    : "Chào mừng bạn đến với UniLife! Tài khoản hệ thống của bạn đã được tạo thành công. Vui lòng sử dụng mật khẩu tạm thời bên dưới để đăng nhập lần đầu:";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">UniLife</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${title}</p>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>${message}</p>
        <div style="background: #fff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px dashed #4facfe;">
          <span style="font-size: 28px; font-weight: bold; color: #4facfe; letter-spacing: 4px;">${tempPassword}</span>
        </div>
        <p style="color: #666; font-size: 14px;">⚠️ <strong>Lưu ý quan trọng:</strong></p>
        <ul style="color: #666; font-size: 14px;">
          <li>Mật khẩu này sẽ tự động <strong>hết hạn sau 24 giờ</strong>.</li>
          <li>Hệ thống sẽ yêu cầu bạn <strong>đổi mật khẩu mới</strong> ngay trong lần đăng nhập đầu tiên.</li>
        </ul>
        <p style="color: #666; font-size: 14px;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">© 2026 UniLife. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `[UniLife] ${title}`,
    html,
  });
};

export default getTransporter;
