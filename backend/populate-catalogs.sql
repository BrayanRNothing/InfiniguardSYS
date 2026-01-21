-- Script SQL para poblar catálogos DAE
-- Ejecutar este script en tu base de datos PostgreSQL

-- Insertar Áreas
INSERT INTO dae_catalogs (categoria, valor) VALUES 
('area', 'Limpieza y Entubado'),
('area', 'Rolado'),
('area', 'Expansión'),
('area', 'Burst Test'),
('area', 'Leak Test'),
('area', 'Hydro Test'),
('area', 'Lavado'),
('area', 'Pintura')
ON CONFLICT (categoria, valor) DO NOTHING;

-- Insertar Defectos
INSERT INTO dae_catalogs (categoria, valor) VALUES 
('defecto', 'Pieza Mal Ensamblada'),
('defecto', 'Pieza Dañada'),
('defecto', 'Sin Identificación'),
('defecto', 'Laminado'),
('defecto', 'Fuga de Helio'),
('defecto', 'Fuga de Agua'),
('defecto', 'Fuga de Aire'),
('defecto', 'Falta de Roscas'),
('defecto', 'Enterrones con Diodo'),
('defecto', 'Roscas Dañadas'),
('defecto', 'Grietas'),
('defecto', 'Mal Corte'),
('defecto', 'Mal Identificada'),
('defecto', 'Planicidad'),
('defecto', 'Tubo de Cobre Dañado'),
('defecto', 'Mala Nivelación'),
('defecto', 'Inclusiones'),
('defecto', 'Falta de Fusión'),
('defecto', 'Falta de Penetración'),
('defecto', 'Porosidad'),
('defecto', 'Garganta Insuficiente'),
('defecto', 'Pierna Insuficiente'),
('defecto', 'Corte Biselado'),
('defecto', 'Pintura Mal Aplicada'),
('defecto', 'Oxidación'),
('defecto', 'Poros'),
('defecto', 'Socavados'),
('defecto', 'Falta de Limpieza'),
('defecto', 'Falta de Soldadura'),
('defecto', 'Falta de Remates'),
('defecto', 'Medida Fuera de Especificación'),
('defecto', 'Falta de Componentes'),
('defecto', 'Solape'),
('defecto', 'Mala Expansión'),
('defecto', 'Dobles Invertido')
ON CONFLICT (categoria, valor) DO NOTHING;

SELECT 'Catálogos insertados correctamente' AS resultado;
