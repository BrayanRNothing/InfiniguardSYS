/**
 * Migración para agregar soporte de documentos sincronizados
 * Agrega columnas JSON para almacenar documentos e historial
 */
export async function migrarDocumentos(pool) {
    console.log('🔄 Iniciando migración de documentos (PostgreSQL)...');

    try {
        // Agregar columna para almacenar documentos (JSONB)
        try {
            await pool.query(`ALTER TABLE servicios ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]'`);
            console.log('✅ Columna "documentos" verificada/agregada');
        } catch (e) {
            console.error('Error al verificar/agregar columna documentos:', e.message);
        }

        // Agregar columna para almacenar historial (JSONB)
        try {
            await pool.query(`ALTER TABLE servicios ADD COLUMN IF NOT EXISTS historial JSONB DEFAULT '[]'`);
            console.log('✅ Columna "historial" verificada/agregada');
        } catch (e) {
            console.error('Error al verificar/agregar columna historial:', e.message);
        }

        // Inicializar columnas vacías para registros existentes
        const result = await pool.query(`
            UPDATE servicios 
            SET documentos = '[]'::jsonb, historial = '[]'::jsonb 
            WHERE documentos IS NULL OR historial IS NULL
        `);

        if (result.rowCount > 0) {
            console.log(`✅ ${result.rowCount} registros previos actualizados con valores por defecto`);
        }

        console.log('✅ Migración de documentos completada exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error en migración de documentos:', error.message);
        throw error;
    }
}

/**
 * Helpers para trabajar con documentos en PostgreSQL
 */
export const DocumentoHelpers = {
    /**
     * Obtener documentos de un servicio
     */
    async obtenerDocumentos(pool, servicioId) {
        const res = await pool.query('SELECT documentos FROM servicios WHERE id = $1', [servicioId]);
        const row = res.rows[0];

        if (!row) {
            throw new Error(`Servicio ${servicioId} no encontrado`);
        }

        return row.documentos || [];
    },

    /**
     * Agregar documento a un servicio
     */
    async agregarDocumento(pool, servicioId, documento) {
        const documentos = await this.obtenerDocumentos(pool, servicioId);
        documentos.push(documento);

        await pool.query('UPDATE servicios SET documentos = $1 WHERE id = $2', [JSON.stringify(documentos), servicioId]);

        return documentos;
    },

    /**
     * Obtener historial de un servicio
     */
    async obtenerHistorial(pool, servicioId) {
        const res = await pool.query('SELECT historial FROM servicios WHERE id = $1', [servicioId]);
        const row = res.rows[0];

        if (!row) {
            throw new Error(`Servicio ${servicioId} no encontrado`);
        }

        return row.historial || [];
    },

    /**
     * Agregar evento al historial
     */
    async agregarEvento(pool, servicioId, evento) {
        const historial = await this.obtenerHistorial(pool, servicioId);
        historial.push(evento);

        await pool.query('UPDATE servicios SET historial = $1 WHERE id = $2', [JSON.stringify(historial), servicioId]);

        return historial;
    },

    /**
     * Buscar documento por tipo y número
     */
    async buscarDocumento(pool, servicioId, tipo, numero = null) {
        const documentos = await this.obtenerDocumentos(pool, servicioId);

        if (numero) {
            return documentos.find(doc => doc.tipo === tipo && doc.numero === numero);
        }

        return documentos.filter(doc => doc.tipo === tipo);
    }
};

