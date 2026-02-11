module.exports = [
"[project]/src/app.config.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/app/icon.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "contentType",
    ()=>contentType,
    "default",
    ()=>Icon,
    "size",
    ()=>size
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$og$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/og.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2e$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app.config.ts [app-rsc] (ecmascript)");
;
;
;
const size = {
    width: 32,
    height: 32
};
const contentType = "image/png";
function Icon() {
    const letter = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2e$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["appConfig"].site.name.slice(0, 1).toUpperCase();
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$og$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ImageResponse"](/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f59e0b",
            borderRadius: 8
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: "18",
            height: "20",
            viewBox: "0 0 18 20",
            fill: "none",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
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
"[project]/src/app/icon--metadata.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/icon.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$lib$2f$metadata$2f$get$2d$metadata$2d$route$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/lib/metadata/get-metadata-route.js [app-rsc] (ecmascript)");
;
;
const imageModule = {
    contentType: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["contentType"],
    size: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$icon$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["size"]
};
async function __TURBOPACK__default__export__(props) {
    const { __metadata_id__: _, ...params } = await props.params;
    const imageUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$lib$2f$metadata$2f$get$2d$metadata$2d$route$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fillMetadataSegment"])("/", params, "icon");
    function getImageMetadata(imageMetadata, idParam) {
        const data = {
            alt: imageMetadata.alt,
            type: imageMetadata.contentType || 'image/png',
            url: imageUrl + (idParam ? '/' + idParam : '') + "?185a53016602835e"
        };
        const { size } = imageMetadata;
        if (size) {
            data.sizes = `${size.width}x${size.height}`;
        }
        return data;
    }
    return [
        getImageMetadata(imageModule, '')
    ];
}
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-rsc] (ecmascript)").vendored['react-rsc'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/node_modules/next/dist/server/og/image-response.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ImageResponse", {
    enumerable: true,
    get: function() {
        return ImageResponse;
    }
});
function importModule() {
    return __turbopack_context__.A("[externals]/next/dist/compiled/@vercel/og/index.node.js [external] (next/dist/compiled/@vercel/og/index.node.js, esm_import, async loader)");
}
class ImageResponse extends Response {
    static #_ = this.displayName = 'ImageResponse';
    constructor(...args){
        const readable = new ReadableStream({
            async start (controller) {
                const OGImageResponse = // as the auto resolving is not working
                (await importModule()).ImageResponse;
                const imageResponse = new OGImageResponse(...args);
                if (!imageResponse.body) {
                    return controller.close();
                }
                const reader = imageResponse.body.getReader();
                while(true){
                    const { done, value } = await reader.read();
                    if (done) {
                        return controller.close();
                    }
                    controller.enqueue(value);
                }
            }
        });
        const options = args[1] || {};
        const headers = new Headers({
            'content-type': 'image/png',
            'cache-control': ("TURBOPACK compile-time truthy", 1) ? 'no-cache, no-store' : "TURBOPACK unreachable"
        });
        if (options.headers) {
            const newHeaders = new Headers(options.headers);
            newHeaders.forEach((value, key)=>headers.set(key, value));
        }
        super(readable, {
            headers,
            status: options.status,
            statusText: options.statusText
        });
    }
} //# sourceMappingURL=image-response.js.map
}),
"[project]/node_modules/next/og.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/og/image-response.js [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_0f482d6b._.js.map