import { Router } from 'express';

function mapProduct(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    detalles: row.detalles || '',
    precio: row.precio,
    imagen: row.imagen,
    images: Array.isArray(row.images) ? row.images : [],
    category: row.category || 'all',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeImages(imagen, imagesRaw = []) {
  const base = [];

  if (Array.isArray(imagesRaw)) {
    for (const item of imagesRaw) {
      if (typeof item === 'string' && item.trim()) {
        base.push(item.trim());
      }
    }
  }

  if (typeof imagen === 'string' && imagen.trim()) {
    const main = imagen.trim();
    if (!base.includes(main)) {
      base.unshift(main);
    }
  }

  return base;
}

function isAcceptedImageValue(value) {
  if (typeof value !== 'string') return false;
  const cleaned = value.trim();
  return cleaned.startsWith('data:image/') || cleaned.startsWith('http://') || cleaned.startsWith('https://');
}

export default function createProductsRouter(pool) {
  const router = Router();

  router.get('/__mode', (req, res) => {
    res.json({ mode: 'postgresql', imageStorage: 'base64' });
  });

  router.get('/', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM lorang_products ORDER BY id DESC');
      return res.json(rows.map(mapProduct));
    } catch (err) {
      console.error('Lorang products GET error:', err);
      return res.status(500).json({ error: 'Error al leer productos' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalido' });
      }

      const { rows } = await pool.query('SELECT * FROM lorang_products WHERE id = $1', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
      return res.json(mapProduct(rows[0]));
    } catch (err) {
      console.error('Lorang products GET by id error:', err);
      return res.status(500).json({ error: 'Error al buscar el producto' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const {
        nombre,
        descripcion,
        detalles,
        details,
        precio,
        imagen,
        images,
        category,
        categoria
      } = req.body;

      const normalizedCategory = category || categoria || 'all';
      const normalizedDetails = details || detalles || '';
      const normalizedImages = normalizeImages(imagen, images);

      if (!nombre || !descripcion || !precio || normalizedImages.length === 0) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      if (!normalizedImages.every(isAcceptedImageValue)) {
        return res.status(400).json({ error: 'Las imagenes deben ser base64 (data:image/...) o URL valida.' });
      }

      const { rows } = await pool.query(
        `INSERT INTO lorang_products (nombre, descripcion, detalles, precio, imagen, images, category)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         RETURNING *`,
        [
          nombre,
          descripcion,
          normalizedDetails,
          String(precio),
          normalizedImages[0],
          JSON.stringify(normalizedImages),
          normalizedCategory
        ]
      );

      await pool.query(
        `INSERT INTO lorang_product_changes (product_id, action, payload)
         VALUES ($1, 'create', $2::jsonb)`,
        [rows[0].id, JSON.stringify({ nombre, descripcion, precio })]
      );

      return res.status(201).json(mapProduct(rows[0]));
    } catch (err) {
      console.error('Lorang products POST error:', err);
      return res.status(500).json({ error: 'Error al guardar el producto' });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalido' });
      }

      const {
        nombre,
        descripcion,
        precio,
        imagen,
        images,
        category,
        categoria,
        details,
        detalles
      } = req.body;

      const normalizedCategory = category || categoria || 'all';
      const normalizedDetails = details || detalles || '';
      const normalizedImages = normalizeImages(imagen, images);

      if (!nombre || !descripcion || !precio || normalizedImages.length === 0) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      if (!normalizedImages.every(isAcceptedImageValue)) {
        return res.status(400).json({ error: 'Las imagenes deben ser base64 (data:image/...) o URL valida.' });
      }

      const { rows } = await pool.query(
        `UPDATE lorang_products
         SET nombre = $1,
             descripcion = $2,
             detalles = $3,
             precio = $4,
             imagen = $5,
             images = $6::jsonb,
             category = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [
          nombre,
          descripcion,
          normalizedDetails,
          String(precio),
          normalizedImages[0],
          JSON.stringify(normalizedImages),
          normalizedCategory,
          id
        ]
      );

      if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });

      await pool.query(
        `INSERT INTO lorang_product_changes (product_id, action, payload)
         VALUES ($1, 'update', $2::jsonb)`,
        [id, JSON.stringify({ nombre, descripcion, precio })]
      );

      return res.json(mapProduct(rows[0]));
    } catch (err) {
      console.error('Lorang products PUT error:', err);
      return res.status(500).json({ error: 'Error al actualizar el producto' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalido' });
      }

      const result = await pool.query('DELETE FROM lorang_products WHERE id = $1 RETURNING id', [id]);
      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      await pool.query(
        `INSERT INTO lorang_product_changes (product_id, action, payload)
         VALUES ($1, 'delete', $2::jsonb)`,
        [id, JSON.stringify({ id })]
      );

      return res.json({ success: true, message: 'Producto eliminado correctamente' });
    } catch (err) {
      console.error('Lorang products DELETE error:', err);
      return res.status(500).json({ error: 'Error al eliminar el producto' });
    }
  });

  return router;
}
