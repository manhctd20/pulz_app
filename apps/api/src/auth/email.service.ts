import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const fromEmail = this.config.get<string>('EMAIL_FROM', 'hello@pulz.dev');
    const appName = 'PulzApp';

    if (!apiKey) {
      // Dev mode: chỉ log, không thực sự gửi. Token cũng được trả về trong response cho dev.
      this.logger.warn(
        `[EmailService] RESEND_API_KEY chưa set — không gửi email thật. Token cho ${to}: ${token}`,
      );
      return;
    }

    // Production: gửi qua Resend HTTP API (không cần SDK).
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject: `${appName} — Đặt lại mật khẩu`,
          html: this.resetPasswordHtml(token),
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Resend failed ${res.status}: ${body}`);
      }
    } catch (e) {
      this.logger.error('Email send error', e as Error);
    }
  }

  private resetPasswordHtml(token: string): string {
    return `
      <div style="font-family: sans-serif; padding: 20px; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #7F77DD;">PulzApp — Đặt lại mật khẩu</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã token (hết hạn sau 30 phút):</p>
        <p style="background: #F4F4F7; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 16px; word-break: break-all;">
          <strong>${token}</strong>
        </p>
        <p>Mở app PulzApp → Quên mật khẩu → paste mã trên + đặt mật khẩu mới.</p>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">
          Nếu bạn không yêu cầu đặt lại, vui lòng bỏ qua email này.
        </p>
      </div>
    `;
  }
}
