// src/app/modules/mail/mail.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthRequest } from '../../middlewares/auth';
import ApiError from '../../../errors/ApiError';
import {
  fetchEmails,
  sendEmail,
  readEmail,
  trashEmail,
  markEmailAsRead,
  openEmail,
  getPrompt,
  listPrompts,
  listTools,
} from './mail.service';

const fetchEmailsController = catchAsync(
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const emails = await fetchEmails(authReq);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Emails fetched successfully for provider ${authReq.user.authProvider}`,
      data: emails,
    });
  }
);

const sendEmailController = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { to, subject, message } = req.body;
  const files = req.files as Express.Multer.File[];
  const result = await sendEmail(authReq, to, subject, message, files);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Email sent successfully',
    data: result,
  });
});

const readEmailController = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;
  const emailContent = await readEmail(authReq, id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Email read successfully',
    data: emailContent,
  });
});

const trashEmailController = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;
  const result = await trashEmail(authReq, id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Email trashed successfully',
    data: result,
  });
});

const markEmailAsReadController = catchAsync(
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const result = await markEmailAsRead(authReq, id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Email marked as read successfully',
      data: result,
    });
  }
);

const openEmailController = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { id } = req.params;
  const result = await openEmail(authReq, id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Email link provided successfully',
    data: result,
  });
});

const getPromptController = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { name } = req.params;
  const args = req.body.arguments;
  const prompt = await getPrompt(authReq, name, args);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Prompt retrieved successfully',
    data: prompt,
  });
});

const listPromptsController = catchAsync(
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const prompts = await listPrompts(authReq);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Prompts listed successfully',
      data: prompts,
    });
  }
);

const listToolsController = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const tools = await listTools(authReq);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Tools listed successfully',
    data: tools,
  });
});

export const MailController = {
  fetchEmails: fetchEmailsController,
  sendEmail: sendEmailController,
  readEmail: readEmailController,
  trashEmail: trashEmailController,
  markEmailAsRead: markEmailAsReadController,
  openEmail: openEmailController,
  getPrompt: getPromptController,
  listPrompts: listPromptsController,
  listTools: listToolsController,
};
