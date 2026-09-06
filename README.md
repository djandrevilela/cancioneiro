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
- `category` pode ser qualquer texto — as categorias (separadores/tabs) são geradas automaticamente a partir dos valores usados no ficheiro. Sugestões típicas de uma Missa católica: `Entrada`, `Ato Penitencial`, `Glória`, `Salmo`, `Aclamação`, `Ofertório`, `Santo`, `Comunhão`, `Ação de Graças`, `Final`. Cada categoria mostra uma cor própria (fixa para estas 10; qualquer categoria nova que adicione recebe automaticamente uma cor estável, gerada a partir do nome).
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

## Testar localmente antes de publicar

Como a app carrega `songs.json` via `fetch`, abrir `index.html` diretamente a fazer duplo-clique (com `file://`) pode não funcionar em alguns navegadores por restrições de segurança. Para testar localmente, corra um pequeno servidor na pasta do projeto, por exemplo:

```bash
python3 -m http.server 8000
```

e depois abra `http://localhost:8000` no navegador. No GitHub Pages isto não é um problema, pois o site é sempre servido por http(s).
