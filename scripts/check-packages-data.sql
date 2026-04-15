-- Check packages data to debug search issues
SELECT 
  cpf,
  nome,
  codigo_rastreio,
  valor,
  produto
FROM packages
LIMIT 20;
