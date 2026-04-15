# Documento de Requisitos

## Introdução

Este documento descreve os requisitos para o redesign completo da identidade visual do frontend do sistema de rastreamento de encomendas. O sistema atualmente utiliza a identidade visual da Jadlog (logo, nome, cores vermelhas). O objetivo é substituir completamente essa identidade pela marca **EnvioSeguroBR**, aplicando a nova logo, o novo nome e a paleta de cores verde escuro de forma consistente em todas as páginas e componentes do frontend.

O projeto é uma aplicação Next.js com Tailwind CSS e componentes shadcn/ui. As páginas afetadas incluem: página principal de rastreamento (`/`), página de pagamento (`/pagamento`), página de landing (`/landing`), painel administrativo (`/admin`) e página de login administrativo (`/admin/login`).

## Glossário

- **EnvioSeguroBR**: Nome da nova marca que substituirá "Jadlog" em todo o frontend.
- **EnvioBR-logo.png**: Arquivo de imagem da nova logo localizado em `public/EnvioBr-logo.png`.
- **Verde Escuro**: Cor primária da marca EnvioSeguroBR, representada pelo valor hexadecimal `#1a5c38` (verde escuro) e variações como `#14472c` (hover) e `#e8f5ee` (fundo claro).
- **Sistema**: A aplicação Next.js de rastreamento de encomendas.
- **Tracking_Page**: Componente `components/tracking-page.tsx`, responsável pela página principal de rastreamento.
- **Pagamento_Page**: Página `app/pagamento/page.tsx`, responsável pelo fluxo de pagamento PIX.
- **Landing_Page**: Página `app/landing/page.tsx`, responsável pela página de apresentação da marca.
- **Admin_Page**: Página `app/admin/page.tsx`, responsável pelo painel administrativo.
- **Login_Page**: Página `app/admin/login/page.tsx`, responsável pelo login administrativo.
- **Layout**: Arquivo `app/layout.tsx`, responsável pelos metadados globais da aplicação.
- **CSS_Global**: Arquivo `app/globals.css`, responsável pelas variáveis de cor e animações globais.

---

## Requisitos

### Requisito 1: Substituição da Logo

**User Story:** Como usuário do sistema, quero ver a logo da EnvioSeguroBR em todas as páginas, para que eu reconheça a marca corretamente.

#### Critérios de Aceitação

1. THE Tracking_Page SHALL exibir a imagem `/EnvioBr-logo.png` no cabeçalho, substituindo a referência a `/jadlog-logo.png`.
2. THE Pagamento_Page SHALL exibir a imagem `/EnvioBr-logo.png` como fallback no cabeçalho quando nenhuma `logo_url` estiver configurada nas settings, substituindo a URL externa da Jadlog.
3. THE Landing_Page SHALL exibir a imagem `/EnvioBr-logo.png` no cabeçalho, substituindo a URL externa da Jadlog.
4. WHEN a imagem da logo for renderizada, THE Sistema SHALL utilizar o atributo `alt` com o valor `"EnvioSeguroBR"` em todos os locais onde a logo for exibida.

---

### Requisito 2: Substituição do Nome da Marca

**User Story:** Como usuário do sistema, quero ver o nome "EnvioSeguroBR" em todos os textos e metadados, para que a identidade da marca seja consistente.

#### Critérios de Aceitação

1. THE Layout SHALL definir o `title` dos metadados da página como `"EnvioSeguroBR"`.
2. THE Layout SHALL definir o `description` dos metadados como `"EnvioSeguroBR - Sistema profissional de rastreamento de encomendas. Consulte o status da sua entrega com CPF."`.
3. THE Landing_Page SHALL substituir todas as ocorrências do texto `"Jadlog"` por `"EnvioSeguroBR"` nos textos visíveis ao usuário, incluindo títulos, parágrafos e links de navegação.
4. THE Tracking_Page SHALL substituir todas as ocorrências do texto `"Jadlog"` por `"EnvioSeguroBR"` nos textos visíveis ao usuário, incluindo o rodapé.
5. THE Pagamento_Page SHALL substituir todas as ocorrências do texto `"Jadlog"` por `"EnvioSeguroBR"` nos textos visíveis ao usuário, incluindo o rodapé (contato, copyright e links).
6. THE Landing_Page SHALL substituir o texto `"© Jadlog Logística S.A. 2025"` por `"© EnvioSeguroBR 2025"` no rodapé.
7. THE Tracking_Page SHALL substituir o texto `"© Jadlog Logística S.A. 2025"` por `"© EnvioSeguroBR 2025"` no rodapé.
8. THE Pagamento_Page SHALL substituir o texto `"© Jadlog Logística S.A. 2025"` por `"© EnvioSeguroBR 2025"` no rodapé.

---

### Requisito 3: Substituição da Cor Primária para Verde Escuro

**User Story:** Como usuário do sistema, quero ver a identidade visual em verde escuro da EnvioSeguroBR, para que a experiência visual seja coerente com a nova marca.

#### Critérios de Aceitação

1. THE CSS_Global SHALL definir a variável `--primary` com o valor correspondente ao verde escuro `#1a5c38` no formato oklch.
2. THE CSS_Global SHALL definir a variável `--correios-red` (renomeada semanticamente para cor primária da marca) com o valor correspondente ao verde escuro `#1a5c38`.
3. THE Tracking_Page SHALL substituir todas as classes de cor vermelha (`bg-[#C8302E]`, `bg-red-600`, `bg-red-700`, `hover:bg-red-700`, `hover:bg-[#A02624]`, `border-[#C8302E]`, `text-[#C8302E]`, `text-[#8B0000]`, `border-red-600`, `text-red-600`) pelas classes equivalentes em verde escuro (`bg-[#1a5c38]`, `bg-green-800`, `hover:bg-[#14472c]`, `border-[#1a5c38]`, `text-[#1a5c38]`, `text-green-900`, `border-green-700`, `text-green-700`).
4. THE Pagamento_Page SHALL substituir todas as classes de cor vermelha nos elementos de destaque, botões e rodapé pelas classes equivalentes em verde escuro.
5. THE Landing_Page SHALL substituir todas as classes de cor vermelha nos elementos de destaque, seções hero, botões e rodapé pelas classes equivalentes em verde escuro.
6. WHEN um spinner de carregamento for exibido, THE Sistema SHALL utilizar a cor verde escuro (`border-green-700` ou `text-green-700`) em vez de vermelho.
7. THE Tracking_Page SHALL substituir a animação `animate-red-pulse` por uma animação equivalente em verde escuro, ou remover a referência à animação nomeada com "red".
8. THE CSS_Global SHALL atualizar ou adicionar uma animação `green-pulse` equivalente à `red-pulse`, utilizando as cores `#1a5c38` e `#22c55e` (verde claro para o estado intermediário).

---

### Requisito 4: Consistência Visual em Todo o Frontend

**User Story:** Como usuário do sistema, quero que a identidade visual da EnvioSeguroBR seja aplicada de forma uniforme em todas as páginas, para que a experiência seja profissional e coerente.

#### Critérios de Aceitação

1. THE Landing_Page SHALL substituir o texto descritivo `"A Jadlog é líder em logística expressa no Brasil..."` por um texto equivalente referenciando a EnvioSeguroBR.
2. THE Landing_Page SHALL substituir o texto `"Por que escolher a Jadlog?"` por `"Por que escolher a EnvioSeguroBR?"`.
3. THE Pagamento_Page SHALL substituir o e-mail de contato `"jadlog@sac.com"` por `"contato@enviosegurobr.com"` no rodapé.
4. THE Pagamento_Page SHALL substituir o telefone `"0800-725-3564"` por um número de contato da EnvioSeguroBR ou remover o campo, mantendo a consistência da marca.
5. THE Pagamento_Page SHALL substituir o CNPJ `"04.884.082/0001-35"` e o endereço `"Rua Marechal Floriano, 1.119, Centro, Curitiba, PR"` por dados fictícios genéricos da EnvioSeguroBR ou remover esses campos do rodapé.
6. THE Tracking_Page SHALL substituir o e-mail `"jadlog@sac.com"` e o telefone `"0800-725-3564"` no rodapé por dados da EnvioSeguroBR.
7. WHERE o link `"Encontre uma Unidade Jadlog"` estiver presente, THE Landing_Page SHALL substituir o texto por `"Encontre um Ponto EnvioSeguroBR"`.
8. WHERE o link `"Encontre uma Unidade Jadlog"` estiver presente, THE Pagamento_Page SHALL substituir o texto por `"Encontre um Ponto EnvioSeguroBR"`.
9. THE Admin_Page SHALL manter sua funcionalidade atual sem alterações visuais de marca, pois é uma área interna não exposta ao usuário final.
10. THE Login_Page SHALL manter sua funcionalidade atual sem alterações visuais de marca, pois é uma área interna não exposta ao usuário final.
