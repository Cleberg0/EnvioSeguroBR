# Plano de Implementação: Rebrand EnvioSeguroBR

## Visão Geral

Substituição cirúrgica de identidade visual em 5 arquivos do frontend: variáveis CSS globais, metadados do layout, componente de rastreamento, página de pagamento e página de landing. Nenhuma lógica de negócio, API ou banco de dados é alterada. Páginas admin e login ficam intocadas.

## Tarefas

- [x] 1. Atualizar `app/globals.css` — variáveis de cor e animação
  - Substituir o valor da variável `--primary` pelo equivalente oklch de `#1a5c38` (`oklch(0.33 0.10 155)`)
  - Substituir o valor da variável `--correios-red` pelo equivalente oklch de `#1a5c38`
  - Renomear a keyframe `red-pulse` para `green-pulse`, substituindo as cores internas por `#1a5c38` (base) e `#22c55e` (estado intermediário)
  - Atualizar o comentário do bloco `:root` de "Red and white" para "Green and white"
  - _Requirements: 3.1, 3.2, 3.8_

- [x] 2. Atualizar `app/layout.tsx` — metadados globais
  - Definir `metadata.title` como `"EnvioSeguroBR"`
  - Definir `metadata.description` como `"EnvioSeguroBR - Sistema profissional de rastreamento de encomendas. Consulte o status da sua entrega com CPF."`
  - _Requirements: 2.1, 2.2_

- [x] 3. Atualizar `components/tracking-page.tsx` — logo, cores e textos
  - [x] 3.1 Substituir referências de logo e alt text
    - Trocar `src="/jadlog-logo.png"` por `src="/EnvioBr-logo.png"`
    - Trocar `alt="Jadlog"` por `alt="EnvioSeguroBR"` em todos os elementos `<img>` de logo
    - _Requirements: 1.1, 1.4_

  - [x] 3.2 Substituir classes de cor vermelha por equivalentes verdes
    - `bg-[#C8302E]` → `bg-[#1a5c38]`
    - `bg-red-600` → `bg-green-800`
    - `bg-red-700` → `bg-[#14472c]`
    - `hover:bg-red-700` → `hover:bg-[#14472c]`
    - `hover:bg-[#A02624]` → `hover:bg-[#14472c]`
    - `border-[#C8302E]` → `border-[#1a5c38]`
    - `text-[#C8302E]` → `text-[#1a5c38]`
    - `text-[#8B0000]` → `text-green-900`
    - `border-red-600` → `border-green-700`
    - `text-red-600` → `text-green-700`
    - Spinners de carregamento: `border-red-*` / `text-red-*` → `border-green-700` / `text-green-700`
    - _Requirements: 3.3, 3.6_

  - [x] 3.3 Substituir referência à animação e textos da marca
    - `animate-red-pulse` → `animate-green-pulse`
    - Substituir todas as ocorrências de `"Jadlog"` em textos visíveis por `"EnvioSeguroBR"`
    - Substituir e-mail `"jadlog@sac.com"` por `"contato@enviosegurobr.com"` no rodapé
    - Substituir telefone `"0800-725-3564"` por dado da EnvioSeguroBR ou remover o campo
    - Substituir `"© Jadlog Logística S.A. 2025"` por `"© EnvioSeguroBR 2025"`
    - _Requirements: 2.4, 2.7, 3.7, 4.6_

  - [ ]* 3.4 Escrever teste de propriedade — ausência de texto "Jadlog" (Property 1)
    - **Property 1: Ausência de texto "Jadlog" em páginas públicas**
    - Usar fast-check + @testing-library/react para renderizar TrackingPage com combinações de estado (com/sem pacote, com/sem logo_url)
    - Verificar que nenhum texto visível no DOM contém a string `"Jadlog"`
    - `numRuns: 100`
    - **Validates: Requirements 2.4, 2.7**

  - [ ]* 3.5 Escrever teste de propriedade — ausência de classes vermelhas (Property 2)
    - **Property 2: Ausência de classes de cor vermelha da marca antiga**
    - Renderizar TrackingPage com fast-check e verificar que nenhum elemento do DOM contém as classes CSS da marca antiga
    - **Validates: Requirements 3.3, 3.6**

  - [ ]* 3.6 Escrever teste de propriedade — alt text da logo (Property 3)
    - **Property 3: Atributo alt da logo é sempre "EnvioSeguroBR"**
    - Renderizar TrackingPage e verificar que todos os `<img>` de logo têm `alt="EnvioSeguroBR"`
    - **Validates: Requirements 1.4**

  - [ ]* 3.7 Escrever teste de propriedade — ausência de src da logo antiga (Property 4)
    - **Property 4: Ausência de referências à logo antiga**
    - Renderizar TrackingPage e verificar que nenhum `<img>` aponta para `/jadlog-logo.png` ou domínio `jadlog.com.br`
    - **Validates: Requirements 1.1**

- [x] 4. Checkpoint — verificar tracking-page
  - Garantir que todos os testes passam e que a página de rastreamento renderiza corretamente com a nova identidade visual. Perguntar ao usuário se há dúvidas antes de continuar.

- [x] 5. Atualizar `app/pagamento/page.tsx` — logo, cores e textos
  - [x] 5.1 Substituir referência de logo fallback e alt text
    - Trocar a URL externa da Jadlog pelo caminho local `/EnvioBr-logo.png` no fallback do cabeçalho
    - Definir `alt="EnvioSeguroBR"` no elemento `<img>` da logo
    - _Requirements: 1.2, 1.4_

  - [x] 5.2 Substituir classes de cor vermelha por equivalentes verdes
    - Aplicar o mesmo mapeamento de cores da tarefa 3.2 em todos os elementos de destaque, botões e rodapé
    - _Requirements: 3.4_

  - [x] 5.3 Atualizar textos e dados de contato no rodapé
    - Substituir todas as ocorrências de `"Jadlog"` por `"EnvioSeguroBR"` nos textos visíveis
    - Substituir e-mail `"jadlog@sac.com"` por `"contato@enviosegurobr.com"`
    - Remover ou substituir telefone `"0800-725-3564"` por dado genérico da EnvioSeguroBR
    - Remover ou substituir CNPJ `"04.884.082/0001-35"` e endereço `"Rua Marechal Floriano, 1.119, Centro, Curitiba, PR"` por dados fictícios genéricos
    - Substituir link `"Encontre uma Unidade Jadlog"` por `"Encontre um Ponto EnvioSeguroBR"`
    - Substituir `"© Jadlog Logística S.A. 2025"` por `"© EnvioSeguroBR 2025"`
    - _Requirements: 2.5, 2.8, 4.3, 4.4, 4.5, 4.8_

  - [ ]* 5.4 Escrever teste de propriedade — ausência de texto "Jadlog" (Property 1)
    - **Property 1: Ausência de texto "Jadlog" em páginas públicas**
    - Renderizar PagamentoPage com fast-check (com/sem logo_url, com/sem dados de pacote)
    - Verificar que nenhum texto visível contém `"Jadlog"`
    - **Validates: Requirements 2.5, 2.8**

  - [ ]* 5.5 Escrever teste de propriedade — ausência de classes vermelhas (Property 2)
    - **Property 2: Ausência de classes de cor vermelha da marca antiga**
    - Renderizar PagamentoPage e verificar ausência das classes CSS da marca antiga
    - **Validates: Requirements 3.4**

  - [ ]* 5.6 Escrever teste de propriedade — alt text e src da logo (Properties 3 e 4)
    - **Property 3: alt text da logo é "EnvioSeguroBR"**
    - **Property 4: Ausência de src da logo antiga**
    - Renderizar PagamentoPage e verificar ambas as propriedades
    - **Validates: Requirements 1.2, 1.4**

- [x] 6. Atualizar `app/landing/page.tsx` — logo, cores e textos
  - [x] 6.1 Substituir referência de logo e alt text
    - Trocar a URL externa da Jadlog pelo caminho local `/EnvioBr-logo.png`
    - Definir `alt="EnvioSeguroBR"` no elemento `<img>` da logo
    - _Requirements: 1.3, 1.4_

  - [x] 6.2 Substituir classes de cor vermelha por equivalentes verdes
    - Aplicar o mesmo mapeamento de cores da tarefa 3.2 em seções hero, botões, destaques e rodapé
    - _Requirements: 3.5_

  - [x] 6.3 Atualizar todos os textos da marca
    - Substituir todas as ocorrências de `"Jadlog"` por `"EnvioSeguroBR"` nos textos visíveis (títulos, parágrafos, links de navegação)
    - Substituir `"Por que escolher a Jadlog?"` por `"Por que escolher a EnvioSeguroBR?"`
    - Substituir o texto descritivo `"A Jadlog é líder em logística expressa no Brasil..."` por texto equivalente referenciando a EnvioSeguroBR
    - Substituir link `"Encontre uma Unidade Jadlog"` por `"Encontre um Ponto EnvioSeguroBR"`
    - Substituir `"© Jadlog Logística S.A. 2025"` por `"© EnvioSeguroBR 2025"`
    - _Requirements: 2.3, 2.6, 4.1, 4.2, 4.7_

  - [ ]* 6.4 Escrever teste de propriedade — ausência de texto "Jadlog" (Property 1)
    - **Property 1: Ausência de texto "Jadlog" em páginas públicas**
    - Renderizar LandingPage com fast-check e verificar ausência de `"Jadlog"` em todos os textos visíveis
    - **Validates: Requirements 2.3, 2.6, 4.1, 4.2**

  - [ ]* 6.5 Escrever teste de propriedade — ausência de classes vermelhas (Property 2)
    - **Property 2: Ausência de classes de cor vermelha da marca antiga**
    - Renderizar LandingPage e verificar ausência das classes CSS da marca antiga
    - **Validates: Requirements 3.5**

  - [ ]* 6.6 Escrever teste de propriedade — alt text e src da logo (Properties 3 e 4)
    - **Property 3: alt text da logo é "EnvioSeguroBR"**
    - **Property 4: Ausência de src da logo antiga**
    - Renderizar LandingPage e verificar ambas as propriedades
    - **Validates: Requirements 1.3, 1.4**

- [x] 7. Checkpoint final — garantir que todos os testes passam
  - Garantir que todos os testes passam e que nenhuma página pública contém referências à marca Jadlog. Perguntar ao usuário se há dúvidas antes de concluir.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- As páginas `app/admin/page.tsx` e `app/admin/login/page.tsx` **não devem ser modificadas** (Requirements 4.9, 4.10)
- O arquivo `/EnvioBr-logo.png` já existe em `public/` — atenção ao case-sensitive em produção Linux
- Classes Tailwind com valores arbitrários (ex: `bg-[#1a5c38]`) devem aparecer literalmente no código-fonte para serem incluídas no bundle CSS
- Testes de propriedade usam **fast-check** + **@testing-library/react** com `numRuns: 100`
