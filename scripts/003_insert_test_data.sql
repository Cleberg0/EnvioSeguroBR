-- Insert test data for CPF: 799.814.270-30
INSERT INTO public.packages (
  cpf,
  nome,
  telefone,
  endereco,
  produto,
  codigo_rastreio,
  remessa,
  status,
  pedido_postado,
  pedido_em_rota,
  pedido_taxado,
  pedido_entregue
) VALUES (
  '79981427030',
  'Solange da Silva',
  '71998142703',
  'Rua Quinze Tornera Dourados MS 88001494805563',
  'teste',
  'BR123456789BR',
  '88001494805563',
  'Pedido Em Rota',
  true,
  true,
  false,
  false
) ON CONFLICT (codigo_rastreio) DO UPDATE SET
  cpf = EXCLUDED.cpf,
  nome = EXCLUDED.nome,
  telefone = EXCLUDED.telefone,
  endereco = EXCLUDED.endereco,
  produto = EXCLUDED.produto,
  remessa = EXCLUDED.remessa,
  status = EXCLUDED.status,
  pedido_postado = EXCLUDED.pedido_postado,
  pedido_em_rota = EXCLUDED.pedido_em_rota,
  pedido_taxado = EXCLUDED.pedido_taxado,
  pedido_entregue = EXCLUDED.pedido_entregue;
