import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginReactJsxRuntime from "eslint-plugin-react/configs/jsx-runtime.js";
import pluginReactHooks from "eslint-plugin-react-hooks";


// Nombres de rol de la tabla `roles` (espejo de src/constants/roles.ts). Escribirlos como
// string en una lista de roles evita que TypeScript detecte typos y deja el front desalineado
// del backend: usar ROLES.X o ROLE_GROUPS.X.
const ROLE_RE =
  "/^(admin|super_admin|user|metrologist|employee|lms_only|invoicing|Training Manager|mantenimiento|technician|maintenance_coordinator|comp_admin|comp_requester|calibration_coordinator|technical_director|analista_datos)$/";
const roleLiteral = `Literal[value=${ROLE_RE}]`;
const noRoleLiterals = [
  "Property[key.name='roles'] ArrayExpression > ",
  "JSXAttribute[name.name='roles'] ArrayExpression > ",
  "CallExpression[callee.name='useHasRole'] ArrayExpression > ",
  "CallExpression[callee.name='hasAnyRole'] ArrayExpression > ",
  "VariableDeclarator[id.name=/ROLES$/] ArrayExpression > ",
  "CallExpression[callee.property.name='includes'][callee.object.property.name='rol'] > "
].map((prefix) => ({
  selector: prefix + roleLiteral,
  message:
    "No escribas roles como string: usa ROLES.X o ROLE_GROUPS.X de 'src/constants/roles'."
}));

// Los errores del API llegan en varios formatos: se leen con parseApiError /
// getApiErrorReason de 'src/utils/apiError', no con response.data.error|message.
const noRawApiErrorReads = {
  selector:
    "MemberExpression[property.name=/^(error|message)$/] > MemberExpression[property.name='data'] > MemberExpression[property.name='response']",
  message:
    "No leas response.data.error|message a mano: usa getApiErrorReason() / parseApiError() de 'src/utils/apiError'."
};

export default [
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig,
  // "jsx": "react-jsx" en tsconfig: no hace falta importar React en cada archivo
  pluginReactJsxRuntime,
  {
    plugins: { "react-hooks": pluginReactHooks },
    rules: {
      // Las props se validan con TypeScript, no con PropTypes
      "react/prop-types": "off",
      // Deuda de tipado: visible como aviso; el tope baja en `npm run lint`
      "@typescript-eslint/no-explicit-any": "warn",
      // `_algo` marca a propósito un valor que no se usa
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      // Deuda: hay @ts-ignore / @ts-nocheck viejos; que se vean sin romper el lint
      "@typescript-eslint/ban-ts-comment": "warn",
      // Las comillas en el texto de JSX se pintan bien; no vale la pena escaparlas
      "react/no-unescaped-entities": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/constants/roles.ts"],
    rules: {
      "no-restricted-syntax": ["error", ...noRoleLiterals, noRawApiErrorReads]
    }
  },
  {
    // Lectores propios del formato (apiError) o con contrato específico (RBAC, quiz)
    files: [
      "src/utils/apiError.ts",
      "src/utils/rbacErrors.ts",
      "src/services/quizService.ts"
    ],
    rules: { "no-restricted-syntax": ["error", ...noRoleLiterals] }
  }
];