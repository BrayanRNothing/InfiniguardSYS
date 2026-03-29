import { Router } from 'express';
import productsRouter from './routes/products.js';
import newsRouter from './routes/news.js';

export function createLorangRouter(pool) {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({ ok: true, module: 'lorang', mode: 'postgresql', imageStorage: 'base64' });
  });

  router.use('/products', productsRouter(pool));
  router.use('/news', newsRouter(pool));

  return router;
}
