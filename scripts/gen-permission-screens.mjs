/**
 * Genera src/constants/permissionScreens.ts: para cada capacidad, en qué pantallas (URL del front) se usa.
 * Lo muestra el panel de roles (/settings/roles) para que quien edita permisos vea qué cambia en la plataforma.
 *
 * Uso: node scripts/gen-permission-screens.mjs
 *
 * Fuentes (análisis estático, sin ejecutar la app):
 *  - Rutas (src/routes/*.tsx): cada <Route> con su guard de capacidad -> pantalla completa.
 *  - Menú (SideBar.tsx): ítems con capacidad -> nombre legible de la pantalla.
 *  - Botones y acciones: cualquier archivo que use PERMISSIONS.X se rastrea hacia arriba por sus imports hasta la
 *    pantalla (ruta) que lo muestra -> "acción en pantalla".
 * NO pasar el archivo generado por Prettier.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
const OUT = path.join(SRC, 'constants', 'permissionScreens.ts');

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(tsx?|jsx?)$/.test(e.name) && !e.name.endsWith('.d.ts') ? [p] : [];
  });
const files = walk(SRC);
const fileSet = new Set(files);

// --- constantes PERMISSIONS: NOMBRE -> clave
const permSrc = fs.readFileSync(path.join(SRC, 'constants', 'permissions.ts'), 'utf8');
const NAME_TO_KEY = Object.fromEntries([...permSrc.matchAll(/^\s+([A-Z0-9_]+):\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]));
const permsIn = (text) => [...new Set([...text.matchAll(/PERMISSIONS\.([A-Z0-9_]+)/g)].map((m) => NAME_TO_KEY[m[1]]).filter(Boolean))];

const parse = (file) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

// --- resolución de imports
const ALIASES = { '@utils/': 'utils/', '@stores/': 'store/', '@hooks/': 'hooks/', '@services/': 'services/', '@config/': 'config/', 'src/': '' };
const resolveImport = (from, spec) => {
  let base;
  if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else {
    const alias = Object.keys(ALIASES).find((a) => spec.startsWith(a));
    if (!alias) return null;
    base = path.join(SRC, ALIASES[alias] + spec.slice(alias.length));
  }
  for (const c of [base, base + '.tsx', base + '.ts', base + '.jsx', base + '.js', path.join(base, 'index.tsx'), path.join(base, 'index.ts')]) {
    if (fileSet.has(c)) return c;
  }
  return null;
};

const importsOf = (file) => {
  const sf = parse(file);
  const out = []; // { name, target }
  const visit = (n) => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const target = resolveImport(file, n.moduleSpecifier.text);
      if (target) {
        const names = [];
        if (n.importClause?.name) names.push(n.importClause.name.text);
        if (n.importClause?.namedBindings && ts.isNamedImports(n.importClause.namedBindings)) names.push(...n.importClause.namedBindings.elements.map((e) => e.name.text));
        out.push({ names, target });
      }
    }
    // const X = lazy(() => import('...'))
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isIdentifier(n.name)) {
      const text = n.initializer.getText();
      const m = text.match(/import\(\s*['"]([^'"]+)['"]\s*\)/);
      if (m) {
        const target = resolveImport(file, m[1]);
        if (target) out.push({ names: [n.name.text], target });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
};

const graph = new Map(); // archivo -> [archivos que importa]
const importedBy = new Map(); // archivo -> Set(archivos que lo importan)
const importNames = new Map(); // archivo -> Map(nombre local -> archivo)
for (const f of files) {
  const imps = importsOf(f);
  graph.set(f, [...new Set(imps.map((i) => i.target))]);
  importNames.set(f, new Map(imps.flatMap((i) => i.names.map((n) => [n, i.target]))));
  for (const i of imps) {
    if (!importedBy.has(i.target)) importedBy.set(i.target, new Set());
    importedBy.get(i.target).add(f);
  }
}

// --- rutas
const routeFiles = files.filter((f) => f.startsWith(path.join(SRC, 'routes')) && /Routes\.tsx$/.test(f));
const joinPath = (a, b) => ('/' + [a, b].filter(Boolean).join('/')).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
const screens = []; // { path, file, perms }
for (const rf of routeFiles) {
  const sf = parse(rf);
  const names = importNames.get(rf);
  const walkJsx = (node, prefix, perms) => {
    const tag = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
    let nextPrefix = prefix;
    let nextPerms = perms;
    if (tag && tag.tagName.getText() === 'Route') {
      const attr = (n) => tag.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.text === n);
      const pathAttr = attr('path');
      const p = pathAttr?.initializer && ts.isStringLiteral(pathAttr.initializer) ? pathAttr.initializer.text : '';
      nextPrefix = p.startsWith('/') ? p : joinPath(prefix, p);
      const el = attr('element')?.initializer?.getText() ?? '';
      const isGuard = /guard\(|ProtectedRoute|Outlet/.test(el);
      const elPerms = permsIn(el);
      if (isGuard) nextPerms = [...new Set([...perms, ...elPerms])];
      else if (el) {
        const comp = el.match(/<\s*([A-Z][A-Za-z0-9_]*)/)?.[1];
        const target = comp ? names.get(comp) : null;
        if (target) screens.push({ path: nextPrefix || '/', file: target, perms: [...new Set([...perms, ...elPerms])] });
      }
    }
    ts.forEachChild(node, (c) => walkJsx(c, nextPrefix, nextPerms));
  };
  walkJsx(sf, '', []);
}

// --- menú
const menu = []; // { url, label, perms }
{
  const sf = parse(path.join(SRC, 'Components', 'SideBar.tsx'));
  const visit = (n, parent) => {
    if (ts.isObjectLiteralExpression(n)) {
      const prop = (name) => n.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === name);
      const str = (name) => {
        const i = prop(name)?.initializer;
        return i && ts.isStringLiteral(i) ? i.text : null;
      };
      const url = str('url') ?? str('to');
      const label = str('label') ?? str('buttonText');
      if (url && label) menu.push({ url: joinPath('', url), label: parent ? `${parent} › ${label}` : label, perms: permsIn(prop('permission')?.initializer?.getText() ?? '') });
      const children = prop('menuItems')?.initializer;
      if (children) {
        const groupLabel = str('buttonText') ?? str('label');
        ts.forEachChild(children, (c) => visit(c, groupLabel));
        return;
      }
    }
    ts.forEachChild(n, (c) => visit(c, parent));
  };
  visit(sf, null);
}
const menuByUrl = new Map(menu.map((m) => [m.url, m.label]));
// Nombres en español de los tramos de URL para las pantallas que no están en el menú
const SEGMENTS = {
  maintenance: 'Mantenimiento', analytics: 'Analíticas', tickets: 'Tickets', protocols: 'Protocolos', technicians: 'Técnicos', billing: 'Facturación',
  'calibration-services': 'Servicios de calibración', new: 'Nuevo', edit: 'Editar', mobile: 'Vista móvil', notifications: 'Notificaciones', customers: 'Clientes',
  schedule: 'Programación', 'productos-y-servicios': 'Productos y servicios', datasheets: 'Hojas de datos', alerts: 'Alertas', 'in-out': 'Entradas y salidas',
  'in-out-table': 'Entradas y salidas', 'in-out-report': 'Informe de entradas y salidas', 'inspection-maintenance': 'Inspección y mantenimiento',
  'edit-calibration': 'Editar calibración', 'edit-maintenance': 'Editar mantenimiento', 'new-calibration': 'Nueva calibración', 'new-maintenance': 'Nuevo mantenimiento',
  'calibration-program': 'Programa de calibración', 'maintenance-schedule': 'Cronograma de mantenimiento', 'devices-on-loan': 'Equipos en préstamo',
  'inventory-leasing': 'Inventario y alquiler', inventory: 'Inventario', calibraciones: 'Calibraciones', certificados: 'Certificados', equipos: 'Equipos',
  'tipos-de-certificado': 'Tipos de certificado', templates: 'Plantillas', 'subir-excel': 'Subir Excel', trazabilidad: 'Trazabilidades', fleet: 'Flota',
  documents: 'Documentos', interventions: 'Tipos de intervención', 'data-sheet': 'Hoja de vida', trip: 'Viajes', inspections: 'Inspecciones', iot: 'IoT',
  'customers-management': 'Clientes IoT', map: 'Mapa', 'email-settings': 'Correos de alerta', laboratory: 'Laboratorio', patterns: 'Patrones', conditions: 'Condiciones ambientales',
  lms: 'Academia', admin: 'Administración', assignments: 'Asignaciones', compliance: 'Cumplimiento', 'certificate-templates': 'Plantillas de certificados',
  certificates: 'Certificados', courses: 'Cursos', plans: 'Planes', reporting: 'Reportes', reports: 'Reportes', users: 'Usuarios', content: 'Contenido',
  'quiz-management': 'Banco de preguntas', review: 'Revisión', client: 'Vista de empresa', employee: 'Vista de empleado', course: 'Curso', preview: 'Vista previa',
  certificate: 'Certificado', verify: 'Verificación', purchases: 'Compras', suppliers: 'Proveedores', details: 'Detalle', evaluations: 'Evaluaciones',
  'fiscal-parameters': 'Parámetros fiscales', requests: 'Solicitudes', orders: 'Órdenes', 'personnel-management': 'Personal', statistics: 'Estadísticas',
  'supplier-selection': 'Selección de proveedores', verifications: 'Verificaciones', 'non-conform-work-reports': 'Trabajo no conforme', repository: 'Repositorio',
  'equipment-sales': 'Venta de equipos', products: 'Productos', 'excel-manipulation': 'Manipulación de Excel', gotemberg: 'Gotemberg', 'pdf-script': 'Script de PDF',
  profiles: 'Perfiles', settings: 'Ajustes', roles: 'Roles y permisos', modules: 'Módulos', 'asset-life-sheets': 'Hojas de vida de activos de TI', pdf: 'PDF',
  'tech-management': 'Gestión tecnológica', equipment: 'Hoja de vida del equipo'
};
const labelFor = (p) => {
  if (menuByUrl.has(p)) return menuByUrl.get(p);
  const clean = p.replace(/\/:[^/]+/g, '').replace(/\?/g, '');
  if (menuByUrl.has(clean)) return menuByUrl.get(clean);
  const parts = p.split('/').filter(Boolean);
  const human = parts
    .filter((s) => !s.startsWith(':'))
    .map((s) => SEGMENTS[s.replace(/\?/g, '')] ?? s.replace(/[-_]/g, ' '))
    .join(' › ');
  return human ? human.charAt(0).toUpperCase() + human.slice(1) : 'Inicio';
};

// --- pantallas por archivo (rastreo hacia arriba por imports)
const routePathsByFile = new Map();
for (const s of screens) {
  if (!routePathsByFile.has(s.file)) routePathsByFile.set(s.file, new Set());
  routePathsByFile.get(s.file).add(s.path);
}
const screensRenderingFile = (file) => {
  const seen = new Set([file]);
  const queue = [file];
  const found = new Set();
  while (queue.length) {
    const f = queue.shift();
    if (routePathsByFile.has(f)) routePathsByFile.get(f).forEach((p) => found.add(p));
    for (const parent of importedBy.get(f) ?? []) {
      if (!seen.has(parent) && !parent.startsWith(path.join(SRC, 'routes'))) {
        seen.add(parent);
        queue.push(parent);
      }
    }
  }
  return [...found];
};

// --- resultado
const result = {}; // clave -> Map(path -> { path, label, kind })
const RANK = { screen: 0, action: 1, related: 2 };
const add = (key, p, kind) => {
  if (!result[key]) result[key] = new Map();
  const prev = result[key].get(p);
  if (!prev || RANK[kind] < RANK[prev.kind]) result[key].set(p, { path: p, label: labelFor(p), kind });
};
for (const s of screens) for (const k of s.perms) add(k, s.path, 'screen');
for (const m of menu) for (const k of m.perms) add(k, m.url, 'screen');
const skip = (f) => f.startsWith(path.join(SRC, 'routes')) || f.endsWith(path.join('Components', 'SideBar.tsx')) || f.endsWith(path.join('constants', 'permissions.ts')) || f.endsWith('permissionScreens.ts');
for (const f of files) {
  if (skip(f)) continue;
  const keys = permsIn(fs.readFileSync(f, 'utf8'));
  if (!keys.length) continue;
  const pages = screensRenderingFile(f);
  for (const k of keys) for (const p of pages) add(k, p, 'action');
}

// --- operaciones del API que cada pantalla invoca (cruce con las capacidades que protegen cada endpoint)
const API = path.resolve(root, '..', 'api.mmcs');
const backendEndpoints = []; // { method, segs, perms }
const apiParse = (file) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const apiImports = (sf, file) => {
  const m = new Map();
  sf.statements.filter(ts.isImportDeclaration).forEach((d) => {
    const spec = d.moduleSpecifier.text;
    if (spec.startsWith('.') && d.importClause?.name) m.set(d.importClause.name.text, path.resolve(path.dirname(file), spec));
  });
  return m;
};
const strOf = (n) => (n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null);
const mountsOf = (file) => {
  const sf = apiParse(file);
  const imps = apiImports(sf, file);
  const out = []; // { prefix, target }
  const visit = (n) => {
    if (ts.isObjectLiteralExpression(n)) {
      const pr = (k) => n.properties.find((q) => ts.isPropertyAssignment(q) && q.name.getText() === k)?.initializer;
      const pth = strOf(pr('path'));
      const rt = pr('route');
      if (pth && rt && ts.isIdentifier(rt) && imps.has(rt.text)) out.push({ prefix: pth, target: imps.get(rt.text) });
    }
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'use') {
      const [a, b] = n.arguments;
      if (strOf(a) && b && ts.isIdentifier(b) && imps.has(b.text)) out.push({ prefix: strOf(a), target: imps.get(b.text) });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
};
const routeDefs = (file, prefix) => {
  const sf = apiParse(file);
  const local = new Map(); // identificador -> capacidades
  const visitDecl = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
      const k = permsIn(n.initializer.getText());
      if (k.length) local.set(n.name.text, k);
    }
    ts.forEachChild(n, visitDecl);
  };
  visitDecl(sf);
  const permsOf = (n) => {
    const text = n.getText();
    const ids = [...text.matchAll(/([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]).filter((i) => local.has(i));
    return [...new Set([...permsIn(text), ...ids.flatMap((i) => local.get(i))])];
  };
  let globalPerms = [];
  const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
      const name = n.expression.name.text;
      const obj = n.expression.expression.getText();
      if (obj === 'router' && name === 'use' && !strOf(n.arguments[0])) globalPerms = [...globalPerms, ...n.arguments.flatMap(permsOf)];
      if (obj === 'router' && METHODS.has(name)) {
        const pth = strOf(n.arguments[0]);
        if (pth != null) {
          const perms = [...new Set([...globalPerms, ...n.arguments.slice(1).flatMap(permsOf)])];
          if (perms.length) backendEndpoints.push({ method: name, segs: joinPath(prefix, pth).split('/').filter(Boolean), perms });
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
};
const seenApi = new Set();
const crawl = (file, prefix) => {
  if (seenApi.has(file + prefix) || !fs.existsSync(file)) return;
  seenApi.add(file + prefix);
  const mounts = mountsOf(file);
  routeDefs(file, prefix);
  for (const m of mounts) crawl(m.target, joinPath(prefix, m.prefix));
};
crawl(path.join(API, 'routes', 'index.js'), '');

const pathOfCall = (n) => {
  if (!n) return null;
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
  if (ts.isTemplateExpression(n)) return n.head.text + n.templateSpans.map((sp) => ':p' + sp.literal.text).join('');
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = pathOfCall(n.left);
    const r = ts.isStringLiteral(n.right) ? n.right.text : pathOfCall(n.right) ?? ':p';
    return l == null ? null : l + (ts.isStringLiteral(n.right) || ts.isTemplateExpression(n.right) ? r : ':p');
  }
  return null;
};
const matchScore = (callSegs, ep) => {
  if (callSegs.length !== ep.segs.length) return -1;
  let score = 0;
  for (let i = 0; i < callSegs.length; i++) {
    const c = callSegs[i];
    const e = ep.segs[i];
    const cDyn = c.startsWith(':p');
    const eDyn = e.startsWith(':');
    if (!cDyn && !eDyn) {
      if (c !== e) return -1;
      score += 2;
    } else if (!cDyn && eDyn) score += 1;
    else if (cDyn && !eDyn) score += 0;
  }
  return score;
};
const opMethods = new Set(['get', 'post', 'put', 'patch', 'delete']);
for (const f of files) {
  if (skip(f)) continue;
  const sf = parse(f);
  const hits = new Set();
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && opMethods.has(n.expression.name.text) && /axios|api/i.test(n.expression.expression.getText())) {
      const raw = pathOfCall(n.arguments[0]);
      const norm = raw && raw.startsWith(':p/') ? raw.slice(2) : raw;
      if (norm && norm.startsWith('/')) {
        const segs = norm.split('?')[0].split('/').filter(Boolean);
        const method = n.expression.name.text;
        let best = -1;
        let bestEps = [];
        for (const ep of backendEndpoints) {
          if (ep.method !== method) continue;
          const sc = matchScore(segs, ep);
          if (sc > best) { best = sc; bestEps = [ep]; } else if (sc === best && sc >= 0) bestEps.push(ep);
        }
        if (best >= 2) bestEps.forEach((ep) => ep.perms.forEach((k) => hits.add(k)));
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (!hits.size) continue;
  const pages = screensRenderingFile(f);
  for (const k of hits) for (const p of pages) add(k, p, 'related');
}

const sorted = Object.keys(result).sort();
let out = `// GENERADO por scripts/gen-permission-screens.mjs — no editar a mano ni pasar por Prettier.
// Para cada capacidad, las pantallas del front donde interviene: 'screen' = la pantalla o el menú se protege con ella;
// 'action' = un botón o sección dentro de esa pantalla; 'related' = pantalla que hace una llamada protegida por ella.
export interface PermissionScreen {
  path: string
  label: string
  kind: 'screen' | 'action' | 'related'
}

export const PERMISSION_SCREENS: Record<string, PermissionScreen[]> = {
`;
for (const k of sorted) {
  const list = [...result[k].values()].sort((a, b) => (a.kind === b.kind ? a.path.localeCompare(b.path) : RANK[a.kind] - RANK[b.kind]));
  out += `  '${k}': [\n${list.map((s) => `    { path: ${JSON.stringify(s.path)}, label: ${JSON.stringify(s.label)}, kind: '${s.kind}' }`).join(',\n')}\n  ],\n`;
}
out += '}\n';
const OUT_TEXT = out;
// Con --check no escribe: falla si el archivo commiteado no coincide con lo que se generaría hoy
if (process.argv.includes('--check')) {
  const norm = (t) => t.split('\r\n').join('\n');
  const current = fs.existsSync(OUT) ? norm(fs.readFileSync(OUT, 'utf8')) : '';
  if (current !== norm(OUT_TEXT)) {
    console.error('DESACTUALIZADO: ' + OUT + '. Regénéralo con: npm run permission-screens');
    process.exit(1);
  }
  console.log('ok: ' + OUT + ' está al día');
  process.exit(0);
}
fs.writeFileSync(OUT, OUT_TEXT);
const total = Object.keys(NAME_TO_KEY).length;
console.log(`ok: ${sorted.length} de ${total} capacidades con pantalla; ${screens.length} rutas, ${menu.length} ítems de menú`);
const without = Object.values(NAME_TO_KEY).filter((k) => !result[k]);
console.log('sin pantalla:', without.join(', '));
