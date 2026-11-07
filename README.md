# Inclui+

CitizenTech de acessibilidade: nota separada por necessidade (mobilidade, visão, audição e cognição), fotos como evidência e um assistente em linguagem natural.

Projeto da Global Solution FIAP 2026.2. **Os locais, as notas e os descontos são fictícios.**

O site é **estático**: HTML, CSS e JavaScript puro (módulos ES nativos do navegador), sem framework, sem build e sem dependências. A pasta `site/` é exatamente o que vai para o ar.

## Como rodar

Requisito: Node.js 22 ou mais recente (só para o servidor local e os testes; o site em si não usa Node).

```bash
npm start
```

Abra http://localhost:5173. Não precisa de `npm install`.

| Comando | O que faz |
|---|---|
| `npm start` | Servidor local da pasta `site/` (`scripts/serve.mjs`) |
| `npm test` | Testes unitários da lógica, com o test runner nativo do Node |

> Abrir o `index.html` direto do disco (`file://`) não funciona: o navegador bloqueia módulos ES fora de um servidor. Use `npm start` ou qualquer servidor estático (`python -m http.server -d site`, por exemplo).

## Estrutura

```
site/                       ← tudo o que é publicado
  index.html                Início
  mapa.html                 Mapa com lista, filtros e cartão de detalhes
  sobre.html                Sobre, comparação e próximos passos
  direitos.html             Direitos da pessoa com deficiência
  empresas.html             Para empresas, simulador de nota e planos
  entrar.html · cadastro.html · perfil.html
  404.html                  Página de erro (usada pelo S3 e por qualquer servidor)
  favicon.svg
  assets/
    css/style.css           Todos os estilos e tokens de cor
    fonts/                  Inter e Plus Jakarta Sans (woff2, locais)
    vendor/leaflet/         Leaflet 1.9.4 (mapa), copiado para não depender de CDN
    js/
      boot.js               Aplica as preferências de acessibilidade antes da página aparecer
      data/                 Lógica pura, sem DOM: nota, busca, filtros, assistente, contas
      ui/                   Layout comum, ícones, componentes e formulários
      pages/                Um módulo por página
tests/                      Testes da pasta site/assets/js/data
scripts/serve.mjs           Servidor de desenvolvimento
```

Cada página HTML carrega `boot.js`, o CSS e o seu módulo em `assets/js/pages/`. O módulo importa `ui/layout.js`, que monta cabeçalho, rodapé, menu de acessibilidade e assistente.

O HTML gerado pelo JavaScript passa pela função `html` de `ui/dom.js`, que escapa tudo o que vem de fora (nome, relatos, mensagens do assistente).

## O que é real e o que é demonstração

| Parte | Situação no MVP |
|---|---|
| Nota por necessidade | Funciona. Fórmula aberta em `site/assets/js/data/score.js`, aplicada a dados fictícios |
| Assistente | Funciona com regras e palavras-chave no navegador (`site/assets/js/data/concierge.js`). Não usa modelo de linguagem |
| Verificação de fotos por IA | Ainda não existe. A nota só conta a quantidade de fotos, que também é fictícia |
| Contas | Ficam no `localStorage` do navegador, sem backend. A senha é guardada como hash PBKDF2 com salt |
| Busca, filtros, horário e distância | Funcionam de verdade sobre os dados fictícios. "Perto de mim" usa a localização do navegador, sem enviá-la a nenhum servidor |
| Leitura em voz alta | Funciona com a voz do próprio navegador (Web Speech API) |
| Locais salvos e relatos | Ficam só neste navegador. Os relatos não chegam a outras pessoas nem alteram a nota |

## Observações para o deploy

- **Basta copiar a pasta `site/`** para o servidor ou bucket. Por exemplo: `aws s3 sync site/ s3://NOME-DO-BUCKET --delete`.
- No S3, configure `index.html` como documento de índice e `404.html` como documento de erro.
- **É preciso HTTPS.** O login usa `crypto.subtle`, que o navegador só libera em HTTPS ou em localhost. O endpoint de site estático do S3 é só HTTP: coloque o CloudFront (ou outro serviço com HTTPS) na frente. **Em HTTP puro, login e cadastro não funcionam**; o resto do site funciona.
- Cada rota é um arquivo `.html` próprio, com links relativos. Não há regra de reescrita para configurar.
- Nada é carregado de CDN. As únicas requisições externas são os blocos do mapa, de `tile.openstreetmap.org`, sem chave de API. Uma política de CSP precisa liberar esse domínio em `img-src`. A [política de uso](https://operations.osmfoundation.org/policies/tiles/) serve para o volume de uma demonstração; para produção real, é preciso contratar um provedor de mapas.
- Se for usar CSP: todo script é arquivo externo (`script-src 'self'` basta), mas alguns elementos usam `style` inline (largura das barras de nota, por exemplo), então `style-src` precisa de `'unsafe-inline'`.

## Licenças de terceiros

- [Leaflet](https://leafletjs.com) (BSD-2), em `site/assets/vendor/leaflet/`
- Ícones do [Lucide](https://lucide.dev) (ISC), em `site/assets/js/ui/icon-data.js`
- Fontes Inter e Plus Jakarta Sans (SIL Open Font License), em `site/assets/fonts/`
