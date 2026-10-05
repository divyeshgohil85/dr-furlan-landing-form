import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// Node.js ES modules do not have __dirname built-in, so we reconstruct it.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
// Serve the static files out of the Vite build folder
app.use(express.static(path.join(__dirname, 'dist')));
// Catch-all route to hand off routing entirely to React
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
// Bind to 0.0.0.0 so Cloudways' NGINX proxy can route incoming traffic
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});