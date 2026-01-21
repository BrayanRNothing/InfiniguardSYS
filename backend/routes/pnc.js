import express from 'express';

export function crearRutasPNC(pool) {
    const router = express.Router();

    // GET all reports
    router.get('/', async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM pnc_reports ORDER BY created_at DESC');
            res.json({ success: true, reports: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST create report
    router.post('/', async (req, res) => {
        const data = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO pnc_reports (id, folio, cliente, fecha, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [data.id || Date.now().toString(), data.folio, data.cliente, data.fecha, JSON.stringify(data)]
            );
            res.json({ success: true, report: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT update report
    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        const data = req.body;
        try {
            await pool.query(
                'UPDATE pnc_reports SET folio = $1, cliente = $2, fecha = $3, data = $4 WHERE id = $5',
                [data.folio, data.cliente, data.fecha, JSON.stringify(data), id]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE report
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM pnc_reports WHERE id = $1', [id]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
}

export default crearRutasPNC;
