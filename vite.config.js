import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { handleCreateOrder } from './api/create-razorpay-order.js'
import { handleVerifyPayment } from './api/verify-razorpay-payment.js'
import { handleCreateBunnyVideo } from './api/bunny/create-video.js'
import { handleBunnyTusSignature } from './api/bunny/tus-signature.js'
import { handleBunnyVideoStatus } from './api/bunny/video-status.js'
import { handleSubmitAssessment } from './api/submit-assessment.js'
import { handleAdminCreateUser } from './api/admin/create-user.js'
import { handleAdminDeleteUser } from './api/admin/delete-user.js'
import { handleUpload } from './api/upload.js'

function localApiMiddleware() {
  const routeRequest = async (req, res, next) => {
    const url = req.url?.split('?')[0];

    // Assessment evaluation route
    if (url === '/api/submit-assessment') {
      return handleSubmitAssessment(req, res);
    }

    // Admin user management routes
    if (url === '/api/admin/create-user') {
      return handleAdminCreateUser(req, res);
    }
    if (url === '/api/admin/delete-user') {
      return handleAdminDeleteUser(req, res);
    }

    // Razorpay routes
    if (url === '/api/create-razorpay-order') {
      return handleCreateOrder(req, res);
    }
    if (url === '/api/verify-razorpay-payment') {
      return handleVerifyPayment(req, res);
    }

    // Bunny Stream routes
    if (url === '/api/bunny/create-video') {
      return handleCreateBunnyVideo(req, res);
    }
    if (url === '/api/bunny/tus-signature') {
      return handleBunnyTusSignature(req, res);
    }
    if (url === '/api/bunny/video-status') {
      return handleBunnyVideoStatus(req, res);
    }

    // Document / Presentation upload route
    if (url === '/api/upload') {
      return handleUpload(req, res);
    }

    next();
  };

  return {
    name: 'local-api-middleware',
    configureServer(server) {
      server.middlewares.use(routeRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(routeRequest);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), tailwindcss(), localApiMiddleware()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
