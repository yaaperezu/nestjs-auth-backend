---
description: Realiza un commit semantico agrupando los cambios por tipo con push automatico
---

$ARGUMENTS

## Contexto del usuario (argumento opcional)

El texto inyectado arriba es contexto opcional para guiar el mensaje. Si esta vacio, basate solo en el analisis del diff. Si tiene contenido, usalo para precisar tipo, scope y descripcion.

## Ejecucion rapida

Sigue estos pasos en orden. No te detengas a explicar cada paso al usuario; ejecuta y reporta al final.

### Paso 1: Sincronizar con remoto

1. Ejecuta en paralelo: `git status` y `git branch --show-current`
2. Si hay cambios locales, guardalos: `git stash push -m "stash pre-sync" --include-untracked`
3. Sincroniza: `git pull --rebase origin <rama-actual>`
4. Restaura cambios: `git stash pop`
5. Si hay conflictos en cualquier paso, informalo y detente para resolucion manual

### Paso 2: Analizar y clasificar cambios

1. Ejecuta en paralelo: `git status --short` y `git diff --stat`
2. Si no hay cambios, informa al usuario y termina
3. Si hay archivos untracked relevantes, revisalos rapidamente con `git diff --no-index /dev/null <archivo>` o leelos directamente
4. Clasifica los cambios por tipo (en ingles): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`
5. Determina el scope: si los cambios se concentran en un area, usala; si son multiples, usa scope general o omitelo
6. Si el contexto del usuario menciona un area o proposito, integralo en la clasificacion

### Paso 3: Validar archivos

Excluye del commit:

- Archivos sensibles: `.env`, `*.env`, `credentials.json`, `.env.*`, archivos con secrets
- Build/output: `dist/`, `build/`, `node_modules/`, `.turbo/`, `.next/`, `coverage/`
- Temporales: `.DS_Store`, `Thumbs.db`, `*.log`, `*.tmp`

Si detectas archivos sensibles, informalo y excluyelos. Los lock files (`package-lock.json`, etc.) son validos.

### Paso 4: Generar mensaje y commitear

Genera el mensaje con tipos en **ingles** y descripciones en **espanol**:

```
tipo(scope): descripcion corta (max 72 chars)

- feat: cambio en espanol
- fix: cambio en espanol
- chore: cambio en espanol
```

Reglas del mensaje:

- Tipos siempre en ingles, resto en espanol
- Verbo en infinitivo: `agregar`, `corregir`, `mejorar`, `implementar`
- Sin punto final en primera linea, primera letra en minuscula
- Usa el contexto del usuario si se proporciono para precisar la descripcion
- Max 100 chars por linea del cuerpo

Ejecuta:

1. `git add .` (excluyendo archivos sensibles identificados)
2. `git commit -m "<mensaje>"`
3. Si falla por pre-commit hook, intenta corregir y reintenta

### Paso 5: Push

1. Ejecuta `git push`
2. Si falla por cambios remotos: `git pull --rebase` y luego `git push`
3. Si falla por rama no existe: `git push -u origin <rama>`
4. Si falla por permisos, informalo

### Paso 6: Informe final

Reporta el resultado:

**Exito:**

```
✅ Commit realizado: <hash> - <primera linea del mensaje>
✅ Push completado a la rama <rama>

Resumen:
- X archivos modificados, X nuevos, X eliminados
- Tipos: feat(X), fix(X), chore(X)
```

**Fallo:**

```
⚠️ Error en <fase>: <descripcion>
Sugerencia: <accion>
```

## Notas

- Si no hay cambios, informa y termina sin hacer nada
- No commitees archivos con secrets bajo ninguna circunstancia sin confirmacion explicita
- Si los cambios podrian separarse en commits atomicos, sugierelo pero procede con uno solo a menos que el usuario indique lo contrario
- Ejecuta comandos independientes en paralelo para reducir tiempo
