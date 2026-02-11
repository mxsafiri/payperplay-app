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
"[project]/src/app/manifest.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>manifest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app.config.ts [app-route] (ecmascript)");
;
function manifest() {
    return {
        name: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appConfig"].site.name,
        short_name: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appConfig"].site.name,
        description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appConfig"].site.description,
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#111827",
        icons: [
            {
                src: "/icon",
                sizes: "32x32",
                type: "image/png"
            },
            {
                src: "/apple-icon",
                sizes: "180x180",
                type: "image/png"
            }
        ]
    };
}
}),
"[project]/src/app/manifest--route-entry.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$manifest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/manifest.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$metadata$2f$resolve$2d$route$2d$data$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/metadata/resolve-route-data.js [app-route] (ecmascript)");
;
;
;
const contentType = "application/manifest+json";
const cacheControl = "public, max-age=0, must-revalidate";
const fileType = "manifest";
if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$manifest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"] !== 'function') {
    throw new Error('Default export is missing in "./manifest.ts"');
}
async function GET() {
    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$manifest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
    const content = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$metadata$2f$resolve$2d$route$2d$data$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveRouteData"])(data, fileType);
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](content, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': cacheControl
        }
    });
}
;
}),
"[project]/src/app/manifest--route-entry.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$manifest$2d2d$route$2d$entry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["GET"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$manifest$2d2d$route$2d$entry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/app/manifest--route-entry.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$manifest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/manifest.ts [app-route] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4dcf3462._.js.map