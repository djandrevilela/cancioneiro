# Cancioneiro do Coro

Webapp simples (HTML + CSS + JS puro, sem frameworks) para consultar o repertório de um coro paroquial: título, autoria, acordes de guitarra e notas de piano, organizados por categoria litúrgica.

## Ficheiros

- `index.html` — estrutura da página
- `style.css` — estilo (mobile-first)
- `app.js` — lógica (pesquisa, filtros, navegação)
- `songs.json` — **o repositório de músicas**. É aqui que edita o repertório.

## Como adicionar/editar músicas

Abra `songs.json` e edite o array `songs`. Cada música tem esta forma:

```json
{
  "id": "identificador-unico-sem-espacos",
  "title": "Título da Música",
  "author": "Autor ou 'Trad. popular'",
  "category": "Entrada",
  "lyrics": "Letra da música,\ncom quebras de linha assim.",
  "chords": "Acordes de guitarra, normalmente com as\nletras dos acordes (D, G, A...) alinhadas acima do texto,\nusando espaços para alinhar (fonte usada é monoespaçada).",
  "piano": "X:1\nT:Título\nM:4/4\nL:1/4\nK:C\n\"C\" C2 E2 | \"G\" G2 E2 | \"F\" F2 E2 | \"C\" C4 |]"
}
```

Notas:
- Uma música pode ter **mais do que uma categoria**. Use `"categories": ["Comunhão", "Ação de Graças"]` (array) em vez de `"category"`. O formato antigo com `"category": "Entrada"` (uma só, em texto) continua a funcionar na mesma — pode ir convertendo aos poucos, ou nem converter, se não precisar de mais do que uma categoria por música. Quando uma música tem várias categorias, aparece nas tabs de todas elas e mostra todas as etiquetas na lista e no ecrã da música.
- O botão **"Ouvir"** no ecrã de cada música usa o campo `listenUrl` (link direto para o áudio — YouTube, Spotify, ficheiro mp3, etc.). Se `listenUrl` estiver vazio, usa `sourceUrl` como alternativa (por exemplo, a página do MusiCristo, que normalmente já tem o áudio incorporado). Se nenhum dos dois existir, o botão não aparece.
- O campo `sourceNote` é só uma nota de texto (não um link) que diz de onde veio a música — por exemplo, de que PDF e com que número — para saberes onde ir buscar a letra e os acordes quando ainda não os copiaste para o `songs.json`.
- `category`/`categories` pode ser qualquer texto — as categorias (separadores/tabs) são geradas automaticamente a partir dos valores usados no ficheiro. Sugestões típicas de uma Missa católica: `Entrada`, `Ato Penitencial`, `Glória`, `Salmo`, `Aclamação`, `Ofertório`, `Santo`, `Comunhão`, `Ação de Graças`, `Final`. Cada categoria mostra uma cor própria (fixa para estas 10; qualquer categoria nova que adicione recebe automaticamente uma cor estável, gerada a partir do nome).
- Para alinhar acordes sobre a letra em `chords`, use espaços — a fonte é monoespaçada, por isso os espaços alinham corretamente.

### O separador "Piano" mostra partitura real

O campo `piano` deve conter notação **ABC** (um formato de texto simples para música, que a app desenha como partitura de verdade — pauta, claves, notas — usando a biblioteca [abcjs](https://abcnotation.com/)). Estrutura mínima:

```
X:1                    ← número da melodia (deixe sempre "X:1")
T:Título da música     ← opcional, aparece por cima da pauta
M:4/4                  ← compasso
L:1/4                  ← duração de referência (aqui, semínima)
Q:1/4=90               ← opcional, andamento (metrónomo)
K:D                    ← tonalidade (D, G, C, Am, Em, F, Bb...)
"D" D2 F2 | "G" A2 F2 | "A" G2 B2 | "D" A4 |]
```

- Cada letra (`C D E F G A B`) é uma nota; minúsculas (`c d e...`) soam uma oitava acima.
- Um número a seguir à nota multiplica a duração (com `L:1/4`, `D2` = mínima, `D4` = semibreve). **Cada compasso, entre barras `|`, tem de somar ao valor do compasso** (em 4/4, soma 4).
- Texto entre aspas antes de uma nota, como `"G"`, é o acorde escrito por cima da pauta — útil para quem acompanha à vista.
- A barra final é `|]`.

Pode escrever e testar notação ABC diretamente, sem instalar nada, em [abcjs editor](https://editor.drawthedots.com/) ou em [abcjs.net/examples](https://abcjs.net/) antes de colar no `songs.json`. Se preferir não escrever ABC à mão, pode descrever a melodia a uma IA (incluindo esta) e pedir para a converter em notação ABC.

Se um ficheiro `piano` estiver vazio ou a internet estiver em baixo (a partitura precisa da biblioteca `abcjs`, carregada por CDN), a app mostra uma mensagem em vez de bloquear a página.

## Publicar gratuitamente no GitHub Pages

1. Crie um repositório novo no GitHub (público, para o plano gratuito).
2. Faça upload destes 4 ficheiros (`index.html`, `style.css`, `app.js`, `songs.json`) para a raiz do repositório (pode arrastar os ficheiros na interface web do GitHub, em "Add file → Upload files").
3. No repositório, vá a **Settings → Pages**.
4. Em "Build and deployment", escolha **Source: Deploy from a branch**, branch **main**, pasta **/(root)**, e clique **Save**.
5. Ao fim de um a dois minutos, o GitHub mostra o link público, algo como:
   `https://SEU-UTILIZADOR.github.io/NOME-DO-REPOSITORIO/`

A partir daí, sempre que editar `songs.json` (ou qualquer outro ficheiro) diretamente no GitHub e guardar (commit), o site atualiza automaticamente em cerca de um minuto.

## Instalar como app (Android, iOS, PC) e uso offline

A partir de agora este é um PWA (Progressive Web App) instalável:

- **Android / Chrome / Edge (PC)**: aparece um botão **"Instalar"** no cabeçalho assim que o navegador achar que a app está pronta para instalar (tem de estar em `https://`, o que o GitHub Pages já garante). Ao tocar, abre o diálogo nativo de instalação — depois disso fica um ícone próprio no ecrã principal / lista de aplicações, sem barra de endereço.
- **iOS (Safari)**: a Apple não permite que nenhum site dispare a instalação sozinho — é uma limitação do iOS, não desta app. Por isso, no Safari o botão "Instalar" mostra antes um pequeno guia com os 2 passos: tocar em **Partilhar** e depois **"Adicionar ao Ecrã Principal"**. Feito isso, fica igual a uma app instalada (ícone próprio, sem barra do Safari, funciona offline).
- **Funciona sem internet**: um *service worker* (`sw.js`) guarda em cache os ficheiros da app (HTML/CSS/JS, tipografia, ícones) na primeira visita, por isso depois disso a app abre e funciona mesmo sem rede.
- **Dados em cache 7 dias**: o `songs.json` é guardado no telemóvel/PC (`localStorage`) com data. Enquanto tiver menos de 7 dias, a app usa logo essa cópia local (mais rápido, funciona offline) e só depois tenta atualizar em segundo plano se houver internet. Passados 7 dias, tenta ir buscar uma versão fresca da próxima vez que houver ligação; se não houver internet nenhuma, continua a mostrar os dados antigos em vez de ficar vazia.

**Ficheiros novos para publicar no GitHub Pages** (juntar aos anteriores, na raiz do repositório):
- `manifest.json` — descreve a app (nome, cores, ícones) para poder ser instalada
- `sw.js` — o service worker que trata do offline
- pasta `icons/` com `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` e `apple-touch-icon.png`

Nota: se editares o `index.html`, `style.css` ou `app.js` no futuro, muda o texto `CACHE_VERSION` no topo do `sw.js` (ex. de `"v1"` para `"v2"`) — isso força o service worker a substituir a cópia antiga em cache pela nova, em vez de continuar a servir a versão desatualizada aos utilizadores que já tinham a app aberta.

## Editor (criar/editar músicas, gravar direto no GitHub)

Há agora uma página `editor.html`, acessível a partir de um link discreto ("Gerir repositório") no fundo da lista principal. Serve para criar músicas novas e editar as existentes sem mexer manualmente no `songs.json`.

**Como ligar ao GitHub:**
1. No topo do editor, abre o painel "Ligar ao GitHub".
2. Cria um *personal access token* em github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens. Escolhe: só este repositório, e permissão **Contents: Read and write**. Não precisas de mais nenhuma permissão.
3. Preenche repositório (`dono/nome`), ramo (normalmente `main`), caminho (`songs.json`) e cola o token.
4. "Ligar e carregar songs.json" — a lista de músicas aparece à esquerda.

O token fica guardado só neste navegador (`localStorage`), nunca é enviado para mais lado nenhum além da API do GitHub. Ainda assim, mantém o alcance do token limitado a este repositório, e usa "Esquecer dados guardados" se estiveres num computador partilhado.

**Criar ou editar:**
- "+ Nova" limpa o formulário; clicar numa música da lista carrega-a para editar.
- Preenche título, autor, categorias (separadas por vírgula), letra, acordes e, se quiseres, o link para ouvir.
- **Piano**: em vez de escreveres ABC à mão, escreve as notas com nomes portugueses (Dó Ré Mi Fá Sol Lá Si) — maiúscula para a oitava normal, minúscula para uma oitava acima, `#`/`b` para alterações, números para duração, acordes entre aspas — exatamente como já fazes nos acordes de guitarra. Indica a tonalidade (ex: "Ré", "Sol", "Lá menor") e o compasso, carrega em "Converter para ABC" e depois em "Atualizar pré-visualização" para ver a partitura desenhada. O resultado fica editável na caixa ABC por baixo, caso precises de afinar algo à mão.
- "Publicar no GitHub" grava tudo direto no repositório (faz um commit). "Guardar rascunho local" e "Descarregar songs.json" são redes de segurança caso não queiras publicar já, ou o GitHub esteja indisponível.

## Testar localmente antes de publicar

Como a app carrega `songs.json` via `fetch`, abrir `index.html` diretamente a fazer duplo-clique (com `file://`) pode não funcionar em alguns navegadores por restrições de segurança. Para testar localmente, corra um pequeno servidor na pasta do projeto, por exemplo:

```bash
python3 -m http.server 8000
```

e depois abra `http://localhost:8000` no navegador. No GitHub Pages isto não é um problema, pois o site é sempre servido por http(s).
