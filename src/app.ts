import cors from 'cors';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './routes';
import { Morgan } from './shared/morgen';
import responseInterceptor from './app/middlewares/responseInterceptor';

const app = express();

// Morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://192.168.10.19:3000',
      'http://10.0.70.173:50262',
      'https://your-frontend-domain.vercel.app',
      'https://your-app-name.vercel.app',
    ],
    credentials: true,
  })
);

app.use(responseInterceptor);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static('uploads'));

app.use('/api/v1', router);

// Home route
app.get('/', (req: Request, res: Response) => {
  res.send(
    '<h1 style="text-align:center; color:#A55FEF; font-family:Verdana;">Hey Frontend Developer, How can I assist you today!</h1>'
  );
});

// Error handling
app.use(globalErrorHandler);

// Handle not found routes
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '❌ API Not Found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: "🚫 API DOESN'T EXIST",
      },
    ],
  });
});

// Don't run the server when in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
