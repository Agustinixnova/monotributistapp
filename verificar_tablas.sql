-- Listar todas las tablas en schema public
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Contar tablas
SELECT COUNT(*) as total_tablas
FROM pg_tables
WHERE schemaname = 'public';
