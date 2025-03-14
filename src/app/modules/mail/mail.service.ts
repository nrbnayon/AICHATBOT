// src/app/modules/mail/mail.service.ts
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { AuthRequest } from '../../middlewares/auth';
import { Express } from 'express';
import { ReadStream, WriteStream } from 'fs';
import { Buffer } from 'buffer';
import fetch from 'node-fetch'; // For Yahoo API calls
import { AUTH_PROVIDER } from '../../../enums/common';

// Interfaces for MCP server types
interface Prompt {
  name: string;
  description: string;
  arguments: PromptArgument[] | null;
}

interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
}

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[] | null;
  };
}

interface TextContent {
  type: 'text';
  text: string;
  artifact?: { type: string; data: any };
}

interface PromptMessage {
  role: 'user';
  content: TextContent;
}

interface GetPromptResult {
  messages: PromptMessage[];
}

// Interface for email services
interface EmailService {
  sendEmail(
    recipientId: string,
    subject: string,
    message: string,
    attachments?: Express.Multer.File[]
  ): Promise<{ status: string; message_id?: string; error_message?: string }>;
  getUnreadEmails(): Promise<{ id: string; threadId?: string }[] | string>;
  readEmail(
    emailId: string
  ): Promise<
    | {
        content: string;
        subject: string;
        from: string;
        to: string;
        date: string;
      }
    | string
  >;
  trashEmail(emailId: string): Promise<string>;
  markEmailAsRead(emailId: string): Promise<string>;
  openEmail(emailId: string): Promise<string>;
}

// MCP Server prompts and tools
const EMAIL_ADMIN_PROMPTS = `You are an email administrator. 
You can draft, edit, read, trash, open, and send emails.
You've been given access to a specific email account. 
You have the following tools available:
- Send an email (send-email)
- Retrieve unread emails (get-unread-emails)
- Read email content (read-email)
- Trash email (trash-email)
- Open email in browser (open-email)
Never send an email draft or trash an email unless the user confirms first. 
Always ask for approval if not already given.`;

const PROMPTS: Record<string, Prompt> = {
  'manage-email': {
    name: 'manage-email',
    description: 'Act like an email administrator',
    arguments: null,
  },
  'draft-email': {
    name: 'draft-email',
    description: 'Draft an email with content and recipient',
    arguments: [
      {
        name: 'content',
        description: 'What the email is about',
        required: true,
      },
      {
        name: 'recipient',
        description: 'Who should the email be addressed to',
        required: true,
      },
      {
        name: 'recipient_email',
        description: "Recipient's email address",
        required: true,
      },
    ],
  },
  'edit-draft': {
    name: 'edit-draft',
    description: 'Edit the existing email draft',
    arguments: [
      {
        name: 'changes',
        description: 'What changes should be made to the draft',
        required: true,
      },
      {
        name: 'current_draft',
        description: 'The current draft to edit',
        required: true,
      },
    ],
  },
};

const TOOLS: Tool[] = [
  {
    name: 'send-email',
    description: `Sends email to recipient. 
    Do not use if user only asked to draft email. 
    Drafts must be approved before sending.`,
    inputSchema: {
      type: 'object',
      properties: {
        recipient_id: {
          type: 'string',
          description: 'Recipient email address',
        },
        subject: { type: 'string', description: 'Email subject' },
        message: { type: 'string', description: 'Email content text' },
      },
      required: ['recipient_id', 'subject', 'message'],
    },
  },
  {
    name: 'trash-email',
    description: `Moves email to trash. 
    Confirm before moving email to trash.`,
    inputSchema: {
      type: 'object',
      properties: { email_id: { type: 'string', description: 'Email ID' } },
      required: ['email_id'],
    },
  },
  {
    name: 'get-unread-emails',
    description: 'Retrieve unread emails',
    inputSchema: { type: 'object', properties: {}, required: null },
  },
  {
    name: 'read-email',
    description: 'Retrieves given email content',
    inputSchema: {
      type: 'object',
      properties: { email_id: { type: 'string', description: 'Email ID' } },
      required: ['email_id'],
    },
  },
  {
    name: 'mark-email-as-read',
    description: 'Marks given email as read',
    inputSchema: {
      type: 'object',
      properties: { email_id: { type: 'string', description: 'Email ID' } },
      required: ['email_id'],
    },
  },
  {
    name: 'open-email',
    description: 'Open email in browser',
    inputSchema: {
      type: 'object',
      properties: { email_id: { type: 'string', description: 'Email ID' } },
      required: ['email_id'],
    },
  },
];

// Gmail-specific email service
class GmailService implements EmailService {
  private gmail: gmail_v1.Gmail;
  private userEmail: string;

  constructor(oauth2Client: OAuth2Client, userEmail: string) {
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    this.userEmail = userEmail;
  }

  async sendEmail(
    recipientId: string,
    subject: string,
    message: string,
    attachments?: Express.Multer.File[]
  ): Promise<{ status: string; message_id?: string; error_message?: string }> {
    try {
      const messageParts = [
        `From: ${this.userEmail}`,
        `To: ${recipientId}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
      ];

      if (attachments && attachments.length > 0) {
        const boundary = `boundary_${Date.now().toString(16)}`;
        messageParts.push(
          `Content-Type: multipart/mixed; boundary=${boundary}`
        );
        messageParts.push('');
        messageParts.push(`--${boundary}`);
        messageParts.push('Content-Type: text/plain; charset=UTF-8');
        messageParts.push('Content-Transfer-Encoding: 7bit');
        messageParts.push('');
        messageParts.push(message);
        messageParts.push('');

        for (const file of attachments) {
          messageParts.push(`--${boundary}`);
          messageParts.push(
            `Content-Type: ${file.mimetype || 'application/octet-stream'}`
          );
          messageParts.push('Content-Transfer-Encoding: base64');
          messageParts.push(
            `Content-Disposition: attachment; filename="${file.originalname}"`
          );
          messageParts.push('');
          const fileContent = Buffer.from(file.buffer).toString('base64');
          for (let i = 0; i < fileContent.length; i += 76) {
            messageParts.push(fileContent.substring(i, i + 76));
          }
          messageParts.push('');
        }
        messageParts.push(`--${boundary}--`);
      } else {
        messageParts.push('Content-Type: text/plain; charset=UTF-8');
        messageParts.push('');
        messageParts.push(message);
      }

      const email = messageParts.join('\r\n');
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedEmail },
      });

      return { status: 'success', message_id: response.data.id };
    } catch (error) {
      return { status: 'error', error_message: (error as Error).message };
    }
  }

  async getUnreadEmails(): Promise<
    { id: string; threadId?: string }[] | string
  > {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox is:unread category:primary',
      });
      return response.data.messages || [];
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async readEmail(
    emailId: string
  ): Promise<
    | {
        content: string;
        subject: string;
        from: string;
        to: string;
        date: string;
      }
    | string
  > {
    try {
      const msg = await this.gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'raw',
      });

      const rawData = msg.data.raw!;
      const decodedData = Buffer.from(rawData, 'base64');
      const mimeMessage = decodedData.toString();

      let body = '';
      if (msg.data.payload?.parts) {
        for (const part of msg.data.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
            break;
          }
        }
      } else if (msg.data.payload?.body?.data) {
        body = Buffer.from(msg.data.payload.body.data, 'base64').toString();
      }

      const headers = msg.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const to = headers.find(h => h.name === 'To')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      await this.markEmailAsRead(emailId);
      return { content: body, subject, from, to, date };
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async trashEmail(emailId: string): Promise<string> {
    try {
      await this.gmail.users.messages.trash({ userId: 'me', id: emailId });
      return 'Email moved to trash successfully.';
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async markEmailAsRead(emailId: string): Promise<string> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: emailId,
        requestBody: { removeLabelIds: ['UNREAD'] },
      });
      return 'Email marked as read.';
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async openEmail(emailId: string): Promise<string> {
    try {
      const url = `https://mail.google.com/#all/${emailId}`;
      return `Email can be opened at: ${url}`; // In a real app, you might use a browser opener
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }
}

// Outlook-specific email service (placeholder)
class OutlookService implements EmailService {
  private accessToken: string;
  private userEmail: string;

  constructor(accessToken: string, userEmail: string) {
    this.accessToken = accessToken;
    this.userEmail = userEmail;
  }

  async sendEmail(
    recipientId: string,
    subject: string,
    message: string,
    attachments?: Express.Multer.File[]
  ): Promise<{ status: string; message_id?: string; error_message?: string }> {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/sendMail',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              subject,
              body: { contentType: 'Text', content: message },
              toRecipients: [{ emailAddress: { address: recipientId } }],
              attachments: attachments?.map(file => ({
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: file.originalname,
                contentType: file.mimetype,
                contentBytes: Buffer.from(file.buffer).toString('base64'),
              })),
            },
          }),
        }
      );

      if (!response.ok) throw new Error(await response.text());
      return { status: 'success' };
    } catch (error) {
      return { status: 'error', error_message: (error as Error).message };
    }
  }

  async getUnreadEmails(): Promise<
    { id: string; threadId?: string }[] | string
  > {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=isRead eq false',
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );
      const data = await response.json();
      return data.value.map((msg: any) => ({
        id: msg.id,
        threadId: msg.conversationId,
      }));
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async readEmail(
    emailId: string
  ): Promise<
    | {
        content: string;
        subject: string;
        from: string;
        to: string;
        date: string;
      }
    | string
  > {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${emailId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );
      const data = await response.json();
      await this.markEmailAsRead(emailId);
      return {
        content: data.body.content,
        subject: data.subject,
        from: data.from.emailAddress.address,
        to: data.toRecipients[0].emailAddress.address,
        date: data.receivedDateTime,
      };
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async trashEmail(emailId: string): Promise<string> {
    try {
      await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${emailId}/move`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ destinationId: 'deleteditems' }),
        }
      );
      return 'Email moved to trash successfully.';
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async markEmailAsRead(emailId: string): Promise<string> {
    try {
      await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });
      return 'Email marked as read.';
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async openEmail(emailId: string): Promise<string> {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${emailId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );
      const data = await response.json();
      return `Email can be opened at: ${data.webLink}`;
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }
}

// Yahoo-specific email service (placeholder)
class YahooService implements EmailService {
  private accessToken: string;
  private userEmail: string;

  constructor(accessToken: string, userEmail: string) {
    this.accessToken = accessToken;
    this.userEmail = userEmail;
  }

  async sendEmail(
    recipientId: string,
    subject: string,
    message: string,
    attachments?: Express.Multer.File[]
  ): Promise<{ status: string; message_id?: string; error_message?: string }> {
    try {
      // Yahoo Mail API is not publicly documented; this is a placeholder
      // You would need to use a third-party library or Yahoo's SMTP server
      throw new Error('Yahoo Mail API not implemented');
    } catch (error) {
      return { status: 'error', error_message: (error as Error).message };
    }
  }

  async getUnreadEmails(): Promise<
    { id: string; threadId?: string }[] | string
  > {
    try {
      throw new Error('Yahoo Mail API not implemented');
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async readEmail(
    emailId: string
  ): Promise<
    | {
        content: string;
        subject: string;
        from: string;
        to: string;
        date: string;
      }
    | string
  > {
    try {
      throw new Error('Yahoo Mail API not implemented');
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async trashEmail(emailId: string): Promise<string> {
    try {
      throw new Error('Yahoo Mail API not implemented');
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async markEmailAsRead(emailId: string): Promise<string> {
    try {
      throw new Error('Yahoo Mail API not implemented');
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }

  async openEmail(emailId: string): Promise<string> {
    try {
      throw new Error('Yahoo Mail API not implemented');
    } catch (error) {
      return `An error occurred: ${(error as Error).message}`;
    }
  }
}

// Factory to create the appropriate email service
const createEmailService = async (req: AuthRequest): Promise<EmailService> => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

  const authProvider = user.authProvider;
  const userEmail = user.email;

  switch (authProvider) {
    case AUTH_PROVIDER.GOOGLE: {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.refreshToken,
      });
      return new GmailService(oauth2Client, userEmail);
    }
    case AUTH_PROVIDER.MICROSOFT: {
      return new OutlookService(user.googleAccessToken!, userEmail); // Use Microsoft access token
    }
    case AUTH_PROVIDER.YAHOO: {
      return new YahooService(user.googleAccessToken!, userEmail); // Use Yahoo access token
    }
    default:
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Unsupported auth provider: ${authProvider}`
      );
  }
};

// MCP Server implementation
class MCPServer {
  private emailService: EmailService;

  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }

  async listPrompts(): Promise<Prompt[]> {
    return Object.values(PROMPTS);
  }

  async getPrompt(
    name: string,
    args?: Record<string, string>
  ): Promise<GetPromptResult> {
    if (!PROMPTS[name]) throw new Error(`Prompt not found: ${name}`);

    if (name === 'manage-email') {
      return {
        messages: [
          {
            role: 'user',
            content: { type: 'text', text: EMAIL_ADMIN_PROMPTS },
          },
        ],
      };
    } else if (name === 'draft-email') {
      const content = args?.content || '';
      const recipient = args?.recipient || '';
      const recipientEmail = args?.recipient_email || '';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please draft an email about ${content} for ${recipient} (${recipientEmail}).
              Include a subject line starting with 'Subject:' on the first line.
              Do not send the email yet, just draft it and ask the user for their thoughts.`,
            },
          },
        ],
      };
    } else if (name === 'edit-draft') {
      const changes = args?.changes || '';
      const currentDraft = args?.current_draft || '';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please revise the current email draft:\n${currentDraft}\n\nRequested changes:\n${changes}\n\nPlease provide the updated draft.`,
            },
          },
        ],
      };
    }
    throw new Error('Prompt implementation not found');
  }

  async listTools(): Promise<Tool[]> {
    return TOOLS;
  }

  async callTool(
    name: string,
    args?: Record<string, any>
  ): Promise<TextContent[]> {
    if (name === 'send-email') {
      const recipientId = args?.recipient_id;
      const subject = args?.subject;
      const message = args?.message;
      if (!recipientId || !subject || !message)
        throw new Error('Missing required parameters');

      const sendResponse = await this.emailService.sendEmail(
        recipientId,
        subject,
        message
      );
      return [
        {
          type: 'text',
          text:
            sendResponse.status === 'success'
              ? `Email sent successfully. Message ID: ${sendResponse.message_id}`
              : `Failed to send email: ${sendResponse.error_message}`,
        },
      ];
    } else if (name === 'get-unread-emails') {
      const unreadEmails = await this.emailService.getUnreadEmails();
      return [
        {
          type: 'text',
          text: JSON.stringify(unreadEmails),
          artifact: { type: 'json', data: unreadEmails },
        },
      ];
    } else if (name === 'read-email') {
      const emailId = args?.email_id;
      if (!emailId) throw new Error('Missing email ID parameter');
      const retrievedEmail = await this.emailService.readEmail(emailId);
      return [
        {
          type: 'text',
          text: JSON.stringify(retrievedEmail),
          artifact: { type: 'dictionary', data: retrievedEmail },
        },
      ];
    } else if (name === 'open-email') {
      const emailId = args?.email_id;
      if (!emailId) throw new Error('Missing email ID parameter');
      const msg = await this.emailService.openEmail(emailId);
      return [{ type: 'text', text: msg }];
    } else if (name === 'trash-email') {
      const emailId = args?.email_id;
      if (!emailId) throw new Error('Missing email ID parameter');
      const msg = await this.emailService.trashEmail(emailId);
      return [{ type: 'text', text: msg }];
    } else if (name === 'mark-email-as-read') {
      const emailId = args?.email_id;
      if (!emailId) throw new Error('Missing email ID parameter');
      const msg = await this.emailService.markEmailAsRead(emailId);
      return [{ type: 'text', text: msg }];
    }
    throw new Error(`Unknown tool: ${name}`);
  }

  // Placeholder for stdio server (not implemented in Express.js context)
  async run(readStream: ReadStream, writeStream: WriteStream): Promise<void> {
    throw new Error('Stdio server not implemented in Express.js context');
  }
}

// Service methods for email operations
export const fetchEmails = async (req: AuthRequest) => {
  const emailService = await createEmailService(req);
  const mcpServer = new MCPServer(emailService);
  const unreadEmails = await mcpServer.callTool('get-unread-emails');
  return unreadEmails[0].artifact?.data;
};

export const sendEmail = async (
  req: AuthRequest,
  to: string,
  subject: string,
  message: string,
  attachments?: Express.Multer.File[]
) => {
  const emailService = await createEmailService(req);
  const mcpServer = new MCPServer(emailService);
  const sendResponse = await mcpServer.callTool('send-email', {
    recipient_id: to,
    subject,
    message,
  });
  return sendResponse[0].text;
};

export const readEmail = async (req: AuthRequest, emailId: string) => {
  const emailService = await createEmailService(req);
  const mcpServer = new MCPServer(emailService);
  const emailContent = await mcpServer.callTool('read-email', {
    email_id: emailId,
  });
  return emailContent[0].artifact?.data;
};

export const trashEmail = async (req: AuthRequest, emailId: string) => {
  const emailService = await createEmailService(req);
  const mcpServer = new MCPServer(emailService);
  const trashResponse = await mcpServer.callTool('trash-email', {
    email_id: emailId,
  });
  return trashResponse[0].text;
};

export const markEmailAsRead = async (req: AuthRequest, emailId: string) => {
  const emailService = await createEmailService(req);
  const mcpServer = new MCPServer(emailService);
  const readResponse = await mcpServer.callTool('mark-email-as-read', {
    email_id: emailId,
  });
  return readResponse[0].text;
};

export const openEmail = async (req: AuthRequest, emailId: string) => {
  const emailService = await createEmailService(req);
  const mcpServer = new MCPServer(emailService);
  const openResponse = await mcpServer.callTool('open-email', {
    email_id: emailId,
  });
  return openResponse[0].text;
};

export const getPrompt = async (
  req: AuthRequest,
  name: string,
  args?: Record<string, string>
) => {
  const emailService = await createEmailService(req);
  const mcpServer = new MCPServer(emailService);
  return mcpServer.getPrompt(name, args);
};

export const listPrompts = async (req: AuthRequest) => {
  const emailService = await createEmailService(req);
  const mcpServer = new MCPServer(emailService);
  return mcpServer.listPrompts();
};

export const listTools = async (req: AuthRequest) => {
  const emailService = await createEmailService(req);
  const mcpServer = new MCPServer(emailService);
  return mcpServer.listTools();
};
