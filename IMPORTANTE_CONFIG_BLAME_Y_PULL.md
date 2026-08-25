# ⚠️ IMPORTANTE — Acción requerida una vez por desarrollador

**Fecha:** 2026-08-25
**Repos afectados:** `api.mmcs` y `front.mmcs`

## ¿Qué pasó?

Se estandarizaron los saltos de línea (CRLF → LF) en ambos repos.
Fue un commit masivo (~600 archivos) que **cambia solo whitespace, no lógica**:

- `api.mmcs`: commit `a065314`
- `front.mmcs`: commit `d96f861`

`git blame` apuntaría todas las líneas a esos commits, perdiendo el autor real.
El archivo `.git-blame-ignore-revs` (ya commiteado en cada repo) le dice a git
que los ignore.

## ✅ Qué hacer (una sola vez, ~10 segundos)

En tu máquina, dentro de cada repo:

```bash
cd api.mmcs
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

```bash
cd front.mmcs
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

Sin esto, `git blame` te va a mostrar el commit de normalización como autor de
casi todas las líneas.

Con GitHub/GitLab web no hace falta nada: respetan `.git-blame-ignore-revs`
automáticamente si existe en el repo.

## 🧹 Antes de hacer `pull`

Cuando recibas estos commits, hazlo **sin cambios locales pendientes**
(`git status` debe estar limpio). Si tienes trabajo a medias:

```bash
git stash
git pull
git stash pop
```

Si no, verás ~600 archivos como modificados y el pull puede fallar.

## Referencia

- `.gitattributes` (nuevo): fuerza LF en todos los archivos; excepción `*.bat`/`*.cmd`.
- `.editorconfig` (nuevo): editores respetan LF automáticamente.
- `front.mmcs`: además se corrigieron los hooks de husky (tenían CRLF y crasheaban)
  y se agregó `endOfLine: 'lf'` a `.prettierrc.yml`.
