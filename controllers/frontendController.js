// const path = require('path');
// const fs = require('fs');

// const serveAdmin = (req, res) => {
//   const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
//   if (fs.existsSync(indexPath)) {
//     res.sendFile(indexPath);
//   } else {
//     res.status(404).json({
//       message: 'Admin Dashboard Not Available',
//       error: 'Frontend application is not built',
//       solution: 'To access the admin dashboard:',
//       steps: [
//         '1. Open terminal in the frontend directory',
//         '2. Run: npm run build',
//         '3. Restart the server',
//         '4. Try accessing /admin again'
//       ], 
//       adminCredentials: {
//         email: process.env.ADMIN_EMAIL || 'admin@agrirent.com',
//         password: process.env.ADMIN_PASSWORD || 'admin123'
//       }
//     });
//   }
// };

// const serveFrontend = (req, res) => {
//   // Don't serve index.html for API routes
//   if (req.path.startsWith('/api/')) {
//     return res.status(404).json({ message: 'API endpoint not found' });
//   }
  
//   // Check if frontend is built
//   const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
//   if (fs.existsSync(indexPath)) {
//     // For all other routes, serve the React app
//     res.sendFile(indexPath);
//   } else {
//     // Frontend not built - provide helpful error message
//     res.status(404).json({
//       message: 'Frontend not built',
//       error: 'The frontend application has not been built yet.',
//       solution: 'Please run "npm run build" in the frontend directory, then restart the server.',
//       routes: {
//         api: '/api/*',
//         admin: '/admin (requires frontend build)',
//         dashboard: '/dashboard (requires frontend build)'
//       }
//     });
//   }
// };

// module.exports = {
//   serveAdmin,
//   serveFrontend
// };
