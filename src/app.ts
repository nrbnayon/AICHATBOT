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

// Home route - serving the HTML content
app.get('/', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Chatbot Project - Client Information</title>
</head>

<body style="
      font-family: Verdana, Geneva, Tahoma, sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 20px;
    ">
  <div style="
        background-color: #ffffff;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      ">
    <!-- Header -->
    <h1 style="text-align:center; color:#A55FEF; font-family:Verdana;">Hey Frontend Developer, How can I assist you today!</h1>
    <div style="
          background-color: #4caf50;
          color: white;
          text-align: center;
          padding: 20px;
          border-radius: 10px 10px 0 0;
        ">
      <h1 style="margin: 0">AI Chatbot Project</h1>
    </div>

    <!-- Project Details -->
    <div style="padding: 20px; color: #333">
      <div style="margin-bottom: 20px">
        <h3 style="
              margin-bottom: 5px;
              font-size: 18px;
              background: gray;
              color: white;
              padding: 5px;
            ">
          Client Information
        </h3>
        <p><strong>Client Name:</strong> Konrad Gradalski</p>
        <p><strong>Project Start Date:</strong> March 10, 2025</p>
        <p><strong>Expected Completion:</strong> Ongoing</p>
      </div>

      <!-- Developer Information -->
      <div style="margin-bottom: 20px">
        <h3 style="
              margin-bottom: 5px;
              font-size: 18px;
              background: gray;
              color: white;
              padding: 5px;
            ">
          Developer Details
        </h3>
        <p><strong>Software Engineer:</strong> Nayon</p>
        <p><strong>Location:</strong> Dhaka, Bangladesh</p>
      </div>

      <!-- Project Scope -->
      <div style="margin-bottom: 20px">
        <h3 style="
              margin-bottom: 5px;
              font-size: 18px;
              background: gray;
              color: white;
              padding: 5px;
            ">
          Project Scope
        </h3>
        <p><strong>Project Type:</strong> AI Chatbot</p>
        <p><strong>Platforms:</strong> Gmail, Outlook, Yahoo</p>
        <p><strong>Features:</strong> AI-powered email responses, automated client interactions, multilingual support,
          and adaptive learning.</p>
      </div>

      <!-- Contact Information -->
      <div style="margin-bottom: 20px">
        <h3 style="
              margin-bottom: 5px;
              font-size: 18px;
              background: gray;
              color: white;
              padding: 5px;
            ">
          Contact Information
        </h3>
        <p><strong>Email:</strong> <a href="mailto:konrad@example.com">konrad@example.com</a></p>
        <p><strong>Phone:</strong> +1 (555) 123-4567</p>
      </div>
    </div>
  </div>
</body>

</html>
  `);
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

export default app;
// import cors from 'cors';
// import express, { Request, Response } from 'express';
// import { StatusCodes } from 'http-status-codes';
// import globalErrorHandler from './app/middlewares/globalErrorHandler';
// import router from './routes';
// import { Morgan } from './shared/morgen';
// import responseInterceptor from './app/middlewares/responseInterceptor';

// const app = express();

// // Morgan
// app.use(Morgan.successHandler);
// app.use(Morgan.errorHandler);

// app.use(
//   cors({
//     origin: [
//       'http://localhost:3000',
//       'http://localhost:5173',
//       'http://192.168.10.19:3000',
//       'http://10.0.70.173:50262',
//       'https://your-frontend-domain.vercel.app',
//       'https://your-app-name.vercel.app',
//     ],
//     credentials: true,
//   })
// );

// app.use(responseInterceptor);

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// app.use(express.static('uploads'));

// app.use('/api/v1', router);

// // Home route
// app.get('/', (req: Request, res: Response) => {
//   res.send(
//     '<h1 style="text-align:center; color:#A55FEF; font-family:Verdana;">Hey Frontend Developer, How can I assist you today!</h1>'
//   );
// });

// // Error handling
// app.use(globalErrorHandler);

// // Handle not found routes
// app.use((req, res) => {
//   res.status(StatusCodes.NOT_FOUND).json({
//     success: false,
//     message: '❌ API Not Found',
//     errorMessages: [
//       {
//         path: req.originalUrl,
//         message: "🚫 API DOESN'T EXIST",
//       },
//     ],
//   });
// });

// export default app;
