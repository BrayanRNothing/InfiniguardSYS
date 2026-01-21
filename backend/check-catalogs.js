// Script para verificar y poblar catálogos DAE
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/infiniguard'
});

async function checkAndPopulateCatalogs() {
    try {
        // Verificar cuántos registros hay
        const count = await pool.query('SELECT COUNT(*) FROM dae_catalogs');
        console.log(`📊 Total de registros en dae_catalogs: ${count.rows[0].count}`);

        // Mostrar todos los registros
        const all = await pool.query('SELECT * FROM dae_catalogs ORDER BY categoria, valor');
        console.log('\n📋 Registros actuales:');
        all.rows.forEach(row => {
            console.log(`  - [${row.categoria}] ${row.valor}`);
        });

        // Si está vacío, poblar
        if (count.rows[0].count === '0') {
            console.log('\n⚠️  Base de datos vacía. Poblando con datos por defecto...');

            const defaultAreas = [
                'Limpieza y Entubado', 'Rolado', 'Expansión', 'Burst Test',
                'Leak Test', 'Hydro Test', 'Lavado', 'Pintura'
            ];
            const defaultDefects = [
                'Pieza Mal Ensamblada', 'Pieza Dañada', 'Sin Identificación', 'Laminado',
                'Fuga de Helio', 'Fuga de Agua', 'Fuga de Aire', 'Falta de Roscas'
            ];

            for (const area of defaultAreas) {
                await pool.query('INSERT INTO dae_catalogs (categoria, valor) VALUES ($1, $2)', ['area', area]);
            }
            for (const defect of defaultDefects) {
                await pool.query('INSERT INTO dae_catalogs (categoria, valor) VALUES ($1, $2)', ['defecto', defect]);
            }

            console.log('✅ Datos insertados correctamente');
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

checkAndPopulateCatalogs();
