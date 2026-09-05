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
  "piano": "Notas/indicações para piano: tonalidade, progressão\nde acordes, sugestões de acompanhamento, etc."
}
```

Notas:
- `category` pode ser qualquer texto — as categorias (separadores/tabs) são geradas automaticamente a partir dos valores usados no ficheiro. Sugestões típicas de uma Missa católica: `Entrada`, `Ato Penitencial`, `Glória`, `Salmo`, `Aclamação`, `Ofertório`, `Santo`, `Comunhão`, `Ação de Graças`, `Final`.
- Para alinhar acordes sobre a letra em `chords`, use espaços — a fonte é monoespaçada, por isso os espaços alinham corretamente.
- Não existe um editor de partitura musical real; `piano` é campo de texto livre (tonalidade, acordes, indicações). Se mais tarde quiser mostrar partitura em imagem, pode adicionar um campo `sheetImage` com o caminho para uma imagem e ajustar `app.js` para a mostrar.

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
