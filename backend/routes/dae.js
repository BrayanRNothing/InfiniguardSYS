import express from 'express';

export function crearRutasDAE(pool) {
    const router = express.Router();

    // --- USERS ---
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            const result = await pool.query('SELECT * FROM dae_users WHERE email = $1 AND password = $2', [email, password]);
            if (result.rows.length > 0) {
                res.json({ success: true, user: result.rows[0] });
            } else {
                res.status(401).json({ success: false, message: 'Credenciales inválidas para DAE' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.get('/users', async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT id, nombre, email, rol FROM dae_users');
            res.json({ success: true, users: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.post('/users', async (req, res) => {
        const { nombre, email, password, rol } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO dae_users (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
                [nombre, email, password, rol || 'usuario']
            );
            res.json({ success: true, user: result.rows[0] });
        } catch (error) {
            if (error.code === '23505') {
                res.status(400).json({ success: false, message: 'El usuario ya existe' });
            } else {
                res.status(500).json({ success: false, message: error.message });
            }
        }
    });

    // --- CATALOGS ---
    router.get('/catalogs', async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM dae_catalogs ORDER BY categoria, valor');
            res.json({ success: true, catalogs: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.post('/catalogs', async (req, res) => {
        const { categoria, valor } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO dae_catalogs (categoria, valor) VALUES ($1, $2) ON CONFLICT (categoria, valor) DO UPDATE SET valor = EXCLUDED.valor RETURNING *',
                [categoria, valor]
            );
            res.json({ success: true, catalog: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.delete('/catalogs/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM dae_catalogs WHERE id = $1', [id]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Force populate catalogs (for debugging)
    router.post('/catalogs/populate', async (req, res) => {
        try {
            const defaultAreas = [
                'Limpieza y Entubado', 'Rolado', 'Expansión', 'Burst Test',
                'Leak Test', 'Hydro Test', 'Lavado', 'Pintura'
            ];
            const defaultDefects = [
                'Pieza Mal Ensamblada', 'Pieza Dañada', 'Sin Identificación', 'Laminado',
                'Fuga de Helio', 'Fuga de Agua', 'Fuga de Aire', 'Falta de Roscas',
                'Enterrones con Diodo', 'Roscas Dañadas', 'Grietas', 'Mal Corte',
                'Mal Identificada', 'Planicidad', 'Tubo de Cobre Dañado', 'Mala Nivelación',
                'Inclusiones', 'Falta de Fusión', 'Falta de Penetración', 'Porosidad',
                'Garganta Insuficiente', 'Pierna Insuficiente', 'Corte Biselado',
                'Pintura Mal Aplicada', 'Oxidación', 'Poros', 'Socavados', 'Falta de Limpieza',
                'Falta de Soldadura', 'Falta de Remates', 'Medida Fuera de Especificación',
                'Falta de Componentes', 'Solape', 'Mala Expansión', 'Dobles Invertido'
            ];

            let inserted = 0;
            for (const area of defaultAreas) {
                const result = await pool.query(
                    'INSERT INTO dae_catalogs (categoria, valor) VALUES ($1, $2) ON CONFLICT (categoria, valor) DO NOTHING',
                    ['area', area]
                );
                if (result.rowCount > 0) inserted++;
            }
            for (const defect of defaultDefects) {
                const result = await pool.query(
                    'INSERT INTO dae_catalogs (categoria, valor) VALUES ($1, $2) ON CONFLICT (categoria, valor) DO NOTHING',
                    ['defecto', defect]
                );
                if (result.rowCount > 0) inserted++;
            }

            res.json({ success: true, message: `${inserted} catálogos insertados`, total: defaultAreas.length + defaultDefects.length });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
}

export default crearRutasDAE;
