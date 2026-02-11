module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/app.config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appConfig",
    ()=>appConfig,
    "getThemeCss",
    ()=>getThemeCss
]);
const appConfig = {
    site: {
        name: "PayPerPlay",
        description: "Starter kit for modern Next.js apps.",
        url: "https://example.com",
        locale: "en"
    },
    brand: {
        social: {
            twitterHandle: "@payperplay"
        }
    },
    tokens: {
        light: {
            colors: {
                background: "#ffffff",
                foreground: "#0a0a0a",
                card: "#ffffff",
                cardForeground: "#0a0a0a",
                muted: "#f4f4f5",
                mutedForeground: "#52525b",
                border: "#e4e4e7",
                input: "#e4e4e7",
                primary: "#111827",
                primaryForeground: "#ffffff",
                ring: "#111827"
            },
            radius: {
                md: "0.75rem"
            },
            spacing: {
                containerPaddingX: "1rem"
            }
        },
        dark: {
            colors: {
                background: "#0a0a0a",
                foreground: "#fafafa",
                card: "#0f0f10",
                cardForeground: "#fafafa",
                muted: "#18181b",
                mutedForeground: "#a1a1aa",
                border: "#27272a",
                input: "#27272a",
                primary: "#fafafa",
                primaryForeground: "#09090b",
                ring: "#fafafa"
            },
            radius: {
                md: "0.75rem"
            },
            spacing: {
                containerPaddingX: "1rem"
            }
        }
    }
};
function tokensToCssVars(tokens) {
    return {
        "--ds-color-background": tokens.colors.background,
        "--ds-color-foreground": tokens.colors.foreground,
        "--ds-color-card": tokens.colors.card,
        "--ds-color-card-foreground": tokens.colors.cardForeground,
        "--ds-color-muted": tokens.colors.muted,
        "--ds-color-muted-foreground": tokens.colors.mutedForeground,
        "--ds-color-border": tokens.colors.border,
        "--ds-color-input": tokens.colors.input,
        "--ds-color-primary": tokens.colors.primary,
        "--ds-color-primary-foreground": tokens.colors.primaryForeground,
        "--ds-color-ring": tokens.colors.ring,
        "--ds-radius-md": tokens.radius.md,
        "--ds-space-container-px": tokens.spacing.containerPaddingX
    };
}
function cssVarsToString(vars) {
    return Object.entries(vars).map(([k, v])=>`${k}: ${v};`).join(" ");
}
function getThemeCss() {
    const light = cssVarsToString(tokensToCssVars(appConfig.tokens.light));
    const dark = cssVarsToString(tokensToCssVars(appConfig.tokens.dark));
    return `:root { ${light} } :root.dark { ${dark} }`;
}
}),
"[project]/src/app/icon.tsx [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "contentType",
    ()=>contentType,
    "default",
    ()=>Icon,
    "size",
    ()=>size
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$og$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/og.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app.config.ts [app-route] (ecmascript)");
;
;
;
const size = {
    width: 32,
    height: 32
};
const contentType = "image/png";
function Icon() {
    const letter = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appConfig"].site.name.slice(0, 1).toUpperCase();
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$og$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ImageResponse"](/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f59e0b",
            borderRadius: 8
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: "18",
            height: "20",
            viewBox: "0 0 18 20",
            fill: "none",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M18 10L0 20V0L18 10Z",
                fill: "white"
            }, void 0, false, {
                fileName: "[project]/src/app/icon.tsx",
                lineNumber: 29,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/icon.tsx",
            lineNumber: 28,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/icon.tsx",
        lineNumber: 17,
        columnNumber: 7
    }, this), size);
}
}),
"[project]/src/app/icon--route-entry.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2e$tsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/icon.tsx [app-route] (ecmascript)");
;
;
if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2e$tsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"] !== 'function') {
    throw new Error('Default export is missing in "./icon.tsx"');
}
async function GET(_, ctx) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2e$tsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
        params: ctx.params
    });
}
;
}),
"[project]/src/app/icon--route-entry.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2d2d$route$2d$entry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["GET"],
    "contentType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2e$tsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__["contentType"],
    "size",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2e$tsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__["size"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2d2d$route$2d$entry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/app/icon--route-entry.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2e$tsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/icon.tsx [app-route] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__813ba3cd._.js.map