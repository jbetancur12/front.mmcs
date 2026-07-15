# Versionado

## Frontend (`front.mmcs`)

```
cd front.mmcs
git status                                   # sin cambios pendientes
npm run version:patch                        # bump 1.5.5 → 1.5.6 (package.json + version.ts)
git add .
git commit -m "chore: bump v"
git tag v1.5.6
git push && git push --tags
```

## API (`api.mmcs`)

```
cd api.mmcs
git status                                   # sin cambios pendientes
# editar manualmente version en package.json
# luego:
npm install --package-lock-only               # sync package-lock.json
git add package.json package-lock.json
git commit -m "chore: bump v"
git push
```
