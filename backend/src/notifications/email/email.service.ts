import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSendResult {
  delivered: boolean;
  error?: string;
}

/**
 * Email reminder adapter. Email delivery is configuration-gated: it is only
 * attempted when `EMAIL_ENABLED=true`. When enabled but no real transport is
 * wired in, messages are written to the application log ("log transport") so
 * the rest of the reminder pipeline can be exercised locally. A production
 * deployment can replace `deliver` with an SMTP/provider transport.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    const flag = this.configService
      .get<string>('EMAIL_ENABLED')
      ?.trim()
      .toLowerCase();
    return ['true', '1', 'yes', 'on'].includes(flag ?? '');
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!this.isEnabled()) {
      return { delivered: false, error: 'EMAIL_DISABLED' };
    }
    if (!message.to) {
      return { delivered: false, error: 'MISSING_RECIPIENT' };
    }
    try {
      await this.deliver(message);
      return { delivered: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      this.logger.error(`Email delivery failed for ${message.to}: ${reason}`);
      return { delivered: false, error: reason };
    }
  }

  /**
   * Default "log transport". Replace with a real SMTP/provider call when
   * operating an email server.
   */
  protected async deliver(message: EmailMessage): Promise<void> {
    this.logger.log(`[email] to=${message.to} subject="${message.subject}"`);
    await Promise.resolve();
  }
}
