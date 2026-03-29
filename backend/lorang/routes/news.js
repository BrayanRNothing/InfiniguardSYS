import { Router } from 'express';

const ALLOWED_TYPES = new Set(['evento', 'anuncio', 'lanzamiento', 'comunicado']);

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeType(value) {
  const cleanType = normalizeText(value).toLowerCase();
  if (ALLOWED_TYPES.has(cleanType)) return cleanType;
  return 'anuncio';
}

function mapNews(row) {
  return {
    id: String(row.id),
    tipo: row.tipo || 'anuncio',
    titulo: row.titulo,
    resumen: row.resumen,
    contenido: row.contenido,
    imagen: row.imagen || '',
    fechaEvento: row.fecha_evento || '',
    horaEvento: row.hora_evento || '',
    ubicacion: row.ubicacion || '',
    enlace: row.enlace || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validatePayload(payload) {
  const tipo = normalizeType(payload?.tipo);
  const titulo = normalizeText(payload?.titulo);
  const resumen = normalizeText(payload?.resumen);
  const contenido = normalizeText(payload?.contenido);
  const imagen = normalizeText(payload?.imagen);
  const fechaEvento = normalizeText(payload?.fechaEvento || payload?.fecha_evento);
  const horaEvento = normalizeText(payload?.horaEvento || payload?.hora_evento);
  const ubicacion = normalizeText(payload?.ubicacion || payload?.lugar);
  const enlace = normalizeText(payload?.enlace);

  if (!titulo || !resumen || !contenido) {
    return { error: 'Completa titulo, resumen y contenido del post.' };
  }

  if (tipo === 'evento') {
    if (!fechaEvento || !horaEvento) {
      return { error: 'Para eventos, agrega fecha y hora.' };
    }
    if (!ubicacion && !enlace) {
      return { error: 'Para eventos, agrega ubicacion o un enlace de referencia.' };
    }
  }

  return {
    value: {
      tipo,
      titulo,
      resumen,
      contenido,
      imagen,
      fechaEvento,
      horaEvento,
      ubicacion,
      enlace
    }
  };
}

export default function createNewsRouter(pool) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM lorang_news ORDER BY created_at DESC, id DESC');
      return res.json(rows.map(mapNews));
    } catch (err) {
      console.error('Lorang news GET error:', err);
      return res.status(500).json({ error: 'Error al leer noticias' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalido' });
      }

      const { rows } = await pool.query('SELECT * FROM lorang_news WHERE id = $1', [id]);
      if (!rows[0]) {
        return res.status(404).json({ error: 'Post no encontrado' });
      }

      return res.json(mapNews(rows[0]));
    } catch (err) {
      console.error('Lorang news GET by id error:', err);
      return res.status(500).json({ error: 'Error al buscar el post' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const parsed = validatePayload(req.body);
      if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
      }

      const { value } = parsed;
      const { rows } = await pool.query(
        `INSERT INTO lorang_news (tipo, titulo, resumen, contenido, imagen, fecha_evento, hora_evento, ubicacion, enlace)
         VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::date, $7, $8, $9)
         RETURNING *`,
        [
          value.tipo,
          value.titulo,
          value.resumen,
          value.contenido,
          value.imagen || null,
          value.fechaEvento,
          value.horaEvento || null,
          value.ubicacion || null,
          value.enlace || null
        ]
      );

      return res.status(201).json(mapNews(rows[0]));
    } catch (err) {
      console.error('Lorang news POST error:', err);
      return res.status(500).json({ error: 'Error al guardar el post' });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalido' });
      }

      const parsed = validatePayload(req.body);
      if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
      }

      const { value } = parsed;
      const { rows } = await pool.query(
        `UPDATE lorang_news
         SET tipo = $1,
             titulo = $2,
             resumen = $3,
             contenido = $4,
             imagen = $5,
             fecha_evento = NULLIF($6, '')::date,
             hora_evento = $7,
             ubicacion = $8,
             enlace = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING *`,
        [
          value.tipo,
          value.titulo,
          value.resumen,
          value.contenido,
          value.imagen || null,
          value.fechaEvento,
          value.horaEvento || null,
          value.ubicacion || null,
          value.enlace || null,
          id
        ]
      );

      if (!rows[0]) {
        return res.status(404).json({ error: 'Post no encontrado' });
      }

      return res.json(mapNews(rows[0]));
    } catch (err) {
      console.error('Lorang news PUT error:', err);
      return res.status(500).json({ error: 'Error al actualizar el post' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalido' });
      }

      const result = await pool.query('DELETE FROM lorang_news WHERE id = $1 RETURNING id', [id]);
      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Post no encontrado' });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('Lorang news DELETE error:', err);
      return res.status(500).json({ error: 'Error al eliminar el post' });
    }
  });

  return router;
}
