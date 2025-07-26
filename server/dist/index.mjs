import require$$2, { createServer } from 'http';
import { Http2ServerRequest } from 'http2';
import require$$0, { Readable } from 'stream';
import crypto, { randomUUID } from 'crypto';
import require$$0$1 from 'zlib';
import require$$0$2 from 'buffer';
import require$$0$3 from 'events';
import require$$1 from 'https';
import require$$3 from 'net';
import require$$4 from 'tls';
import require$$7 from 'url';
import { webcrypto } from 'node:crypto';

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}
typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

// src/compose.ts
var compose = (middleware, onError, onNotFound)=>{
    return (context, next)=>{
        let index = -1;
        return dispatch(0);
        async function dispatch(i) {
            if (i <= index) {
                throw new Error("next() called multiple times");
            }
            index = i;
            let res;
            let isError = false;
            let handler;
            if (middleware[i]) {
                handler = middleware[i][0][0];
                context.req.routeIndex = i;
            } else {
                handler = i === middleware.length && next || void 0;
            }
            if (handler) {
                try {
                    res = await handler(context, ()=>dispatch(i + 1));
                } catch (err) {
                    if (err instanceof Error && onError) {
                        context.error = err;
                        res = await onError(err, context);
                        isError = true;
                    } else {
                        throw err;
                    }
                }
            } else {
                if (context.finalized === false && onNotFound) {
                    res = await onNotFound(context);
                }
            }
            if (res && (context.finalized === false || isError)) {
                context.res = res;
            }
            return context;
        }
    };
};

// src/request/constants.ts
var GET_MATCH_RESULT = Symbol();

// src/utils/body.ts
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null))=>{
    const { all = false, dot = false } = options;
    const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
    const contentType = headers.get("Content-Type");
    if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
        return parseFormData(request, {
            all,
            dot
        });
    }
    return {};
};
async function parseFormData(request, options) {
    const formData = await request.formData();
    if (formData) {
        return convertFormDataToBodyData(formData, options);
    }
    return {};
}
function convertFormDataToBodyData(formData, options) {
    const form = /* @__PURE__ */ Object.create(null);
    formData.forEach((value, key)=>{
        const shouldParseAllValues = options.all || key.endsWith("[]");
        if (!shouldParseAllValues) {
            form[key] = value;
        } else {
            handleParsingAllValues(form, key, value);
        }
    });
    if (options.dot) {
        Object.entries(form).forEach(([key, value])=>{
            const shouldParseDotValues = key.includes(".");
            if (shouldParseDotValues) {
                handleParsingNestedValues(form, key, value);
                delete form[key];
            }
        });
    }
    return form;
}
var handleParsingAllValues = (form, key, value)=>{
    if (form[key] !== void 0) {
        if (Array.isArray(form[key])) {
            form[key].push(value);
        } else {
            form[key] = [
                form[key],
                value
            ];
        }
    } else {
        if (!key.endsWith("[]")) {
            form[key] = value;
        } else {
            form[key] = [
                value
            ];
        }
    }
};
var handleParsingNestedValues = (form, key, value)=>{
    let nestedForm = form;
    const keys = key.split(".");
    keys.forEach((key2, index)=>{
        if (index === keys.length - 1) {
            nestedForm[key2] = value;
        } else {
            if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
                nestedForm[key2] = /* @__PURE__ */ Object.create(null);
            }
            nestedForm = nestedForm[key2];
        }
    });
};

// src/utils/url.ts
var splitPath = (path)=>{
    const paths = path.split("/");
    if (paths[0] === "") {
        paths.shift();
    }
    return paths;
};
var splitRoutingPath = (routePath)=>{
    const { groups, path } = extractGroupsFromPath(routePath);
    const paths = splitPath(path);
    return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path)=>{
    const groups = [];
    path = path.replace(/\{[^}]+\}/g, (match, index)=>{
        const mark = `@${index}`;
        groups.push([
            mark,
            match
        ]);
        return mark;
    });
    return {
        groups,
        path
    };
};
var replaceGroupMarks = (paths, groups)=>{
    for(let i = groups.length - 1; i >= 0; i--){
        const [mark] = groups[i];
        for(let j = paths.length - 1; j >= 0; j--){
            if (paths[j].includes(mark)) {
                paths[j] = paths[j].replace(mark, groups[i][1]);
                break;
            }
        }
    }
    return paths;
};
var patternCache = {};
var getPattern = (label, next)=>{
    if (label === "*") {
        return "*";
    }
    const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    if (match) {
        const cacheKey = `${label}#${next}`;
        if (!patternCache[cacheKey]) {
            if (match[2]) {
                patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
                    cacheKey,
                    match[1],
                    new RegExp(`^${match[2]}(?=/${next})`)
                ] : [
                    label,
                    match[1],
                    new RegExp(`^${match[2]}$`)
                ];
            } else {
                patternCache[cacheKey] = [
                    label,
                    match[1],
                    true
                ];
            }
        }
        return patternCache[cacheKey];
    }
    return null;
};
var tryDecode = (str, decoder)=>{
    try {
        return decoder(str);
    } catch  {
        return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match)=>{
            try {
                return decoder(match);
            } catch  {
                return match;
            }
        });
    }
};
var tryDecodeURI = (str)=>tryDecode(str, decodeURI);
var getPath = (request)=>{
    const url = request.url;
    const start = url.indexOf("/", url.charCodeAt(9) === 58 ? 13 : 8);
    let i = start;
    for(; i < url.length; i++){
        const charCode = url.charCodeAt(i);
        if (charCode === 37) {
            const queryIndex = url.indexOf("?", i);
            const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
            return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
        } else if (charCode === 63) {
            break;
        }
    }
    return url.slice(start, i);
};
var getPathNoStrict = (request)=>{
    const result = getPath(request);
    return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest)=>{
    if (rest.length) {
        sub = mergePath(sub, ...rest);
    }
    return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path)=>{
    if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
        return null;
    }
    const segments = path.split("/");
    const results = [];
    let basePath = "";
    segments.forEach((segment)=>{
        if (segment !== "" && !/\:/.test(segment)) {
            basePath += "/" + segment;
        } else if (/\:/.test(segment)) {
            if (/\?/.test(segment)) {
                if (results.length === 0 && basePath === "") {
                    results.push("/");
                } else {
                    results.push(basePath);
                }
                const optionalSegment = segment.replace("?", "");
                basePath += "/" + optionalSegment;
                results.push(basePath);
            } else {
                basePath += "/" + segment;
            }
        }
    });
    return results.filter((v, i, a)=>a.indexOf(v) === i);
};
var _decodeURI = (value)=>{
    if (!/[%+]/.test(value)) {
        return value;
    }
    if (value.indexOf("+") !== -1) {
        value = value.replace(/\+/g, " ");
    }
    return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple)=>{
    let encoded;
    if (!multiple && key && !/[%+]/.test(key)) {
        let keyIndex2 = url.indexOf(`?${key}`, 8);
        if (keyIndex2 === -1) {
            keyIndex2 = url.indexOf(`&${key}`, 8);
        }
        while(keyIndex2 !== -1){
            const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
            if (trailingKeyCode === 61) {
                const valueIndex = keyIndex2 + key.length + 2;
                const endIndex = url.indexOf("&", valueIndex);
                return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
            } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
                return "";
            }
            keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        encoded = /[%+]/.test(url);
        if (!encoded) {
            return void 0;
        }
    }
    const results = {};
    encoded ?? (encoded = /[%+]/.test(url));
    let keyIndex = url.indexOf("?", 8);
    while(keyIndex !== -1){
        const nextKeyIndex = url.indexOf("&", keyIndex + 1);
        let valueIndex = url.indexOf("=", keyIndex);
        if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
            valueIndex = -1;
        }
        let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
        if (encoded) {
            name = _decodeURI(name);
        }
        keyIndex = nextKeyIndex;
        if (name === "") {
            continue;
        }
        let value;
        if (valueIndex === -1) {
            value = "";
        } else {
            value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
            if (encoded) {
                value = _decodeURI(value);
            }
        }
        if (multiple) {
            if (!(results[name] && Array.isArray(results[name]))) {
                results[name] = [];
            }
            results[name].push(value);
        } else {
            var _results, _name;
            (_results = results)[_name = name] ?? (_results[_name] = value);
        }
    }
    return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key)=>{
    return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;
var safeEncodeURI = (str)=>{
    try {
        return encodeURI(decodeURI(str));
    } catch (e) {
        if (e instanceof URIError) {
            return encodeURI(str);
        }
        throw e;
    }
};

// src/request.ts
function _class_private_field_loose_base$a(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$a = 0;
function _class_private_field_loose_key$a(name) {
    return "__private_" + id$a++ + "_" + name;
}
let _GET_MATCH_RESULT;
var _validatedData, _matchResult$1, _getDecodedParam, _getAllDecodedParams, _getParamValue, _cachedBody, _class$4;
var tryDecodeURIComponent = (str)=>tryDecode(str, decodeURIComponent_);
var HonoRequest = (_validatedData = /*#__PURE__*/ _class_private_field_loose_key$a("_validatedData"), _matchResult$1 = /*#__PURE__*/ _class_private_field_loose_key$a("_matchResult"), _getDecodedParam = /*#__PURE__*/ _class_private_field_loose_key$a("_getDecodedParam"), _getAllDecodedParams = /*#__PURE__*/ _class_private_field_loose_key$a("_getAllDecodedParams"), _getParamValue = /*#__PURE__*/ _class_private_field_loose_key$a("_getParamValue"), _cachedBody = /*#__PURE__*/ _class_private_field_loose_key$a("_cachedBody"), _GET_MATCH_RESULT = GET_MATCH_RESULT, _class$4 = class {
    param(key) {
        return key ? _class_private_field_loose_base$a(this, _getDecodedParam)[_getDecodedParam](key) : _class_private_field_loose_base$a(this, _getAllDecodedParams)[_getAllDecodedParams]();
    }
    query(key) {
        return getQueryParam(this.url, key);
    }
    queries(key) {
        return getQueryParams(this.url, key);
    }
    header(name) {
        if (name) {
            return this.raw.headers.get(name) ?? void 0;
        }
        const headerData = {};
        this.raw.headers.forEach((value, key)=>{
            headerData[key] = value;
        });
        return headerData;
    }
    async parseBody(options) {
        var _this_bodyCache;
        return (_this_bodyCache = this.bodyCache).parsedBody ?? (_this_bodyCache.parsedBody = await parseBody(this, options));
    }
    json() {
        return _class_private_field_loose_base$a(this, _cachedBody)[_cachedBody]("text").then((text)=>JSON.parse(text));
    }
    text() {
        return _class_private_field_loose_base$a(this, _cachedBody)[_cachedBody]("text");
    }
    arrayBuffer() {
        return _class_private_field_loose_base$a(this, _cachedBody)[_cachedBody]("arrayBuffer");
    }
    blob() {
        return _class_private_field_loose_base$a(this, _cachedBody)[_cachedBody]("blob");
    }
    formData() {
        return _class_private_field_loose_base$a(this, _cachedBody)[_cachedBody]("formData");
    }
    addValidatedData(target, data) {
        _class_private_field_loose_base$a(this, _validatedData)[_validatedData][target] = data;
    }
    valid(target) {
        return _class_private_field_loose_base$a(this, _validatedData)[_validatedData][target];
    }
    get url() {
        return this.raw.url;
    }
    get method() {
        return this.raw.method;
    }
    get [_GET_MATCH_RESULT]() {
        return _class_private_field_loose_base$a(this, _matchResult$1)[_matchResult$1];
    }
    get matchedRoutes() {
        return _class_private_field_loose_base$a(this, _matchResult$1)[_matchResult$1][0].map(([[, route]])=>route);
    }
    get routePath() {
        return _class_private_field_loose_base$a(this, _matchResult$1)[_matchResult$1][0].map(([[, route]])=>route)[this.routeIndex].path;
    }
    constructor(request, path = "/", matchResult = [
        []
    ]){
        Object.defineProperty(this, _getDecodedParam, {
            value: getDecodedParam
        });
        Object.defineProperty(this, _getAllDecodedParams, {
            value: getAllDecodedParams
        });
        Object.defineProperty(this, _getParamValue, {
            value: getParamValue
        });
        Object.defineProperty(this, _validatedData, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _matchResult$1, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _cachedBody, {
            writable: true,
            value: void 0
        });
        this.routeIndex = 0;
        this.bodyCache = {};
        _class_private_field_loose_base$a(this, _cachedBody)[_cachedBody] = (key)=>{
            const { bodyCache, raw } = this;
            const cachedBody = bodyCache[key];
            if (cachedBody) {
                return cachedBody;
            }
            const anyCachedKey = Object.keys(bodyCache)[0];
            if (anyCachedKey) {
                return bodyCache[anyCachedKey].then((body)=>{
                    if (anyCachedKey === "json") {
                        body = JSON.stringify(body);
                    }
                    return new Response(body)[key]();
                });
            }
            return bodyCache[key] = raw[key]();
        };
        this.raw = request;
        this.path = path;
        _class_private_field_loose_base$a(this, _matchResult$1)[_matchResult$1] = matchResult;
        _class_private_field_loose_base$a(this, _validatedData)[_validatedData] = {};
    }
}, _class$4);
function getDecodedParam(key) {
    const paramKey = _class_private_field_loose_base$a(this, _matchResult$1)[_matchResult$1][0][this.routeIndex][1][key];
    const param = _class_private_field_loose_base$a(this, _getParamValue)[_getParamValue](paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
}
function getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(_class_private_field_loose_base$a(this, _matchResult$1)[_matchResult$1][0][this.routeIndex][1]);
    for (const key of keys){
        const value = _class_private_field_loose_base$a(this, _getParamValue)[_getParamValue](_class_private_field_loose_base$a(this, _matchResult$1)[_matchResult$1][0][this.routeIndex][1][key]);
        if (value && typeof value === "string") {
            decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
        }
    }
    return decoded;
}
function getParamValue(paramKey) {
    return _class_private_field_loose_base$a(this, _matchResult$1)[_matchResult$1][1] ? _class_private_field_loose_base$a(this, _matchResult$1)[_matchResult$1][1][paramKey] : paramKey;
}

// src/utils/html.ts
var HtmlEscapedCallbackPhase = {
    Stringify: 1};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer)=>{
    if (typeof str === "object" && !(str instanceof String)) {
        if (!(str instanceof Promise)) {
            str = str.toString();
        }
        if (str instanceof Promise) {
            str = await str;
        }
    }
    const callbacks = str.callbacks;
    if (!callbacks?.length) {
        return Promise.resolve(str);
    }
    if (buffer) {
        buffer[0] += str;
    } else {
        buffer = [
            str
        ];
    }
    const resStr = Promise.all(callbacks.map((c)=>c({
            phase,
            buffer,
            context
        }))).then((res)=>Promise.all(res.filter(Boolean).map((str2)=>resolveCallback(str2, phase, false, context, buffer))).then(()=>buffer[0]));
    {
        return resStr;
    }
};

// src/context.ts
function _class_private_field_loose_base$9(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$9 = 0;
function _class_private_field_loose_key$9(name) {
    return "__private_" + id$9++ + "_" + name;
}
var _rawRequest, _req, _var, _status, _executionCtx, _res, _layout, _renderer, _notFoundHandler$1, _preparedHeaders, _matchResult, _path$1, _newResponse, _class$3;
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers)=>{
    return {
        "Content-Type": contentType,
        ...headers
    };
};
var Context = (_rawRequest = /*#__PURE__*/ _class_private_field_loose_key$9("_rawRequest"), _req = /*#__PURE__*/ _class_private_field_loose_key$9("_req"), _var = /*#__PURE__*/ _class_private_field_loose_key$9("_var"), _status = /*#__PURE__*/ _class_private_field_loose_key$9("_status"), _executionCtx = /*#__PURE__*/ _class_private_field_loose_key$9("_executionCtx"), _res = /*#__PURE__*/ _class_private_field_loose_key$9("_res"), _layout = /*#__PURE__*/ _class_private_field_loose_key$9("_layout"), _renderer = /*#__PURE__*/ _class_private_field_loose_key$9("_renderer"), _notFoundHandler$1 = /*#__PURE__*/ _class_private_field_loose_key$9("_notFoundHandler"), _preparedHeaders = /*#__PURE__*/ _class_private_field_loose_key$9("_preparedHeaders"), _matchResult = /*#__PURE__*/ _class_private_field_loose_key$9("_matchResult"), _path$1 = /*#__PURE__*/ _class_private_field_loose_key$9("_path"), _newResponse = /*#__PURE__*/ _class_private_field_loose_key$9("_newResponse"), _class$3 = class {
    get req() {
        var _class_private_field_loose_base1, _req1;
        (_class_private_field_loose_base1 = _class_private_field_loose_base$9(this, _req))[_req1 = _req] ?? (_class_private_field_loose_base1[_req1] = new HonoRequest(_class_private_field_loose_base$9(this, _rawRequest)[_rawRequest], _class_private_field_loose_base$9(this, _path$1)[_path$1], _class_private_field_loose_base$9(this, _matchResult)[_matchResult]));
        return _class_private_field_loose_base$9(this, _req)[_req];
    }
    get event() {
        if (_class_private_field_loose_base$9(this, _executionCtx)[_executionCtx] && "respondWith" in _class_private_field_loose_base$9(this, _executionCtx)[_executionCtx]) {
            return _class_private_field_loose_base$9(this, _executionCtx)[_executionCtx];
        } else {
            throw Error("This context has no FetchEvent");
        }
    }
    get executionCtx() {
        if (_class_private_field_loose_base$9(this, _executionCtx)[_executionCtx]) {
            return _class_private_field_loose_base$9(this, _executionCtx)[_executionCtx];
        } else {
            throw Error("This context has no ExecutionContext");
        }
    }
    get res() {
        var _class_private_field_loose_base1, _res1, _class_private_field_loose_base2, _preparedHeaders1;
        return (_class_private_field_loose_base1 = _class_private_field_loose_base$9(this, _res))[_res1 = _res] || (_class_private_field_loose_base1[_res1] = new Response(null, {
            headers: (_class_private_field_loose_base2 = _class_private_field_loose_base$9(this, _preparedHeaders))[_preparedHeaders1 = _preparedHeaders] ?? (_class_private_field_loose_base2[_preparedHeaders1] = new Headers())
        }));
    }
    set res(_res1) {
        if (_class_private_field_loose_base$9(this, _res)[_res] && _res1) {
            _res1 = new Response(_res1.body, _res1);
            for (const [k, v] of _class_private_field_loose_base$9(this, _res)[_res].headers.entries()){
                if (k === "content-type") {
                    continue;
                }
                if (k === "set-cookie") {
                    const cookies = _class_private_field_loose_base$9(this, _res)[_res].headers.getSetCookie();
                    _res1.headers.delete("set-cookie");
                    for (const cookie of cookies){
                        _res1.headers.append("set-cookie", cookie);
                    }
                } else {
                    _res1.headers.set(k, v);
                }
            }
        }
        _class_private_field_loose_base$9(this, _res)[_res] = _res1;
        this.finalized = true;
    }
    get var() {
        if (!_class_private_field_loose_base$9(this, _var)[_var]) {
            return {};
        }
        return Object.fromEntries(_class_private_field_loose_base$9(this, _var)[_var]);
    }
    constructor(req, options){
        Object.defineProperty(this, _newResponse, {
            value: newResponse
        });
        Object.defineProperty(this, _rawRequest, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _req, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _var, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _status, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _executionCtx, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _res, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _layout, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _renderer, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _notFoundHandler$1, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _preparedHeaders, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _matchResult, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _path$1, {
            writable: true,
            value: void 0
        });
        this.env = {};
        this.finalized = false;
        this.render = (...args)=>{
            var _class_private_field_loose_base1, _renderer1;
            (_class_private_field_loose_base1 = _class_private_field_loose_base$9(this, _renderer))[_renderer1 = _renderer] ?? (_class_private_field_loose_base1[_renderer1] = (content)=>this.html(content));
            return _class_private_field_loose_base$9(this, _renderer)[_renderer](...args);
        };
        this.setLayout = (layout)=>_class_private_field_loose_base$9(this, _layout)[_layout] = layout;
        this.getLayout = ()=>_class_private_field_loose_base$9(this, _layout)[_layout];
        this.setRenderer = (renderer)=>{
            _class_private_field_loose_base$9(this, _renderer)[_renderer] = renderer;
        };
        this.header = (name, value, options)=>{
            var _class_private_field_loose_base1, _preparedHeaders1;
            if (this.finalized) {
                _class_private_field_loose_base$9(this, _res)[_res] = new Response(_class_private_field_loose_base$9(this, _res)[_res].body, _class_private_field_loose_base$9(this, _res)[_res]);
            }
            const headers = _class_private_field_loose_base$9(this, _res)[_res] ? _class_private_field_loose_base$9(this, _res)[_res].headers : (_class_private_field_loose_base1 = _class_private_field_loose_base$9(this, _preparedHeaders))[_preparedHeaders1 = _preparedHeaders] ?? (_class_private_field_loose_base1[_preparedHeaders1] = new Headers());
            if (value === void 0) {
                headers.delete(name);
            } else if (options?.append) {
                headers.append(name, value);
            } else {
                headers.set(name, value);
            }
        };
        this.status = (status)=>{
            _class_private_field_loose_base$9(this, _status)[_status] = status;
        };
        this.set = (key, value)=>{
            var _class_private_field_loose_base1, _var1;
            (_class_private_field_loose_base1 = _class_private_field_loose_base$9(this, _var))[_var1 = _var] ?? (_class_private_field_loose_base1[_var1] = /* @__PURE__ */ new Map());
            _class_private_field_loose_base$9(this, _var)[_var].set(key, value);
        };
        this.get = (key)=>{
            return _class_private_field_loose_base$9(this, _var)[_var] ? _class_private_field_loose_base$9(this, _var)[_var].get(key) : void 0;
        };
        this.newResponse = (...args)=>_class_private_field_loose_base$9(this, _newResponse)[_newResponse](...args);
        this.body = (data, arg, headers)=>_class_private_field_loose_base$9(this, _newResponse)[_newResponse](data, arg, headers);
        this.text = (text, arg, headers)=>{
            return !_class_private_field_loose_base$9(this, _preparedHeaders)[_preparedHeaders] && !_class_private_field_loose_base$9(this, _status)[_status] && !arg && !headers && !this.finalized ? new Response(text) : _class_private_field_loose_base$9(this, _newResponse)[_newResponse](text, arg, setDefaultContentType(TEXT_PLAIN, headers));
        };
        this.json = (object, arg, headers)=>{
            return _class_private_field_loose_base$9(this, _newResponse)[_newResponse](JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
        };
        this.html = (html, arg, headers)=>{
            const res = (html2)=>_class_private_field_loose_base$9(this, _newResponse)[_newResponse](html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
            return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
        };
        this.redirect = (location, status)=>{
            this.header("Location", safeEncodeURI(String(location)));
            return this.newResponse(null, status ?? 302);
        };
        this.notFound = ()=>{
            var _class_private_field_loose_base1, _notFoundHandler1;
            (_class_private_field_loose_base1 = _class_private_field_loose_base$9(this, _notFoundHandler$1))[_notFoundHandler1 = _notFoundHandler$1] ?? (_class_private_field_loose_base1[_notFoundHandler1] = ()=>new Response());
            return _class_private_field_loose_base$9(this, _notFoundHandler$1)[_notFoundHandler$1](this);
        };
        _class_private_field_loose_base$9(this, _rawRequest)[_rawRequest] = req;
        if (options) {
            _class_private_field_loose_base$9(this, _executionCtx)[_executionCtx] = options.executionCtx;
            this.env = options.env;
            _class_private_field_loose_base$9(this, _notFoundHandler$1)[_notFoundHandler$1] = options.notFoundHandler;
            _class_private_field_loose_base$9(this, _path$1)[_path$1] = options.path;
            _class_private_field_loose_base$9(this, _matchResult)[_matchResult] = options.matchResult;
        }
    }
}, _class$3);
function newResponse(data, arg, headers) {
    const responseHeaders = _class_private_field_loose_base$9(this, _res)[_res] ? new Headers(_class_private_field_loose_base$9(this, _res)[_res].headers) : _class_private_field_loose_base$9(this, _preparedHeaders)[_preparedHeaders] ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
        const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
        for (const [key, value] of argHeaders){
            if (key.toLowerCase() === "set-cookie") {
                responseHeaders.append(key, value);
            } else {
                responseHeaders.set(key, value);
            }
        }
    }
    if (headers) {
        for (const [k, v] of Object.entries(headers)){
            if (typeof v === "string") {
                responseHeaders.set(k, v);
            } else {
                responseHeaders.delete(k);
                for (const v2 of v){
                    responseHeaders.append(k, v2);
                }
            }
        }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? _class_private_field_loose_base$9(this, _status)[_status];
    return new Response(data, {
        status,
        headers: responseHeaders
    });
}

// src/router.ts
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = [
    "get",
    "post",
    "put",
    "delete",
    "options",
    "patch"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// src/utils/constants.ts
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// src/hono-base.ts
function _class_private_field_loose_base$8(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$8 = 0;
function _class_private_field_loose_key$8(name) {
    return "__private_" + id$8++ + "_" + name;
}
var _path, _clone, _notFoundHandler, _addRoute, _handleError, _dispatch, _class$2;
var notFoundHandler = (c)=>{
    return c.text("404 Not Found", 404);
};
var errorHandler = (err, c)=>{
    if ("getResponse" in err) {
        const res = err.getResponse();
        return c.newResponse(res.body, res);
    }
    console.error(err);
    return c.text("Internal Server Error", 500);
};
var Hono$1 = (_path = /*#__PURE__*/ _class_private_field_loose_key$8("_path"), _clone = /*#__PURE__*/ _class_private_field_loose_key$8("_clone"), _notFoundHandler = /*#__PURE__*/ _class_private_field_loose_key$8("_notFoundHandler"), _addRoute = /*#__PURE__*/ _class_private_field_loose_key$8("_addRoute"), _handleError = /*#__PURE__*/ _class_private_field_loose_key$8("_handleError"), _dispatch = /*#__PURE__*/ _class_private_field_loose_key$8("_dispatch"), _class$2 = class {
    route(path, app) {
        const subApp = this.basePath(path);
        app.routes.map((r)=>{
            let handler;
            if (app.errorHandler === errorHandler) {
                handler = r.handler;
            } else {
                handler = async (c, next)=>(await compose([], app.errorHandler)(c, ()=>r.handler(c, next))).res;
                handler[COMPOSED_HANDLER] = r.handler;
            }
            _class_private_field_loose_base$8(subApp, _addRoute)[_addRoute](r.method, r.path, handler);
        });
        return this;
    }
    basePath(path) {
        const subApp = _class_private_field_loose_base$8(this, _clone)[_clone]();
        subApp._basePath = mergePath(this._basePath, path);
        return subApp;
    }
    mount(path, applicationHandler, options) {
        let replaceRequest;
        let optionHandler;
        if (options) {
            if (typeof options === "function") {
                optionHandler = options;
            } else {
                optionHandler = options.optionHandler;
                if (options.replaceRequest === false) {
                    replaceRequest = (request)=>request;
                } else {
                    replaceRequest = options.replaceRequest;
                }
            }
        }
        const getOptions = optionHandler ? (c)=>{
            const options2 = optionHandler(c);
            return Array.isArray(options2) ? options2 : [
                options2
            ];
        } : (c)=>{
            let executionContext = void 0;
            try {
                executionContext = c.executionCtx;
            } catch  {}
            return [
                c.env,
                executionContext
            ];
        };
        replaceRequest || (replaceRequest = (()=>{
            const mergedPath = mergePath(this._basePath, path);
            const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
            return (request)=>{
                const url = new URL(request.url);
                url.pathname = url.pathname.slice(pathPrefixLength) || "/";
                return new Request(url, request);
            };
        })());
        const handler = async (c, next)=>{
            const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
            if (res) {
                return res;
            }
            await next();
        };
        _class_private_field_loose_base$8(this, _addRoute)[_addRoute](METHOD_NAME_ALL, mergePath(path, "*"), handler);
        return this;
    }
    constructor(options = {}){
        Object.defineProperty(this, _clone, {
            value: clone
        });
        Object.defineProperty(this, _addRoute, {
            value: addRoute
        });
        Object.defineProperty(this, _handleError, {
            value: handleError
        });
        Object.defineProperty(this, _dispatch, {
            value: dispatch
        });
        Object.defineProperty(this, _path, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _notFoundHandler, {
            writable: true,
            value: void 0
        });
        this._basePath = "/";
        _class_private_field_loose_base$8(this, _path)[_path] = "/";
        this.routes = [];
        _class_private_field_loose_base$8(this, _notFoundHandler)[_notFoundHandler] = notFoundHandler;
        this.errorHandler = errorHandler;
        this.onError = (handler)=>{
            this.errorHandler = handler;
            return this;
        };
        this.notFound = (handler)=>{
            _class_private_field_loose_base$8(this, _notFoundHandler)[_notFoundHandler] = handler;
            return this;
        };
        this.fetch = (request, ...rest)=>{
            return _class_private_field_loose_base$8(this, _dispatch)[_dispatch](request, rest[1], rest[0], request.method);
        };
        this.request = (input, requestInit, Env, executionCtx)=>{
            if (input instanceof Request) {
                return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
            }
            input = input.toString();
            return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
        };
        this.fire = ()=>{
            addEventListener("fetch", (event)=>{
                event.respondWith(_class_private_field_loose_base$8(this, _dispatch)[_dispatch](event.request, event, void 0, event.request.method));
            });
        };
        const allMethods = [
            ...METHODS,
            METHOD_NAME_ALL_LOWERCASE
        ];
        allMethods.forEach((method)=>{
            this[method] = (args1, ...args)=>{
                if (typeof args1 === "string") {
                    _class_private_field_loose_base$8(this, _path)[_path] = args1;
                } else {
                    _class_private_field_loose_base$8(this, _addRoute)[_addRoute](method, _class_private_field_loose_base$8(this, _path)[_path], args1);
                }
                args.forEach((handler)=>{
                    _class_private_field_loose_base$8(this, _addRoute)[_addRoute](method, _class_private_field_loose_base$8(this, _path)[_path], handler);
                });
                return this;
            };
        });
        this.on = (method, path, ...handlers)=>{
            for (const p of [
                path
            ].flat()){
                _class_private_field_loose_base$8(this, _path)[_path] = p;
                for (const m of [
                    method
                ].flat()){
                    handlers.map((handler)=>{
                        _class_private_field_loose_base$8(this, _addRoute)[_addRoute](m.toUpperCase(), _class_private_field_loose_base$8(this, _path)[_path], handler);
                    });
                }
            }
            return this;
        };
        this.use = (arg1, ...handlers)=>{
            if (typeof arg1 === "string") {
                _class_private_field_loose_base$8(this, _path)[_path] = arg1;
            } else {
                _class_private_field_loose_base$8(this, _path)[_path] = "*";
                handlers.unshift(arg1);
            }
            handlers.forEach((handler)=>{
                _class_private_field_loose_base$8(this, _addRoute)[_addRoute](METHOD_NAME_ALL, _class_private_field_loose_base$8(this, _path)[_path], handler);
            });
            return this;
        };
        const { strict, ...optionsWithoutStrict } = options;
        Object.assign(this, optionsWithoutStrict);
        this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
    }
}, _class$2);
function clone() {
    const clone = new Hono$1({
        router: this.router,
        getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    _class_private_field_loose_base$8(clone, _notFoundHandler)[_notFoundHandler] = _class_private_field_loose_base$8(this, _notFoundHandler)[_notFoundHandler];
    clone.routes = this.routes;
    return clone;
}
function addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
        basePath: this._basePath,
        path,
        method,
        handler
    };
    this.router.add(method, path, [
        handler,
        r
    ]);
    this.routes.push(r);
}
function handleError(err, c) {
    if (err instanceof Error) {
        return this.errorHandler(err, c);
    }
    throw err;
}
function dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
        return (async ()=>new Response(null, await _class_private_field_loose_base$8(this, _dispatch)[_dispatch](request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, {
        env
    });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
        path,
        matchResult,
        env,
        executionCtx,
        notFoundHandler: _class_private_field_loose_base$8(this, _notFoundHandler)[_notFoundHandler]
    });
    if (matchResult[0].length === 1) {
        let res;
        try {
            res = matchResult[0][0][0][0](c, async ()=>{
                c.res = await _class_private_field_loose_base$8(this, _notFoundHandler)[_notFoundHandler](c);
            });
        } catch (err) {
            return _class_private_field_loose_base$8(this, _handleError)[_handleError](err, c);
        }
        return res instanceof Promise ? res.then((resolved)=>resolved || (c.finalized ? c.res : _class_private_field_loose_base$8(this, _notFoundHandler)[_notFoundHandler](c))).catch((err)=>_class_private_field_loose_base$8(this, _handleError)[_handleError](err, c)) : res ?? _class_private_field_loose_base$8(this, _notFoundHandler)[_notFoundHandler](c);
    }
    const composed = compose(matchResult[0], this.errorHandler, _class_private_field_loose_base$8(this, _notFoundHandler)[_notFoundHandler]);
    return (async ()=>{
        try {
            const context = await composed(c);
            if (!context.finalized) {
                throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
            }
            return context.res;
        } catch (err) {
            return _class_private_field_loose_base$8(this, _handleError)[_handleError](err, c);
        }
    })();
}

// src/router/reg-exp-router/node.ts
function _class_private_field_loose_base$7(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$7 = 0;
function _class_private_field_loose_key$7(name) {
    return "__private_" + id$7++ + "_" + name;
}
var _index, _varIndex, _children$1;
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
    if (a.length === 1) {
        return b.length === 1 ? a < b ? -1 : 1 : -1;
    }
    if (b.length === 1) {
        return 1;
    }
    if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
        return 1;
    } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
        return -1;
    }
    if (a === LABEL_REG_EXP_STR) {
        return 1;
    } else if (b === LABEL_REG_EXP_STR) {
        return -1;
    }
    return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node$1 = (_index = /*#__PURE__*/ _class_private_field_loose_key$7("_index"), _varIndex = /*#__PURE__*/ _class_private_field_loose_key$7("_varIndex"), _children$1 = /*#__PURE__*/ _class_private_field_loose_key$7("_children"), class {
    insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
        if (tokens.length === 0) {
            if (_class_private_field_loose_base$7(this, _index)[_index] !== void 0) {
                throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
                return;
            }
            _class_private_field_loose_base$7(this, _index)[_index] = index;
            return;
        }
        const [token, ...restTokens] = tokens;
        const pattern = token === "*" ? restTokens.length === 0 ? [
            "",
            "",
            ONLY_WILDCARD_REG_EXP_STR
        ] : [
            "",
            "",
            LABEL_REG_EXP_STR
        ] : token === "/*" ? [
            "",
            "",
            TAIL_WILDCARD_REG_EXP_STR
        ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
        let node;
        if (pattern) {
            const name = pattern[1];
            let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
            if (name && pattern[2]) {
                regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
                if (/\((?!\?:)/.test(regexpStr)) {
                    throw PATH_ERROR;
                }
            }
            node = _class_private_field_loose_base$7(this, _children$1)[_children$1][regexpStr];
            if (!node) {
                if (Object.keys(_class_private_field_loose_base$7(this, _children$1)[_children$1]).some((k)=>k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
                    throw PATH_ERROR;
                }
                if (pathErrorCheckOnly) {
                    return;
                }
                node = _class_private_field_loose_base$7(this, _children$1)[_children$1][regexpStr] = new Node$1();
                if (name !== "") {
                    _class_private_field_loose_base$7(node, _varIndex)[_varIndex] = context.varIndex++;
                }
            }
            if (!pathErrorCheckOnly && name !== "") {
                paramMap.push([
                    name,
                    _class_private_field_loose_base$7(node, _varIndex)[_varIndex]
                ]);
            }
        } else {
            node = _class_private_field_loose_base$7(this, _children$1)[_children$1][token];
            if (!node) {
                if (Object.keys(_class_private_field_loose_base$7(this, _children$1)[_children$1]).some((k)=>k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR)) {
                    throw PATH_ERROR;
                }
                if (pathErrorCheckOnly) {
                    return;
                }
                node = _class_private_field_loose_base$7(this, _children$1)[_children$1][token] = new Node$1();
            }
        }
        node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
    }
    buildRegExpStr() {
        const childKeys = Object.keys(_class_private_field_loose_base$7(this, _children$1)[_children$1]).sort(compareKey);
        const strList = childKeys.map((k)=>{
            const c = _class_private_field_loose_base$7(this, _children$1)[_children$1][k];
            return (typeof _class_private_field_loose_base$7(c, _varIndex)[_varIndex] === "number" ? `(${k})@${_class_private_field_loose_base$7(c, _varIndex)[_varIndex]}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
        });
        if (typeof _class_private_field_loose_base$7(this, _index)[_index] === "number") {
            strList.unshift(`#${_class_private_field_loose_base$7(this, _index)[_index]}`);
        }
        if (strList.length === 0) {
            return "";
        }
        if (strList.length === 1) {
            return strList[0];
        }
        return "(?:" + strList.join("|") + ")";
    }
    constructor(){
        Object.defineProperty(this, _index, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _varIndex, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _children$1, {
            writable: true,
            value: void 0
        });
        _class_private_field_loose_base$7(this, _children$1)[_children$1] = /* @__PURE__ */ Object.create(null);
    }
});

// src/router/reg-exp-router/trie.ts
function _class_private_field_loose_base$6(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$6 = 0;
function _class_private_field_loose_key$6(name) {
    return "__private_" + id$6++ + "_" + name;
}
var _context, _root;
var Trie = (_context = /*#__PURE__*/ _class_private_field_loose_key$6("_context"), _root = /*#__PURE__*/ _class_private_field_loose_key$6("_root"), class {
    insert(path, index, pathErrorCheckOnly) {
        const paramAssoc = [];
        const groups = [];
        for(let i = 0;;){
            let replaced = false;
            path = path.replace(/\{[^}]+\}/g, (m)=>{
                const mark = `@\\${i}`;
                groups[i] = [
                    mark,
                    m
                ];
                i++;
                replaced = true;
                return mark;
            });
            if (!replaced) {
                break;
            }
        }
        const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
        for(let i = groups.length - 1; i >= 0; i--){
            const [mark] = groups[i];
            for(let j = tokens.length - 1; j >= 0; j--){
                if (tokens[j].indexOf(mark) !== -1) {
                    tokens[j] = tokens[j].replace(mark, groups[i][1]);
                    break;
                }
            }
        }
        _class_private_field_loose_base$6(this, _root)[_root].insert(tokens, index, paramAssoc, _class_private_field_loose_base$6(this, _context)[_context], pathErrorCheckOnly);
        return paramAssoc;
    }
    buildRegExp() {
        let regexp = _class_private_field_loose_base$6(this, _root)[_root].buildRegExpStr();
        if (regexp === "") {
            return [
                /^$/,
                [],
                []
            ];
        }
        let captureIndex = 0;
        const indexReplacementMap = [];
        const paramReplacementMap = [];
        regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex)=>{
            if (handlerIndex !== void 0) {
                indexReplacementMap[++captureIndex] = Number(handlerIndex);
                return "$()";
            }
            if (paramIndex !== void 0) {
                paramReplacementMap[Number(paramIndex)] = ++captureIndex;
                return "";
            }
            return "";
        });
        return [
            new RegExp(`^${regexp}`),
            indexReplacementMap,
            paramReplacementMap
        ];
    }
    constructor(){
        Object.defineProperty(this, _context, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _root, {
            writable: true,
            value: void 0
        });
        _class_private_field_loose_base$6(this, _context)[_context] = {
            varIndex: 0
        };
        _class_private_field_loose_base$6(this, _root)[_root] = new Node$1();
    }
});

// src/router/reg-exp-router/router.ts
function _class_private_field_loose_base$5(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$5 = 0;
function _class_private_field_loose_key$5(name) {
    return "__private_" + id$5++ + "_" + name;
}
var _middleware, _routes$1, _buildAllMatchers, _buildMatcher, _class$1;
var emptyParam = [];
var nullMatcher = [
    /^$/,
    [],
    /* @__PURE__ */ Object.create(null)
];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
    var _wildcardRegExpCache, _path;
    return (_wildcardRegExpCache = wildcardRegExpCache)[_path = path] ?? (_wildcardRegExpCache[_path] = new RegExp(path === "*" ? "" : `^${path.replace(/\/\*$|([.\\+*[^\]$()])/g, (_, metaChar)=>metaChar ? `\\${metaChar}` : "(?:|/.*)")}$`));
}
function clearWildcardRegExpCache() {
    wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
    const trie = new Trie();
    const handlerData = [];
    if (routes.length === 0) {
        return nullMatcher;
    }
    const routesWithStaticPathFlag = routes.map((route)=>[
            !/\*|\/:/.test(route[0]),
            ...route
        ]).sort(([isStaticA, pathA], [isStaticB, pathB])=>isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length);
    const staticMap = /* @__PURE__ */ Object.create(null);
    for(let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++){
        const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
        if (pathErrorCheckOnly) {
            staticMap[path] = [
                handlers.map(([h])=>[
                        h,
                        /* @__PURE__ */ Object.create(null)
                    ]),
                emptyParam
            ];
        } else {
            j++;
        }
        let paramAssoc;
        try {
            paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
        } catch (e) {
            throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
        }
        if (pathErrorCheckOnly) {
            continue;
        }
        handlerData[j] = handlers.map(([h, paramCount])=>{
            const paramIndexMap = /* @__PURE__ */ Object.create(null);
            paramCount -= 1;
            for(; paramCount >= 0; paramCount--){
                const [key, value] = paramAssoc[paramCount];
                paramIndexMap[key] = value;
            }
            return [
                h,
                paramIndexMap
            ];
        });
    }
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for(let i = 0, len = handlerData.length; i < len; i++){
        for(let j = 0, len2 = handlerData[i].length; j < len2; j++){
            const map = handlerData[i][j]?.[1];
            if (!map) {
                continue;
            }
            const keys = Object.keys(map);
            for(let k = 0, len3 = keys.length; k < len3; k++){
                map[keys[k]] = paramReplacementMap[map[keys[k]]];
            }
        }
    }
    const handlerMap = [];
    for(const i in indexReplacementMap){
        handlerMap[i] = handlerData[indexReplacementMap[i]];
    }
    return [
        regexp,
        handlerMap,
        staticMap
    ];
}
function findMiddleware(middleware, path) {
    if (!middleware) {
        return void 0;
    }
    for (const k of Object.keys(middleware).sort((a, b)=>b.length - a.length)){
        if (buildWildcardRegExp(k).test(path)) {
            return [
                ...middleware[k]
            ];
        }
    }
    return void 0;
}
var RegExpRouter = (_middleware = /*#__PURE__*/ _class_private_field_loose_key$5("_middleware"), _routes$1 = /*#__PURE__*/ _class_private_field_loose_key$5("_routes"), _buildAllMatchers = /*#__PURE__*/ _class_private_field_loose_key$5("_buildAllMatchers"), _buildMatcher = /*#__PURE__*/ _class_private_field_loose_key$5("_buildMatcher"), _class$1 = class {
    add(method, path, handler) {
        const middleware = _class_private_field_loose_base$5(this, _middleware)[_middleware];
        const routes = _class_private_field_loose_base$5(this, _routes$1)[_routes$1];
        if (!middleware || !routes) {
            throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        if (!middleware[method]) {
            [
                middleware,
                routes
            ].forEach((handlerMap)=>{
                handlerMap[method] = /* @__PURE__ */ Object.create(null);
                Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p)=>{
                    handlerMap[method][p] = [
                        ...handlerMap[METHOD_NAME_ALL][p]
                    ];
                });
            });
        }
        if (path === "/*") {
            path = "*";
        }
        const paramCount = (path.match(/\/:/g) || []).length;
        if (/\*$/.test(path)) {
            const re = buildWildcardRegExp(path);
            if (method === METHOD_NAME_ALL) {
                Object.keys(middleware).forEach((m)=>{
                    var _middleware_m, _path;
                    (_middleware_m = middleware[m])[_path = path] || (_middleware_m[_path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
                });
            } else {
                var _middleware_method, _path;
                (_middleware_method = middleware[method])[_path = path] || (_middleware_method[_path] = findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
            }
            Object.keys(middleware).forEach((m)=>{
                if (method === METHOD_NAME_ALL || method === m) {
                    Object.keys(middleware[m]).forEach((p)=>{
                        re.test(p) && middleware[m][p].push([
                            handler,
                            paramCount
                        ]);
                    });
                }
            });
            Object.keys(routes).forEach((m)=>{
                if (method === METHOD_NAME_ALL || method === m) {
                    Object.keys(routes[m]).forEach((p)=>re.test(p) && routes[m][p].push([
                            handler,
                            paramCount
                        ]));
                }
            });
            return;
        }
        const paths = checkOptionalParameter(path) || [
            path
        ];
        for(let i = 0, len = paths.length; i < len; i++){
            const path2 = paths[i];
            Object.keys(routes).forEach((m)=>{
                if (method === METHOD_NAME_ALL || method === m) {
                    var _routes_m, _path2;
                    (_routes_m = routes[m])[_path2 = path2] || (_routes_m[_path2] = [
                        ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
                    ]);
                    routes[m][path2].push([
                        handler,
                        paramCount - len + i + 1
                    ]);
                }
            });
        }
    }
    match(method, path) {
        clearWildcardRegExpCache();
        const matchers = _class_private_field_loose_base$5(this, _buildAllMatchers)[_buildAllMatchers]();
        this.match = (method2, path2)=>{
            const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
            const staticMatch = matcher[2][path2];
            if (staticMatch) {
                return staticMatch;
            }
            const match = path2.match(matcher[0]);
            if (!match) {
                return [
                    [],
                    emptyParam
                ];
            }
            const index = match.indexOf("", 1);
            return [
                matcher[1][index],
                match
            ];
        };
        return this.match(method, path);
    }
    constructor(){
        Object.defineProperty(this, _buildAllMatchers, {
            value: buildAllMatchers
        });
        Object.defineProperty(this, _buildMatcher, {
            value: buildMatcher
        });
        Object.defineProperty(this, _middleware, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _routes$1, {
            writable: true,
            value: void 0
        });
        this.name = "RegExpRouter";
        _class_private_field_loose_base$5(this, _middleware)[_middleware] = {
            [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null)
        };
        _class_private_field_loose_base$5(this, _routes$1)[_routes$1] = {
            [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null)
        };
    }
}, _class$1);
function buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(_class_private_field_loose_base$5(this, _routes$1)[_routes$1]).concat(Object.keys(_class_private_field_loose_base$5(this, _middleware)[_middleware])).forEach((method)=>{
        var _matchers, _method;
        (_matchers = matchers)[_method = method] || (_matchers[_method] = _class_private_field_loose_base$5(this, _buildMatcher)[_buildMatcher](method));
    });
    _class_private_field_loose_base$5(this, _middleware)[_middleware] = _class_private_field_loose_base$5(this, _routes$1)[_routes$1] = void 0;
    return matchers;
}
function buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [
        _class_private_field_loose_base$5(this, _middleware)[_middleware],
        _class_private_field_loose_base$5(this, _routes$1)[_routes$1]
    ].forEach((r)=>{
        const ownRoute = r[method] ? Object.keys(r[method]).map((path)=>[
                path,
                r[method][path]
            ]) : [];
        if (ownRoute.length !== 0) {
            hasOwnRoute || (hasOwnRoute = true);
            routes.push(...ownRoute);
        } else if (method !== METHOD_NAME_ALL) {
            routes.push(...Object.keys(r[METHOD_NAME_ALL]).map((path)=>[
                    path,
                    r[METHOD_NAME_ALL][path]
                ]));
        }
    });
    if (!hasOwnRoute) {
        return null;
    } else {
        return buildMatcherFromPreprocessedRoutes(routes);
    }
}

// src/router/smart-router/router.ts
function _class_private_field_loose_base$4(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$4 = 0;
function _class_private_field_loose_key$4(name) {
    return "__private_" + id$4++ + "_" + name;
}
var _routers, _routes;
var SmartRouter = (_routers = /*#__PURE__*/ _class_private_field_loose_key$4("_routers"), _routes = /*#__PURE__*/ _class_private_field_loose_key$4("_routes"), class {
    add(method, path, handler) {
        if (!_class_private_field_loose_base$4(this, _routes)[_routes]) {
            throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        _class_private_field_loose_base$4(this, _routes)[_routes].push([
            method,
            path,
            handler
        ]);
    }
    match(method, path) {
        if (!_class_private_field_loose_base$4(this, _routes)[_routes]) {
            throw new Error("Fatal error");
        }
        const routers = _class_private_field_loose_base$4(this, _routers)[_routers];
        const routes = _class_private_field_loose_base$4(this, _routes)[_routes];
        const len = routers.length;
        let i = 0;
        let res;
        for(; i < len; i++){
            const router = routers[i];
            try {
                for(let i2 = 0, len2 = routes.length; i2 < len2; i2++){
                    router.add(...routes[i2]);
                }
                res = router.match(method, path);
            } catch (e) {
                if (e instanceof UnsupportedPathError) {
                    continue;
                }
                throw e;
            }
            this.match = router.match.bind(router);
            _class_private_field_loose_base$4(this, _routers)[_routers] = [
                router
            ];
            _class_private_field_loose_base$4(this, _routes)[_routes] = void 0;
            break;
        }
        if (i === len) {
            throw new Error("Fatal error");
        }
        this.name = `SmartRouter + ${this.activeRouter.name}`;
        return res;
    }
    get activeRouter() {
        if (_class_private_field_loose_base$4(this, _routes)[_routes] || _class_private_field_loose_base$4(this, _routers)[_routers].length !== 1) {
            throw new Error("No active router has been determined yet.");
        }
        return _class_private_field_loose_base$4(this, _routers)[_routers][0];
    }
    constructor(init){
        Object.defineProperty(this, _routers, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _routes, {
            writable: true,
            value: void 0
        });
        this.name = "SmartRouter";
        _class_private_field_loose_base$4(this, _routers)[_routers] = [];
        _class_private_field_loose_base$4(this, _routes)[_routes] = [];
        _class_private_field_loose_base$4(this, _routers)[_routers] = init.routers;
    }
});

// src/router/trie-router/node.ts
function _class_private_field_loose_base$3(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$3 = 0;
function _class_private_field_loose_key$3(name) {
    return "__private_" + id$3++ + "_" + name;
}
var _methods, _children, _patterns, _order, _params, _getHandlerSets, _class;
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node = (_methods = /*#__PURE__*/ _class_private_field_loose_key$3("_methods"), _children = /*#__PURE__*/ _class_private_field_loose_key$3("_children"), _patterns = /*#__PURE__*/ _class_private_field_loose_key$3("_patterns"), _order = /*#__PURE__*/ _class_private_field_loose_key$3("_order"), _params = /*#__PURE__*/ _class_private_field_loose_key$3("_params"), _getHandlerSets = /*#__PURE__*/ _class_private_field_loose_key$3("_getHandlerSets"), _class = class {
    insert(method, path, handler) {
        _class_private_field_loose_base$3(this, _order)[_order] = ++_class_private_field_loose_base$3(this, _order)[_order];
        let curNode = this;
        const parts = splitRoutingPath(path);
        const possibleKeys = [];
        for(let i = 0, len = parts.length; i < len; i++){
            const p = parts[i];
            const nextP = parts[i + 1];
            const pattern = getPattern(p, nextP);
            const key = Array.isArray(pattern) ? pattern[0] : p;
            if (key in _class_private_field_loose_base$3(curNode, _children)[_children]) {
                curNode = _class_private_field_loose_base$3(curNode, _children)[_children][key];
                if (pattern) {
                    possibleKeys.push(pattern[1]);
                }
                continue;
            }
            _class_private_field_loose_base$3(curNode, _children)[_children][key] = new Node();
            if (pattern) {
                _class_private_field_loose_base$3(curNode, _patterns)[_patterns].push(pattern);
                possibleKeys.push(pattern[1]);
            }
            curNode = _class_private_field_loose_base$3(curNode, _children)[_children][key];
        }
        _class_private_field_loose_base$3(curNode, _methods)[_methods].push({
            [method]: {
                handler,
                possibleKeys: possibleKeys.filter((v, i, a)=>a.indexOf(v) === i),
                score: _class_private_field_loose_base$3(this, _order)[_order]
            }
        });
        return curNode;
    }
    search(method, path) {
        const handlerSets = [];
        _class_private_field_loose_base$3(this, _params)[_params] = emptyParams;
        const curNode = this;
        let curNodes = [
            curNode
        ];
        const parts = splitPath(path);
        const curNodesQueue = [];
        for(let i = 0, len = parts.length; i < len; i++){
            const part = parts[i];
            const isLast = i === len - 1;
            const tempNodes = [];
            for(let j = 0, len2 = curNodes.length; j < len2; j++){
                const node = curNodes[j];
                const nextNode = _class_private_field_loose_base$3(node, _children)[_children][part];
                if (nextNode) {
                    _class_private_field_loose_base$3(nextNode, _params)[_params] = _class_private_field_loose_base$3(node, _params)[_params];
                    if (isLast) {
                        if (_class_private_field_loose_base$3(nextNode, _children)[_children]["*"]) {
                            handlerSets.push(..._class_private_field_loose_base$3(this, _getHandlerSets)[_getHandlerSets](_class_private_field_loose_base$3(nextNode, _children)[_children]["*"], method, _class_private_field_loose_base$3(node, _params)[_params]));
                        }
                        handlerSets.push(..._class_private_field_loose_base$3(this, _getHandlerSets)[_getHandlerSets](nextNode, method, _class_private_field_loose_base$3(node, _params)[_params]));
                    } else {
                        tempNodes.push(nextNode);
                    }
                }
                for(let k = 0, len3 = _class_private_field_loose_base$3(node, _patterns)[_patterns].length; k < len3; k++){
                    const pattern = _class_private_field_loose_base$3(node, _patterns)[_patterns][k];
                    const params = _class_private_field_loose_base$3(node, _params)[_params] === emptyParams ? {} : {
                        ..._class_private_field_loose_base$3(node, _params)[_params]
                    };
                    if (pattern === "*") {
                        const astNode = _class_private_field_loose_base$3(node, _children)[_children]["*"];
                        if (astNode) {
                            handlerSets.push(..._class_private_field_loose_base$3(this, _getHandlerSets)[_getHandlerSets](astNode, method, _class_private_field_loose_base$3(node, _params)[_params]));
                            _class_private_field_loose_base$3(astNode, _params)[_params] = params;
                            tempNodes.push(astNode);
                        }
                        continue;
                    }
                    if (!part) {
                        continue;
                    }
                    const [key, name, matcher] = pattern;
                    const child = _class_private_field_loose_base$3(node, _children)[_children][key];
                    const restPathString = parts.slice(i).join("/");
                    if (matcher instanceof RegExp) {
                        const m = matcher.exec(restPathString);
                        if (m) {
                            params[name] = m[0];
                            handlerSets.push(..._class_private_field_loose_base$3(this, _getHandlerSets)[_getHandlerSets](child, method, _class_private_field_loose_base$3(node, _params)[_params], params));
                            if (Object.keys(_class_private_field_loose_base$3(child, _children)[_children]).length) {
                                var _curNodesQueue, _componentCount;
                                _class_private_field_loose_base$3(child, _params)[_params] = params;
                                const componentCount = m[0].match(/\//)?.length ?? 0;
                                const targetCurNodes = (_curNodesQueue = curNodesQueue)[_componentCount = componentCount] || (_curNodesQueue[_componentCount] = []);
                                targetCurNodes.push(child);
                            }
                            continue;
                        }
                    }
                    if (matcher === true || matcher.test(part)) {
                        params[name] = part;
                        if (isLast) {
                            handlerSets.push(..._class_private_field_loose_base$3(this, _getHandlerSets)[_getHandlerSets](child, method, params, _class_private_field_loose_base$3(node, _params)[_params]));
                            if (_class_private_field_loose_base$3(child, _children)[_children]["*"]) {
                                handlerSets.push(..._class_private_field_loose_base$3(this, _getHandlerSets)[_getHandlerSets](_class_private_field_loose_base$3(child, _children)[_children]["*"], method, params, _class_private_field_loose_base$3(node, _params)[_params]));
                            }
                        } else {
                            _class_private_field_loose_base$3(child, _params)[_params] = params;
                            tempNodes.push(child);
                        }
                    }
                }
            }
            curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
        }
        if (handlerSets.length > 1) {
            handlerSets.sort((a, b)=>{
                return a.score - b.score;
            });
        }
        return [
            handlerSets.map(({ handler, params })=>[
                    handler,
                    params
                ])
        ];
    }
    constructor(method, handler, children){
        Object.defineProperty(this, _getHandlerSets, {
            value: getHandlerSets
        });
        Object.defineProperty(this, _methods, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _children, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _patterns, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _order, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _params, {
            writable: true,
            value: void 0
        });
        _class_private_field_loose_base$3(this, _order)[_order] = 0;
        _class_private_field_loose_base$3(this, _params)[_params] = emptyParams;
        _class_private_field_loose_base$3(this, _children)[_children] = children || /* @__PURE__ */ Object.create(null);
        _class_private_field_loose_base$3(this, _methods)[_methods] = [];
        if (method && handler) {
            const m = /* @__PURE__ */ Object.create(null);
            m[method] = {
                handler,
                possibleKeys: [],
                score: 0
            };
            _class_private_field_loose_base$3(this, _methods)[_methods] = [
                m
            ];
        }
        _class_private_field_loose_base$3(this, _patterns)[_patterns] = [];
    }
}, _class);
function getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for(let i = 0, len = _class_private_field_loose_base$3(node, _methods)[_methods].length; i < len; i++){
        const m = _class_private_field_loose_base$3(node, _methods)[_methods][i];
        const handlerSet = m[method] || m[METHOD_NAME_ALL];
        const processedSet = {};
        if (handlerSet !== void 0) {
            handlerSet.params = /* @__PURE__ */ Object.create(null);
            handlerSets.push(handlerSet);
            if (nodeParams !== emptyParams || params && params !== emptyParams) {
                for(let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++){
                    const key = handlerSet.possibleKeys[i2];
                    const processed = processedSet[handlerSet.score];
                    handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
                    processedSet[handlerSet.score] = true;
                }
            }
        }
    }
    return handlerSets;
}

// src/router/trie-router/router.ts
function _class_private_field_loose_base$2(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$2 = 0;
function _class_private_field_loose_key$2(name) {
    return "__private_" + id$2++ + "_" + name;
}
var _node;
var TrieRouter = (_node = /*#__PURE__*/ _class_private_field_loose_key$2("_node"), class {
    add(method, path, handler) {
        const results = checkOptionalParameter(path);
        if (results) {
            for(let i = 0, len = results.length; i < len; i++){
                _class_private_field_loose_base$2(this, _node)[_node].insert(method, results[i], handler);
            }
            return;
        }
        _class_private_field_loose_base$2(this, _node)[_node].insert(method, path, handler);
    }
    match(method, path) {
        return _class_private_field_loose_base$2(this, _node)[_node].search(method, path);
    }
    constructor(){
        Object.defineProperty(this, _node, {
            writable: true,
            value: void 0
        });
        this.name = "TrieRouter";
        _class_private_field_loose_base$2(this, _node)[_node] = new Node();
    }
});

// src/hono.ts
var Hono = class extends Hono$1 {
    constructor(options = {}){
        super(options);
        this.router = options.router ?? new SmartRouter({
            routers: [
                new RegExpRouter(),
                new TrieRouter()
            ]
        });
    }
};

// src/server.ts
function _class_private_field_loose_base$1(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id$1 = 0;
function _class_private_field_loose_key$1(name) {
    return "__private_" + id$1++ + "_" + name;
}
let _getResponseCache;
var _body, _init;
var RequestError = class extends Error {
    constructor(message, options){
        super(message, options);
        this.name = "RequestError";
    }
};
var toRequestError = (e)=>{
    if (e instanceof RequestError) {
        return e;
    }
    return new RequestError(e.message, {
        cause: e
    });
};
var GlobalRequest = global.Request;
var Request$1 = class Request extends GlobalRequest {
    constructor(input, options){
        if (typeof input === "object" && getRequestCache in input) {
            input = input[getRequestCache]();
        }
        if (typeof options?.body?.getReader !== "undefined") {
            var _options;
            (_options = options).duplex ?? (_options.duplex = "half");
        }
        super(input, options);
    }
};
var wrapBodyStream = Symbol("wrapBodyStream");
var newRequestFromIncoming = (method, url, incoming, abortController)=>{
    const headerRecord = [];
    const rawHeaders = incoming.rawHeaders;
    for(let i = 0; i < rawHeaders.length; i += 2){
        const { [i]: key, [i + 1]: value } = rawHeaders;
        if (key.charCodeAt(0) !== /*:*/ 58) {
            headerRecord.push([
                key,
                value
            ]);
        }
    }
    const init = {
        method,
        headers: headerRecord,
        signal: abortController.signal
    };
    if (method === "TRACE") {
        init.method = "GET";
        const req = new Request$1(url, init);
        Object.defineProperty(req, "method", {
            get () {
                return "TRACE";
            }
        });
        return req;
    }
    if (!(method === "GET" || method === "HEAD")) {
        if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) {
            init.body = new ReadableStream({
                start (controller) {
                    controller.enqueue(incoming.rawBody);
                    controller.close();
                }
            });
        } else if (incoming[wrapBodyStream]) {
            let reader;
            init.body = new ReadableStream({
                async pull (controller) {
                    try {
                        reader || (reader = Readable.toWeb(incoming).getReader());
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.close();
                        } else {
                            controller.enqueue(value);
                        }
                    } catch (error) {
                        controller.error(error);
                    }
                }
            });
        } else {
            init.body = Readable.toWeb(incoming);
        }
    }
    return new Request$1(url, init);
};
var getRequestCache = Symbol("getRequestCache");
var requestCache = Symbol("requestCache");
var incomingKey = Symbol("incomingKey");
var urlKey = Symbol("urlKey");
var abortControllerKey = Symbol("abortControllerKey");
var getAbortController = Symbol("getAbortController");
var requestPrototype = {
    get method () {
        return this[incomingKey].method || "GET";
    },
    get url () {
        return this[urlKey];
    },
    [getAbortController] () {
        this[getRequestCache]();
        return this[abortControllerKey];
    },
    [getRequestCache] () {
        var _abortControllerKey, _requestCache;
        this[_abortControllerKey = abortControllerKey] || (this[_abortControllerKey] = new AbortController());
        return this[_requestCache = requestCache] || (this[_requestCache] = newRequestFromIncoming(this.method, this[urlKey], this[incomingKey], this[abortControllerKey]));
    }
};
[
    "body",
    "bodyUsed",
    "cache",
    "credentials",
    "destination",
    "headers",
    "integrity",
    "mode",
    "redirect",
    "referrer",
    "referrerPolicy",
    "signal",
    "keepalive"
].forEach((k)=>{
    Object.defineProperty(requestPrototype, k, {
        get () {
            return this[getRequestCache]()[k];
        }
    });
});
[
    "arrayBuffer",
    "blob",
    "clone",
    "formData",
    "json",
    "text"
].forEach((k)=>{
    Object.defineProperty(requestPrototype, k, {
        value: function() {
            return this[getRequestCache]()[k]();
        }
    });
});
Object.setPrototypeOf(requestPrototype, Request$1.prototype);
var newRequest = (incoming, defaultHostname)=>{
    const req = Object.create(requestPrototype);
    req[incomingKey] = incoming;
    const incomingUrl = incoming.url || "";
    if (incomingUrl[0] !== "/" && // short-circuit for performance. most requests are relative URL.
    (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
        if (incoming instanceof Http2ServerRequest) {
            throw new RequestError("Absolute URL for :path is not allowed in HTTP/2");
        }
        try {
            const url2 = new URL(incomingUrl);
            req[urlKey] = url2.href;
        } catch (e) {
            throw new RequestError("Invalid absolute URL", {
                cause: e
            });
        }
        return req;
    }
    const host = (incoming instanceof Http2ServerRequest ? incoming.authority : incoming.headers.host) || defaultHostname;
    if (!host) {
        throw new RequestError("Missing host header");
    }
    let scheme;
    if (incoming instanceof Http2ServerRequest) {
        scheme = incoming.scheme;
        if (!(scheme === "http" || scheme === "https")) {
            throw new RequestError("Unsupported scheme");
        }
    } else {
        scheme = incoming.socket && incoming.socket.encrypted ? "https" : "http";
    }
    const url = new URL(`${scheme}://${host}${incomingUrl}`);
    if (url.hostname.length !== host.length && url.hostname !== host.replace(/:\d+$/, "")) {
        throw new RequestError("Invalid host header");
    }
    req[urlKey] = url.href;
    return req;
};
// src/response.ts
var responseCache = Symbol("responseCache");
var getResponseCache = Symbol("getResponseCache");
var cacheKey = Symbol("cache");
var GlobalResponse = global.Response;
var Response2 = (_body = /*#__PURE__*/ _class_private_field_loose_key$1("_body"), _init = /*#__PURE__*/ _class_private_field_loose_key$1("_init"), _getResponseCache = getResponseCache, class _Response {
    [_getResponseCache]() {
        var _responseCache;
        delete this[cacheKey];
        return this[_responseCache = responseCache] || (this[_responseCache] = new GlobalResponse(_class_private_field_loose_base$1(this, _body)[_body], _class_private_field_loose_base$1(this, _init)[_init]));
    }
    get headers() {
        const cache = this[cacheKey];
        if (cache) {
            if (!(cache[2] instanceof Headers)) {
                cache[2] = new Headers(cache[2]);
            }
            return cache[2];
        }
        return this[getResponseCache]().headers;
    }
    get status() {
        return this[cacheKey]?.[0] ?? this[getResponseCache]().status;
    }
    get ok() {
        const status = this.status;
        return status >= 200 && status < 300;
    }
    constructor(body, init){
        Object.defineProperty(this, _body, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _init, {
            writable: true,
            value: void 0
        });
        let headers;
        _class_private_field_loose_base$1(this, _body)[_body] = body;
        if (init instanceof _Response) {
            const cachedGlobalResponse = init[responseCache];
            if (cachedGlobalResponse) {
                _class_private_field_loose_base$1(this, _init)[_init] = cachedGlobalResponse;
                this[getResponseCache]();
                return;
            } else {
                _class_private_field_loose_base$1(this, _init)[_init] = _class_private_field_loose_base$1(init, _init)[_init];
                headers = new Headers(_class_private_field_loose_base$1(init, _init)[_init].headers);
            }
        } else {
            _class_private_field_loose_base$1(this, _init)[_init] = init;
        }
        if (typeof body === "string" || typeof body?.getReader !== "undefined" || body instanceof Blob || body instanceof Uint8Array) {
            headers || (headers = init?.headers || {
                "content-type": "text/plain; charset=UTF-8"
            });
            this[cacheKey] = [
                init?.status || 200,
                body,
                headers
            ];
        }
    }
});
[
    "body",
    "bodyUsed",
    "redirected",
    "statusText",
    "trailers",
    "type",
    "url"
].forEach((k)=>{
    Object.defineProperty(Response2.prototype, k, {
        get () {
            return this[getResponseCache]()[k];
        }
    });
});
[
    "arrayBuffer",
    "blob",
    "clone",
    "formData",
    "json",
    "text"
].forEach((k)=>{
    Object.defineProperty(Response2.prototype, k, {
        value: function() {
            return this[getResponseCache]()[k]();
        }
    });
});
Object.setPrototypeOf(Response2, GlobalResponse);
Object.setPrototypeOf(Response2.prototype, GlobalResponse.prototype);
// src/utils.ts
function writeFromReadableStream(stream, writable) {
    if (stream.locked) {
        throw new TypeError("ReadableStream is locked.");
    } else if (writable.destroyed) {
        return;
    }
    const reader = stream.getReader();
    const handleError = ()=>{};
    writable.on("error", handleError);
    reader.read().then(flow, handleStreamError);
    return reader.closed.finally(()=>{
        writable.off("error", handleError);
    });
    function handleStreamError(error) {
        if (error) {
            writable.destroy(error);
        }
    }
    function onDrain() {
        reader.read().then(flow, handleStreamError);
    }
    function flow({ done, value }) {
        try {
            if (done) {
                writable.end();
            } else if (!writable.write(value)) {
                writable.once("drain", onDrain);
            } else {
                return reader.read().then(flow, handleStreamError);
            }
        } catch (e) {
            handleStreamError(e);
        }
    }
}
var buildOutgoingHttpHeaders = (headers)=>{
    var _res, _contenttype;
    const res = {};
    if (!(headers instanceof Headers)) {
        headers = new Headers(headers ?? void 0);
    }
    const cookies = [];
    for (const [k, v] of headers){
        if (k === "set-cookie") {
            cookies.push(v);
        } else {
            res[k] = v;
        }
    }
    if (cookies.length > 0) {
        res["set-cookie"] = cookies;
    }
    (_res = res)[_contenttype = "content-type"] ?? (_res[_contenttype] = "text/plain; charset=UTF-8");
    return res;
};
// src/utils/response/constants.ts
var X_ALREADY_SENT = "x-hono-already-sent";
var webFetch = global.fetch;
if (typeof global.crypto === "undefined") {
    global.crypto = crypto;
}
global.fetch = (info, init)=>{
    init = {
        // Disable compression handling so people can return the result of a fetch
        // directly in the loader without messing with the Content-Encoding header.
        compress: false,
        ...init
    };
    return webFetch(info, init);
};
// src/listener.ts
var outgoingEnded = Symbol("outgoingEnded");
var regBuffer = /^no$/i;
var regContentType = /^(application\/json\b|text\/(?!event-stream\b))/i;
var handleRequestError = ()=>new Response(null, {
        status: 400
    });
var handleFetchError = (e)=>new Response(null, {
        status: e instanceof Error && (e.name === "TimeoutError" || e.constructor.name === "TimeoutError") ? 504 : 500
    });
var handleResponseError = (e, outgoing)=>{
    const err = e instanceof Error ? e : new Error("unknown error", {
        cause: e
    });
    if (err.code === "ERR_STREAM_PREMATURE_CLOSE") {
        console.info("The user aborted a request.");
    } else {
        console.error(e);
        if (!outgoing.headersSent) {
            outgoing.writeHead(500, {
                "Content-Type": "text/plain"
            });
        }
        outgoing.end(`Error: ${err.message}`);
        outgoing.destroy(err);
    }
};
var flushHeaders = (outgoing)=>{
    if ("flushHeaders" in outgoing && outgoing.writable) {
        outgoing.flushHeaders();
    }
};
var responseViaCache = async (res, outgoing)=>{
    let [status, body, header] = res[cacheKey];
    if (header instanceof Headers) {
        header = buildOutgoingHttpHeaders(header);
    }
    if (typeof body === "string") {
        header["Content-Length"] = Buffer.byteLength(body);
    } else if (body instanceof Uint8Array) {
        header["Content-Length"] = body.byteLength;
    } else if (body instanceof Blob) {
        header["Content-Length"] = body.size;
    }
    outgoing.writeHead(status, header);
    if (typeof body === "string" || body instanceof Uint8Array) {
        outgoing.end(body);
    } else if (body instanceof Blob) {
        outgoing.end(new Uint8Array(await body.arrayBuffer()));
    } else {
        flushHeaders(outgoing);
        await writeFromReadableStream(body, outgoing)?.catch((e)=>handleResponseError(e, outgoing));
    }
    outgoing[outgoingEnded]?.();
};
var responseViaResponseObject = async (res, outgoing, options = {})=>{
    if (res instanceof Promise) {
        if (options.errorHandler) {
            try {
                res = await res;
            } catch (err) {
                const errRes = await options.errorHandler(err);
                if (!errRes) {
                    return;
                }
                res = errRes;
            }
        } else {
            res = await res.catch(handleFetchError);
        }
    }
    if (cacheKey in res) {
        return responseViaCache(res, outgoing);
    }
    const resHeaderRecord = buildOutgoingHttpHeaders(res.headers);
    if (res.body) {
        const { "transfer-encoding": transferEncoding, "content-encoding": contentEncoding, "content-length": contentLength, "x-accel-buffering": accelBuffering, "content-type": contentType } = resHeaderRecord;
        if (transferEncoding || contentEncoding || contentLength || // nginx buffering variant
        accelBuffering && regBuffer.test(accelBuffering) || !regContentType.test(contentType)) {
            outgoing.writeHead(res.status, resHeaderRecord);
            flushHeaders(outgoing);
            await writeFromReadableStream(res.body, outgoing);
        } else {
            const buffer = await res.arrayBuffer();
            resHeaderRecord["content-length"] = buffer.byteLength;
            outgoing.writeHead(res.status, resHeaderRecord);
            outgoing.end(new Uint8Array(buffer));
        }
    } else if (resHeaderRecord[X_ALREADY_SENT]) ; else {
        outgoing.writeHead(res.status, resHeaderRecord);
        outgoing.end();
    }
    outgoing[outgoingEnded]?.();
};
var getRequestListener = (fetchCallback, options = {})=>{
    const autoCleanupIncoming = options.autoCleanupIncoming ?? true;
    if (options.overrideGlobalObjects !== false && global.Request !== Request$1) {
        Object.defineProperty(global, "Request", {
            value: Request$1
        });
        Object.defineProperty(global, "Response", {
            value: Response2
        });
    }
    return async (incoming, outgoing)=>{
        let res, req;
        try {
            req = newRequest(incoming, options.hostname);
            let incomingEnded = !autoCleanupIncoming || incoming.method === "GET" || incoming.method === "HEAD";
            if (!incomingEnded) {
                ;
                incoming[wrapBodyStream] = true;
                incoming.on("end", ()=>{
                    incomingEnded = true;
                });
                if (incoming instanceof Http2ServerRequest) {
                    ;
                    outgoing[outgoingEnded] = ()=>{
                        if (!incomingEnded) {
                            setTimeout(()=>{
                                if (!incomingEnded) {
                                    setTimeout(()=>{
                                        incoming.destroy();
                                        outgoing.destroy();
                                    });
                                }
                            });
                        }
                    };
                }
            }
            outgoing.on("close", ()=>{
                const abortController = req[abortControllerKey];
                if (abortController) {
                    if (incoming.errored) {
                        req[abortControllerKey].abort(incoming.errored.toString());
                    } else if (!outgoing.writableFinished) {
                        req[abortControllerKey].abort("Client connection prematurely closed.");
                    }
                }
                if (!incomingEnded) {
                    setTimeout(()=>{
                        if (!incomingEnded) {
                            setTimeout(()=>{
                                incoming.destroy();
                            });
                        }
                    });
                }
            });
            res = fetchCallback(req, {
                incoming,
                outgoing
            });
            if (cacheKey in res) {
                return responseViaCache(res, outgoing);
            }
        } catch (e) {
            if (!res) {
                if (options.errorHandler) {
                    res = await options.errorHandler(req ? e : toRequestError(e));
                    if (!res) {
                        return;
                    }
                } else if (!req) {
                    res = handleRequestError();
                } else {
                    res = handleFetchError(e);
                }
            } else {
                return handleResponseError(e, outgoing);
            }
        }
        try {
            return await responseViaResponseObject(res, outgoing, options);
        } catch (e) {
            return handleResponseError(e, outgoing);
        }
    };
};
// src/server.ts
var createAdaptorServer = (options)=>{
    const fetchCallback = options.fetch;
    const requestListener = getRequestListener(fetchCallback, {
        hostname: options.hostname,
        overrideGlobalObjects: options.overrideGlobalObjects,
        autoCleanupIncoming: options.autoCleanupIncoming
    });
    const createServer$1 = options.createServer || createServer;
    const server = createServer$1(options.serverOptions || {}, requestListener);
    return server;
};
var serve = (options, listeningListener)=>{
    const server = createAdaptorServer(options);
    server.listen(options?.port, options.hostname, ()=>{
        const serverInfo = server.address();
        listeningListener && listeningListener(serverInfo);
    });
    return server;
};

// src/helper/websocket/index.ts
var defineWebSocketHelper = (handler)=>{
    return (...args)=>{
        if (typeof args[0] === "function") {
            const [createEvents, options] = args;
            return async function upgradeWebSocket(c, next) {
                const events = await createEvents(c);
                const result = await handler(c, events, options);
                if (result) {
                    return result;
                }
                await next();
            };
        } else {
            const [c, events, options] = args;
            return (async ()=>{
                const upgraded = await handler(c, events, options);
                if (!upgraded) {
                    throw new Error("Failed to upgrade WebSocket");
                }
                return upgraded;
            })();
        }
    };
};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var stream;
var hasRequiredStream;

function requireStream () {
	if (hasRequiredStream) return stream;
	hasRequiredStream = 1;
	const { Duplex } = require$$0;
	/**
	 * Emits the `'close'` event on a stream.
	 *
	 * @param {Duplex} stream The stream.
	 * @private
	 */ function emitClose(stream) {
	    stream.emit('close');
	}
	/**
	 * The listener of the `'end'` event.
	 *
	 * @private
	 */ function duplexOnEnd() {
	    if (!this.destroyed && this._writableState.finished) {
	        this.destroy();
	    }
	}
	/**
	 * The listener of the `'error'` event.
	 *
	 * @param {Error} err The error
	 * @private
	 */ function duplexOnError(err) {
	    this.removeListener('error', duplexOnError);
	    this.destroy();
	    if (this.listenerCount('error') === 0) {
	        // Do not suppress the throwing behavior.
	        this.emit('error', err);
	    }
	}
	/**
	 * Wraps a `WebSocket` in a duplex stream.
	 *
	 * @param {WebSocket} ws The `WebSocket` to wrap
	 * @param {Object} [options] The options for the `Duplex` constructor
	 * @return {Duplex} The duplex stream
	 * @public
	 */ function createWebSocketStream(ws, options) {
	    let terminateOnDestroy = true;
	    const duplex = new Duplex({
	        ...options,
	        autoDestroy: false,
	        emitClose: false,
	        objectMode: false,
	        writableObjectMode: false
	    });
	    ws.on('message', function message(msg, isBinary) {
	        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
	        if (!duplex.push(data)) ws.pause();
	    });
	    ws.once('error', function error(err) {
	        if (duplex.destroyed) return;
	        // Prevent `ws.terminate()` from being called by `duplex._destroy()`.
	        //
	        // - If the `'error'` event is emitted before the `'open'` event, then
	        //   `ws.terminate()` is a noop as no socket is assigned.
	        // - Otherwise, the error is re-emitted by the listener of the `'error'`
	        //   event of the `Receiver` object. The listener already closes the
	        //   connection by calling `ws.close()`. This allows a close frame to be
	        //   sent to the other peer. If `ws.terminate()` is called right after this,
	        //   then the close frame might not be sent.
	        terminateOnDestroy = false;
	        duplex.destroy(err);
	    });
	    ws.once('close', function close() {
	        if (duplex.destroyed) return;
	        duplex.push(null);
	    });
	    duplex._destroy = function(err, callback) {
	        if (ws.readyState === ws.CLOSED) {
	            callback(err);
	            process.nextTick(emitClose, duplex);
	            return;
	        }
	        let called = false;
	        ws.once('error', function error(err) {
	            called = true;
	            callback(err);
	        });
	        ws.once('close', function close() {
	            if (!called) callback(err);
	            process.nextTick(emitClose, duplex);
	        });
	        if (terminateOnDestroy) ws.terminate();
	    };
	    duplex._final = function(callback) {
	        if (ws.readyState === ws.CONNECTING) {
	            ws.once('open', function open() {
	                duplex._final(callback);
	            });
	            return;
	        }
	        // If the value of the `_socket` property is `null` it means that `ws` is a
	        // client websocket and the handshake failed. In fact, when this happens, a
	        // socket is never assigned to the websocket. Wait for the `'error'` event
	        // that will be emitted by the websocket.
	        if (ws._socket === null) return;
	        if (ws._socket._writableState.finished) {
	            callback();
	            if (duplex._readableState.endEmitted) duplex.destroy();
	        } else {
	            ws._socket.once('finish', function finish() {
	                // `duplex` is not destroyed here because the `'end'` event will be
	                // emitted on `duplex` after this `'finish'` event. The EOF signaling
	                // `null` chunk is, in fact, pushed when the websocket emits `'close'`.
	                callback();
	            });
	            ws.close();
	        }
	    };
	    duplex._read = function() {
	        if (ws.isPaused) ws.resume();
	    };
	    duplex._write = function(chunk, encoding, callback) {
	        if (ws.readyState === ws.CONNECTING) {
	            ws.once('open', function open() {
	                duplex._write(chunk, encoding, callback);
	            });
	            return;
	        }
	        ws.send(chunk, callback);
	    };
	    duplex.on('end', duplexOnEnd);
	    duplex.on('error', duplexOnError);
	    return duplex;
	}
	stream = createWebSocketStream;
	return stream;
}

requireStream();

var bufferUtil = {exports: {}};

var constants;
var hasRequiredConstants;

function requireConstants () {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;
	constants = {
	    BINARY_TYPES: [
	        'nodebuffer',
	        'arraybuffer',
	        'fragments'
	    ],
	    EMPTY_BUFFER: Buffer.alloc(0),
	    GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
	    kForOnEventAttribute: Symbol('kIsForOnEventAttribute'),
	    kListener: Symbol('kListener'),
	    kStatusCode: Symbol('status-code'),
	    kWebSocket: Symbol('websocket'),
	    NOOP: ()=>{}
	};
	return constants;
}

var hasRequiredBufferUtil;

function requireBufferUtil () {
	if (hasRequiredBufferUtil) return bufferUtil.exports;
	hasRequiredBufferUtil = 1;
	const { EMPTY_BUFFER } = requireConstants();
	const FastBuffer = Buffer[Symbol.species];
	/**
	 * Merges an array of buffers into a new buffer.
	 *
	 * @param {Buffer[]} list The array of buffers to concat
	 * @param {Number} totalLength The total length of buffers in the list
	 * @return {Buffer} The resulting buffer
	 * @public
	 */ function concat(list, totalLength) {
	    if (list.length === 0) return EMPTY_BUFFER;
	    if (list.length === 1) return list[0];
	    const target = Buffer.allocUnsafe(totalLength);
	    let offset = 0;
	    for(let i = 0; i < list.length; i++){
	        const buf = list[i];
	        target.set(buf, offset);
	        offset += buf.length;
	    }
	    if (offset < totalLength) {
	        return new FastBuffer(target.buffer, target.byteOffset, offset);
	    }
	    return target;
	}
	/**
	 * Masks a buffer using the given mask.
	 *
	 * @param {Buffer} source The buffer to mask
	 * @param {Buffer} mask The mask to use
	 * @param {Buffer} output The buffer where to store the result
	 * @param {Number} offset The offset at which to start writing
	 * @param {Number} length The number of bytes to mask.
	 * @public
	 */ function _mask(source, mask, output, offset, length) {
	    for(let i = 0; i < length; i++){
	        output[offset + i] = source[i] ^ mask[i & 3];
	    }
	}
	/**
	 * Unmasks a buffer using the given mask.
	 *
	 * @param {Buffer} buffer The buffer to unmask
	 * @param {Buffer} mask The mask to use
	 * @public
	 */ function _unmask(buffer, mask) {
	    for(let i = 0; i < buffer.length; i++){
	        buffer[i] ^= mask[i & 3];
	    }
	}
	/**
	 * Converts a buffer to an `ArrayBuffer`.
	 *
	 * @param {Buffer} buf The buffer to convert
	 * @return {ArrayBuffer} Converted buffer
	 * @public
	 */ function toArrayBuffer(buf) {
	    if (buf.length === buf.buffer.byteLength) {
	        return buf.buffer;
	    }
	    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
	}
	/**
	 * Converts `data` to a `Buffer`.
	 *
	 * @param {*} data The data to convert
	 * @return {Buffer} The buffer
	 * @throws {TypeError}
	 * @public
	 */ function toBuffer(data) {
	    toBuffer.readOnly = true;
	    if (Buffer.isBuffer(data)) return data;
	    let buf;
	    if (data instanceof ArrayBuffer) {
	        buf = new FastBuffer(data);
	    } else if (ArrayBuffer.isView(data)) {
	        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
	    } else {
	        buf = Buffer.from(data);
	        toBuffer.readOnly = false;
	    }
	    return buf;
	}
	bufferUtil.exports = {
	    concat,
	    mask: _mask,
	    toArrayBuffer,
	    toBuffer,
	    unmask: _unmask
	};
	/* istanbul ignore else  */ if (!process.env.WS_NO_BUFFER_UTIL) {
	    try {
	        const bufferUtil$1 = require('bufferutil');
	        bufferUtil.exports.mask = function(source, mask, output, offset, length) {
	            if (length < 48) _mask(source, mask, output, offset, length);
	            else bufferUtil$1.mask(source, mask, output, offset, length);
	        };
	        bufferUtil.exports.unmask = function(buffer, mask) {
	            if (buffer.length < 32) _unmask(buffer, mask);
	            else bufferUtil$1.unmask(buffer, mask);
	        };
	    } catch (e) {
	    // Continue regardless of the error.
	    }
	}
	return bufferUtil.exports;
}

var limiter;
var hasRequiredLimiter;

function requireLimiter () {
	if (hasRequiredLimiter) return limiter;
	hasRequiredLimiter = 1;
	const kDone = Symbol('kDone');
	const kRun = Symbol('kRun');
	/**
	 * A very simple job queue with adjustable concurrency. Adapted from
	 * https://github.com/STRML/async-limiter
	 */ class Limiter {
	    /**
	   * Adds a job to the queue.
	   *
	   * @param {Function} job The job to run
	   * @public
	   */ add(job) {
	        this.jobs.push(job);
	        this[kRun]();
	    }
	    /**
	   * Removes a job from the queue and runs it if possible.
	   *
	   * @private
	   */ [kRun]() {
	        if (this.pending === this.concurrency) return;
	        if (this.jobs.length) {
	            const job = this.jobs.shift();
	            this.pending++;
	            job(this[kDone]);
	        }
	    }
	    /**
	   * Creates a new `Limiter`.
	   *
	   * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
	   *     to run concurrently
	   */ constructor(concurrency){
	        this[kDone] = ()=>{
	            this.pending--;
	            this[kRun]();
	        };
	        this.concurrency = concurrency || Infinity;
	        this.jobs = [];
	        this.pending = 0;
	    }
	}
	limiter = Limiter;
	return limiter;
}

var permessageDeflate;
var hasRequiredPermessageDeflate;

function requirePermessageDeflate () {
	if (hasRequiredPermessageDeflate) return permessageDeflate;
	hasRequiredPermessageDeflate = 1;
	const zlib = require$$0$1;
	const bufferUtil = requireBufferUtil();
	const Limiter = requireLimiter();
	const { kStatusCode } = requireConstants();
	const FastBuffer = Buffer[Symbol.species];
	const TRAILER = Buffer.from([
	    0x00,
	    0x00,
	    0xff,
	    0xff
	]);
	const kPerMessageDeflate = Symbol('permessage-deflate');
	const kTotalLength = Symbol('total-length');
	const kCallback = Symbol('callback');
	const kBuffers = Symbol('buffers');
	const kError = Symbol('error');
	//
	// We limit zlib concurrency, which prevents severe memory fragmentation
	// as documented in https://github.com/nodejs/node/issues/8871#issuecomment-250915913
	// and https://github.com/websockets/ws/issues/1202
	//
	// Intentionally global; it's the global thread pool that's an issue.
	//
	let zlibLimiter;
	/**
	 * permessage-deflate implementation.
	 */ class PerMessageDeflate {
	    /**
	   * @type {String}
	   */ static get extensionName() {
	        return 'permessage-deflate';
	    }
	    /**
	   * Create an extension negotiation offer.
	   *
	   * @return {Object} Extension parameters
	   * @public
	   */ offer() {
	        const params = {};
	        if (this._options.serverNoContextTakeover) {
	            params.server_no_context_takeover = true;
	        }
	        if (this._options.clientNoContextTakeover) {
	            params.client_no_context_takeover = true;
	        }
	        if (this._options.serverMaxWindowBits) {
	            params.server_max_window_bits = this._options.serverMaxWindowBits;
	        }
	        if (this._options.clientMaxWindowBits) {
	            params.client_max_window_bits = this._options.clientMaxWindowBits;
	        } else if (this._options.clientMaxWindowBits == null) {
	            params.client_max_window_bits = true;
	        }
	        return params;
	    }
	    /**
	   * Accept an extension negotiation offer/response.
	   *
	   * @param {Array} configurations The extension negotiation offers/reponse
	   * @return {Object} Accepted configuration
	   * @public
	   */ accept(configurations) {
	        configurations = this.normalizeParams(configurations);
	        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
	        return this.params;
	    }
	    /**
	   * Releases all resources used by the extension.
	   *
	   * @public
	   */ cleanup() {
	        if (this._inflate) {
	            this._inflate.close();
	            this._inflate = null;
	        }
	        if (this._deflate) {
	            const callback = this._deflate[kCallback];
	            this._deflate.close();
	            this._deflate = null;
	            if (callback) {
	                callback(new Error('The deflate stream was closed while data was being processed'));
	            }
	        }
	    }
	    /**
	   *  Accept an extension negotiation offer.
	   *
	   * @param {Array} offers The extension negotiation offers
	   * @return {Object} Accepted configuration
	   * @private
	   */ acceptAsServer(offers) {
	        const opts = this._options;
	        const accepted = offers.find((params)=>{
	            if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === 'number' && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === 'number' && !params.client_max_window_bits) {
	                return false;
	            }
	            return true;
	        });
	        if (!accepted) {
	            throw new Error('None of the extension offers can be accepted');
	        }
	        if (opts.serverNoContextTakeover) {
	            accepted.server_no_context_takeover = true;
	        }
	        if (opts.clientNoContextTakeover) {
	            accepted.client_no_context_takeover = true;
	        }
	        if (typeof opts.serverMaxWindowBits === 'number') {
	            accepted.server_max_window_bits = opts.serverMaxWindowBits;
	        }
	        if (typeof opts.clientMaxWindowBits === 'number') {
	            accepted.client_max_window_bits = opts.clientMaxWindowBits;
	        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
	            delete accepted.client_max_window_bits;
	        }
	        return accepted;
	    }
	    /**
	   * Accept the extension negotiation response.
	   *
	   * @param {Array} response The extension negotiation response
	   * @return {Object} Accepted configuration
	   * @private
	   */ acceptAsClient(response) {
	        const params = response[0];
	        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
	            throw new Error('Unexpected parameter "client_no_context_takeover"');
	        }
	        if (!params.client_max_window_bits) {
	            if (typeof this._options.clientMaxWindowBits === 'number') {
	                params.client_max_window_bits = this._options.clientMaxWindowBits;
	            }
	        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === 'number' && params.client_max_window_bits > this._options.clientMaxWindowBits) {
	            throw new Error('Unexpected or invalid parameter "client_max_window_bits"');
	        }
	        return params;
	    }
	    /**
	   * Normalize parameters.
	   *
	   * @param {Array} configurations The extension negotiation offers/reponse
	   * @return {Array} The offers/response with normalized parameters
	   * @private
	   */ normalizeParams(configurations) {
	        configurations.forEach((params)=>{
	            Object.keys(params).forEach((key)=>{
	                let value = params[key];
	                if (value.length > 1) {
	                    throw new Error(`Parameter "${key}" must have only a single value`);
	                }
	                value = value[0];
	                if (key === 'client_max_window_bits') {
	                    if (value !== true) {
	                        const num = +value;
	                        if (!Number.isInteger(num) || num < 8 || num > 15) {
	                            throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
	                        }
	                        value = num;
	                    } else if (!this._isServer) {
	                        throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
	                    }
	                } else if (key === 'server_max_window_bits') {
	                    const num = +value;
	                    if (!Number.isInteger(num) || num < 8 || num > 15) {
	                        throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
	                    }
	                    value = num;
	                } else if (key === 'client_no_context_takeover' || key === 'server_no_context_takeover') {
	                    if (value !== true) {
	                        throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
	                    }
	                } else {
	                    throw new Error(`Unknown parameter "${key}"`);
	                }
	                params[key] = value;
	            });
	        });
	        return configurations;
	    }
	    /**
	   * Decompress data. Concurrency limited.
	   *
	   * @param {Buffer} data Compressed data
	   * @param {Boolean} fin Specifies whether or not this is the last fragment
	   * @param {Function} callback Callback
	   * @public
	   */ decompress(data, fin, callback) {
	        zlibLimiter.add((done)=>{
	            this._decompress(data, fin, (err, result)=>{
	                done();
	                callback(err, result);
	            });
	        });
	    }
	    /**
	   * Compress data. Concurrency limited.
	   *
	   * @param {(Buffer|String)} data Data to compress
	   * @param {Boolean} fin Specifies whether or not this is the last fragment
	   * @param {Function} callback Callback
	   * @public
	   */ compress(data, fin, callback) {
	        zlibLimiter.add((done)=>{
	            this._compress(data, fin, (err, result)=>{
	                done();
	                callback(err, result);
	            });
	        });
	    }
	    /**
	   * Decompress data.
	   *
	   * @param {Buffer} data Compressed data
	   * @param {Boolean} fin Specifies whether or not this is the last fragment
	   * @param {Function} callback Callback
	   * @private
	   */ _decompress(data, fin, callback) {
	        const endpoint = this._isServer ? 'client' : 'server';
	        if (!this._inflate) {
	            const key = `${endpoint}_max_window_bits`;
	            const windowBits = typeof this.params[key] !== 'number' ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
	            this._inflate = zlib.createInflateRaw({
	                ...this._options.zlibInflateOptions,
	                windowBits
	            });
	            this._inflate[kPerMessageDeflate] = this;
	            this._inflate[kTotalLength] = 0;
	            this._inflate[kBuffers] = [];
	            this._inflate.on('error', inflateOnError);
	            this._inflate.on('data', inflateOnData);
	        }
	        this._inflate[kCallback] = callback;
	        this._inflate.write(data);
	        if (fin) this._inflate.write(TRAILER);
	        this._inflate.flush(()=>{
	            const err = this._inflate[kError];
	            if (err) {
	                this._inflate.close();
	                this._inflate = null;
	                callback(err);
	                return;
	            }
	            const data = bufferUtil.concat(this._inflate[kBuffers], this._inflate[kTotalLength]);
	            if (this._inflate._readableState.endEmitted) {
	                this._inflate.close();
	                this._inflate = null;
	            } else {
	                this._inflate[kTotalLength] = 0;
	                this._inflate[kBuffers] = [];
	                if (fin && this.params[`${endpoint}_no_context_takeover`]) {
	                    this._inflate.reset();
	                }
	            }
	            callback(null, data);
	        });
	    }
	    /**
	   * Compress data.
	   *
	   * @param {(Buffer|String)} data Data to compress
	   * @param {Boolean} fin Specifies whether or not this is the last fragment
	   * @param {Function} callback Callback
	   * @private
	   */ _compress(data, fin, callback) {
	        const endpoint = this._isServer ? 'server' : 'client';
	        if (!this._deflate) {
	            const key = `${endpoint}_max_window_bits`;
	            const windowBits = typeof this.params[key] !== 'number' ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
	            this._deflate = zlib.createDeflateRaw({
	                ...this._options.zlibDeflateOptions,
	                windowBits
	            });
	            this._deflate[kTotalLength] = 0;
	            this._deflate[kBuffers] = [];
	            this._deflate.on('data', deflateOnData);
	        }
	        this._deflate[kCallback] = callback;
	        this._deflate.write(data);
	        this._deflate.flush(zlib.Z_SYNC_FLUSH, ()=>{
	            if (!this._deflate) {
	                //
	                // The deflate stream was closed while data was being processed.
	                //
	                return;
	            }
	            let data = bufferUtil.concat(this._deflate[kBuffers], this._deflate[kTotalLength]);
	            if (fin) {
	                data = new FastBuffer(data.buffer, data.byteOffset, data.length - 4);
	            }
	            //
	            // Ensure that the callback will not be called again in
	            // `PerMessageDeflate#cleanup()`.
	            //
	            this._deflate[kCallback] = null;
	            this._deflate[kTotalLength] = 0;
	            this._deflate[kBuffers] = [];
	            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
	                this._deflate.reset();
	            }
	            callback(null, data);
	        });
	    }
	    /**
	   * Creates a PerMessageDeflate instance.
	   *
	   * @param {Object} [options] Configuration options
	   * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
	   *     for, or request, a custom client window size
	   * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
	   *     acknowledge disabling of client context takeover
	   * @param {Number} [options.concurrencyLimit=10] The number of concurrent
	   *     calls to zlib
	   * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
	   *     use of a custom server window size
	   * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
	   *     disabling of server context takeover
	   * @param {Number} [options.threshold=1024] Size (in bytes) below which
	   *     messages should not be compressed if context takeover is disabled
	   * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
	   *     deflate
	   * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
	   *     inflate
	   * @param {Boolean} [isServer=false] Create the instance in either server or
	   *     client mode
	   * @param {Number} [maxPayload=0] The maximum allowed message length
	   */ constructor(options, isServer, maxPayload){
	        this._maxPayload = maxPayload | 0;
	        this._options = options || {};
	        this._threshold = this._options.threshold !== undefined ? this._options.threshold : 1024;
	        this._isServer = !!isServer;
	        this._deflate = null;
	        this._inflate = null;
	        this.params = null;
	        if (!zlibLimiter) {
	            const concurrency = this._options.concurrencyLimit !== undefined ? this._options.concurrencyLimit : 10;
	            zlibLimiter = new Limiter(concurrency);
	        }
	    }
	}
	permessageDeflate = PerMessageDeflate;
	/**
	 * The listener of the `zlib.DeflateRaw` stream `'data'` event.
	 *
	 * @param {Buffer} chunk A chunk of data
	 * @private
	 */ function deflateOnData(chunk) {
	    this[kBuffers].push(chunk);
	    this[kTotalLength] += chunk.length;
	}
	/**
	 * The listener of the `zlib.InflateRaw` stream `'data'` event.
	 *
	 * @param {Buffer} chunk A chunk of data
	 * @private
	 */ function inflateOnData(chunk) {
	    this[kTotalLength] += chunk.length;
	    if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
	        this[kBuffers].push(chunk);
	        return;
	    }
	    this[kError] = new RangeError('Max payload size exceeded');
	    this[kError].code = 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH';
	    this[kError][kStatusCode] = 1009;
	    this.removeListener('data', inflateOnData);
	    this.reset();
	}
	/**
	 * The listener of the `zlib.InflateRaw` stream `'error'` event.
	 *
	 * @param {Error} err The emitted error
	 * @private
	 */ function inflateOnError(err) {
	    //
	    // There is no need to call `Zlib#close()` as the handle is automatically
	    // closed when an error is emitted.
	    //
	    this[kPerMessageDeflate]._inflate = null;
	    err[kStatusCode] = 1007;
	    this[kCallback](err);
	}
	return permessageDeflate;
}

var validation = {exports: {}};

var hasRequiredValidation;

function requireValidation () {
	if (hasRequiredValidation) return validation.exports;
	hasRequiredValidation = 1;
	const { isUtf8 } = require$$0$2;
	//
	// Allowed token characters:
	//
	// '!', '#', '$', '%', '&', ''', '*', '+', '-',
	// '.', 0-9, A-Z, '^', '_', '`', a-z, '|', '~'
	//
	// tokenChars[32] === 0 // ' '
	// tokenChars[33] === 1 // '!'
	// tokenChars[34] === 0 // '"'
	// ...
	//
	// prettier-ignore
	const tokenChars = [
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    1,
	    0,
	    1,
	    1,
	    1,
	    1,
	    1,
	    0,
	    0,
	    1,
	    1,
	    0,
	    1,
	    1,
	    0,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    0,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    0,
	    0,
	    0,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    1,
	    0,
	    1,
	    0,
	    1,
	    0 // 112 - 127
	];
	/**
	 * Checks if a status code is allowed in a close frame.
	 *
	 * @param {Number} code The status code
	 * @return {Boolean} `true` if the status code is valid, else `false`
	 * @public
	 */ function isValidStatusCode(code) {
	    return code >= 1000 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3000 && code <= 4999;
	}
	/**
	 * Checks if a given buffer contains only correct UTF-8.
	 * Ported from https://www.cl.cam.ac.uk/%7Emgk25/ucs/utf8_check.c by
	 * Markus Kuhn.
	 *
	 * @param {Buffer} buf The buffer to check
	 * @return {Boolean} `true` if `buf` contains only correct UTF-8, else `false`
	 * @public
	 */ function _isValidUTF8(buf) {
	    const len = buf.length;
	    let i = 0;
	    while(i < len){
	        if ((buf[i] & 0x80) === 0) {
	            // 0xxxxxxx
	            i++;
	        } else if ((buf[i] & 0xe0) === 0xc0) {
	            // 110xxxxx 10xxxxxx
	            if (i + 1 === len || (buf[i + 1] & 0xc0) !== 0x80 || (buf[i] & 0xfe) === 0xc0 // Overlong
	            ) {
	                return false;
	            }
	            i += 2;
	        } else if ((buf[i] & 0xf0) === 0xe0) {
	            // 1110xxxx 10xxxxxx 10xxxxxx
	            if (i + 2 >= len || (buf[i + 1] & 0xc0) !== 0x80 || (buf[i + 2] & 0xc0) !== 0x80 || buf[i] === 0xe0 && (buf[i + 1] & 0xe0) === 0x80 || // Overlong
	            buf[i] === 0xed && (buf[i + 1] & 0xe0) === 0xa0 // Surrogate (U+D800 - U+DFFF)
	            ) {
	                return false;
	            }
	            i += 3;
	        } else if ((buf[i] & 0xf8) === 0xf0) {
	            // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
	            if (i + 3 >= len || (buf[i + 1] & 0xc0) !== 0x80 || (buf[i + 2] & 0xc0) !== 0x80 || (buf[i + 3] & 0xc0) !== 0x80 || buf[i] === 0xf0 && (buf[i + 1] & 0xf0) === 0x80 || // Overlong
	            buf[i] === 0xf4 && buf[i + 1] > 0x8f || buf[i] > 0xf4 // > U+10FFFF
	            ) {
	                return false;
	            }
	            i += 4;
	        } else {
	            return false;
	        }
	    }
	    return true;
	}
	validation.exports = {
	    isValidStatusCode,
	    isValidUTF8: _isValidUTF8,
	    tokenChars
	};
	if (isUtf8) {
	    validation.exports.isValidUTF8 = function(buf) {
	        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
	    };
	} else if (!process.env.WS_NO_UTF_8_VALIDATE) {
	    try {
	        const isValidUTF8 = require('utf-8-validate');
	        validation.exports.isValidUTF8 = function(buf) {
	            return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
	        };
	    } catch (e) {
	    // Continue regardless of the error.
	    }
	}
	return validation.exports;
}

var receiver;
var hasRequiredReceiver;

function requireReceiver () {
	if (hasRequiredReceiver) return receiver;
	hasRequiredReceiver = 1;
	const { Writable } = require$$0;
	const PerMessageDeflate = requirePermessageDeflate();
	const { BINARY_TYPES, EMPTY_BUFFER, kStatusCode, kWebSocket } = requireConstants();
	const { concat, toArrayBuffer, unmask } = requireBufferUtil();
	const { isValidStatusCode, isValidUTF8 } = requireValidation();
	const FastBuffer = Buffer[Symbol.species];
	const GET_INFO = 0;
	const GET_PAYLOAD_LENGTH_16 = 1;
	const GET_PAYLOAD_LENGTH_64 = 2;
	const GET_MASK = 3;
	const GET_DATA = 4;
	const INFLATING = 5;
	const DEFER_EVENT = 6;
	/**
	 * HyBi Receiver implementation.
	 *
	 * @extends Writable
	 */ class Receiver extends Writable {
	    /**
	   * Implements `Writable.prototype._write()`.
	   *
	   * @param {Buffer} chunk The chunk of data to write
	   * @param {String} encoding The character encoding of `chunk`
	   * @param {Function} cb Callback
	   * @private
	   */ _write(chunk, encoding, cb) {
	        if (this._opcode === 0x08 && this._state == GET_INFO) return cb();
	        this._bufferedBytes += chunk.length;
	        this._buffers.push(chunk);
	        this.startLoop(cb);
	    }
	    /**
	   * Consumes `n` bytes from the buffered data.
	   *
	   * @param {Number} n The number of bytes to consume
	   * @return {Buffer} The consumed bytes
	   * @private
	   */ consume(n) {
	        this._bufferedBytes -= n;
	        if (n === this._buffers[0].length) return this._buffers.shift();
	        if (n < this._buffers[0].length) {
	            const buf = this._buffers[0];
	            this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
	            return new FastBuffer(buf.buffer, buf.byteOffset, n);
	        }
	        const dst = Buffer.allocUnsafe(n);
	        do {
	            const buf = this._buffers[0];
	            const offset = dst.length - n;
	            if (n >= buf.length) {
	                dst.set(this._buffers.shift(), offset);
	            } else {
	                dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
	                this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
	            }
	            n -= buf.length;
	        }while (n > 0)
	        return dst;
	    }
	    /**
	   * Starts the parsing loop.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */ startLoop(cb) {
	        this._loop = true;
	        do {
	            switch(this._state){
	                case GET_INFO:
	                    this.getInfo(cb);
	                    break;
	                case GET_PAYLOAD_LENGTH_16:
	                    this.getPayloadLength16(cb);
	                    break;
	                case GET_PAYLOAD_LENGTH_64:
	                    this.getPayloadLength64(cb);
	                    break;
	                case GET_MASK:
	                    this.getMask();
	                    break;
	                case GET_DATA:
	                    this.getData(cb);
	                    break;
	                case INFLATING:
	                case DEFER_EVENT:
	                    this._loop = false;
	                    return;
	            }
	        }while (this._loop)
	        if (!this._errored) cb();
	    }
	    /**
	   * Reads the first two bytes of a frame.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */ getInfo(cb) {
	        if (this._bufferedBytes < 2) {
	            this._loop = false;
	            return;
	        }
	        const buf = this.consume(2);
	        if ((buf[0] & 0x30) !== 0x00) {
	            const error = this.createError(RangeError, 'RSV2 and RSV3 must be clear', true, 1002, 'WS_ERR_UNEXPECTED_RSV_2_3');
	            cb(error);
	            return;
	        }
	        const compressed = (buf[0] & 0x40) === 0x40;
	        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
	            const error = this.createError(RangeError, 'RSV1 must be clear', true, 1002, 'WS_ERR_UNEXPECTED_RSV_1');
	            cb(error);
	            return;
	        }
	        this._fin = (buf[0] & 0x80) === 0x80;
	        this._opcode = buf[0] & 0x0f;
	        this._payloadLength = buf[1] & 0x7f;
	        if (this._opcode === 0x00) {
	            if (compressed) {
	                const error = this.createError(RangeError, 'RSV1 must be clear', true, 1002, 'WS_ERR_UNEXPECTED_RSV_1');
	                cb(error);
	                return;
	            }
	            if (!this._fragmented) {
	                const error = this.createError(RangeError, 'invalid opcode 0', true, 1002, 'WS_ERR_INVALID_OPCODE');
	                cb(error);
	                return;
	            }
	            this._opcode = this._fragmented;
	        } else if (this._opcode === 0x01 || this._opcode === 0x02) {
	            if (this._fragmented) {
	                const error = this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, 'WS_ERR_INVALID_OPCODE');
	                cb(error);
	                return;
	            }
	            this._compressed = compressed;
	        } else if (this._opcode > 0x07 && this._opcode < 0x0b) {
	            if (!this._fin) {
	                const error = this.createError(RangeError, 'FIN must be set', true, 1002, 'WS_ERR_EXPECTED_FIN');
	                cb(error);
	                return;
	            }
	            if (compressed) {
	                const error = this.createError(RangeError, 'RSV1 must be clear', true, 1002, 'WS_ERR_UNEXPECTED_RSV_1');
	                cb(error);
	                return;
	            }
	            if (this._payloadLength > 0x7d || this._opcode === 0x08 && this._payloadLength === 1) {
	                const error = this.createError(RangeError, `invalid payload length ${this._payloadLength}`, true, 1002, 'WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH');
	                cb(error);
	                return;
	            }
	        } else {
	            const error = this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, 'WS_ERR_INVALID_OPCODE');
	            cb(error);
	            return;
	        }
	        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
	        this._masked = (buf[1] & 0x80) === 0x80;
	        if (this._isServer) {
	            if (!this._masked) {
	                const error = this.createError(RangeError, 'MASK must be set', true, 1002, 'WS_ERR_EXPECTED_MASK');
	                cb(error);
	                return;
	            }
	        } else if (this._masked) {
	            const error = this.createError(RangeError, 'MASK must be clear', true, 1002, 'WS_ERR_UNEXPECTED_MASK');
	            cb(error);
	            return;
	        }
	        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
	        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
	        else this.haveLength(cb);
	    }
	    /**
	   * Gets extended payload length (7+16).
	   *
	   * @param {Function} cb Callback
	   * @private
	   */ getPayloadLength16(cb) {
	        if (this._bufferedBytes < 2) {
	            this._loop = false;
	            return;
	        }
	        this._payloadLength = this.consume(2).readUInt16BE(0);
	        this.haveLength(cb);
	    }
	    /**
	   * Gets extended payload length (7+64).
	   *
	   * @param {Function} cb Callback
	   * @private
	   */ getPayloadLength64(cb) {
	        if (this._bufferedBytes < 8) {
	            this._loop = false;
	            return;
	        }
	        const buf = this.consume(8);
	        const num = buf.readUInt32BE(0);
	        //
	        // The maximum safe integer in JavaScript is 2^53 - 1. An error is returned
	        // if payload length is greater than this number.
	        //
	        if (num > Math.pow(2, 53 - 32) - 1) {
	            const error = this.createError(RangeError, 'Unsupported WebSocket frame: payload length > 2^53 - 1', false, 1009, 'WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH');
	            cb(error);
	            return;
	        }
	        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
	        this.haveLength(cb);
	    }
	    /**
	   * Payload length has been read.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */ haveLength(cb) {
	        if (this._payloadLength && this._opcode < 0x08) {
	            this._totalPayloadLength += this._payloadLength;
	            if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
	                const error = this.createError(RangeError, 'Max payload size exceeded', false, 1009, 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH');
	                cb(error);
	                return;
	            }
	        }
	        if (this._masked) this._state = GET_MASK;
	        else this._state = GET_DATA;
	    }
	    /**
	   * Reads mask bytes.
	   *
	   * @private
	   */ getMask() {
	        if (this._bufferedBytes < 4) {
	            this._loop = false;
	            return;
	        }
	        this._mask = this.consume(4);
	        this._state = GET_DATA;
	    }
	    /**
	   * Reads data bytes.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */ getData(cb) {
	        let data = EMPTY_BUFFER;
	        if (this._payloadLength) {
	            if (this._bufferedBytes < this._payloadLength) {
	                this._loop = false;
	                return;
	            }
	            data = this.consume(this._payloadLength);
	            if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
	                unmask(data, this._mask);
	            }
	        }
	        if (this._opcode > 0x07) {
	            this.controlMessage(data, cb);
	            return;
	        }
	        if (this._compressed) {
	            this._state = INFLATING;
	            this.decompress(data, cb);
	            return;
	        }
	        if (data.length) {
	            //
	            // This message is not compressed so its length is the sum of the payload
	            // length of all fragments.
	            //
	            this._messageLength = this._totalPayloadLength;
	            this._fragments.push(data);
	        }
	        this.dataMessage(cb);
	    }
	    /**
	   * Decompresses data.
	   *
	   * @param {Buffer} data Compressed data
	   * @param {Function} cb Callback
	   * @private
	   */ decompress(data, cb) {
	        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
	        perMessageDeflate.decompress(data, this._fin, (err, buf)=>{
	            if (err) return cb(err);
	            if (buf.length) {
	                this._messageLength += buf.length;
	                if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
	                    const error = this.createError(RangeError, 'Max payload size exceeded', false, 1009, 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH');
	                    cb(error);
	                    return;
	                }
	                this._fragments.push(buf);
	            }
	            this.dataMessage(cb);
	            if (this._state === GET_INFO) this.startLoop(cb);
	        });
	    }
	    /**
	   * Handles a data message.
	   *
	   * @param {Function} cb Callback
	   * @private
	   */ dataMessage(cb) {
	        if (!this._fin) {
	            this._state = GET_INFO;
	            return;
	        }
	        const messageLength = this._messageLength;
	        const fragments = this._fragments;
	        this._totalPayloadLength = 0;
	        this._messageLength = 0;
	        this._fragmented = 0;
	        this._fragments = [];
	        if (this._opcode === 2) {
	            let data;
	            if (this._binaryType === 'nodebuffer') {
	                data = concat(fragments, messageLength);
	            } else if (this._binaryType === 'arraybuffer') {
	                data = toArrayBuffer(concat(fragments, messageLength));
	            } else {
	                data = fragments;
	            }
	            if (this._allowSynchronousEvents) {
	                this.emit('message', data, true);
	                this._state = GET_INFO;
	            } else {
	                this._state = DEFER_EVENT;
	                setImmediate(()=>{
	                    this.emit('message', data, true);
	                    this._state = GET_INFO;
	                    this.startLoop(cb);
	                });
	            }
	        } else {
	            const buf = concat(fragments, messageLength);
	            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
	                const error = this.createError(Error, 'invalid UTF-8 sequence', true, 1007, 'WS_ERR_INVALID_UTF8');
	                cb(error);
	                return;
	            }
	            if (this._state === INFLATING || this._allowSynchronousEvents) {
	                this.emit('message', buf, false);
	                this._state = GET_INFO;
	            } else {
	                this._state = DEFER_EVENT;
	                setImmediate(()=>{
	                    this.emit('message', buf, false);
	                    this._state = GET_INFO;
	                    this.startLoop(cb);
	                });
	            }
	        }
	    }
	    /**
	   * Handles a control message.
	   *
	   * @param {Buffer} data Data to handle
	   * @return {(Error|RangeError|undefined)} A possible error
	   * @private
	   */ controlMessage(data, cb) {
	        if (this._opcode === 0x08) {
	            if (data.length === 0) {
	                this._loop = false;
	                this.emit('conclude', 1005, EMPTY_BUFFER);
	                this.end();
	            } else {
	                const code = data.readUInt16BE(0);
	                if (!isValidStatusCode(code)) {
	                    const error = this.createError(RangeError, `invalid status code ${code}`, true, 1002, 'WS_ERR_INVALID_CLOSE_CODE');
	                    cb(error);
	                    return;
	                }
	                const buf = new FastBuffer(data.buffer, data.byteOffset + 2, data.length - 2);
	                if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
	                    const error = this.createError(Error, 'invalid UTF-8 sequence', true, 1007, 'WS_ERR_INVALID_UTF8');
	                    cb(error);
	                    return;
	                }
	                this._loop = false;
	                this.emit('conclude', code, buf);
	                this.end();
	            }
	            this._state = GET_INFO;
	            return;
	        }
	        if (this._allowSynchronousEvents) {
	            this.emit(this._opcode === 0x09 ? 'ping' : 'pong', data);
	            this._state = GET_INFO;
	        } else {
	            this._state = DEFER_EVENT;
	            setImmediate(()=>{
	                this.emit(this._opcode === 0x09 ? 'ping' : 'pong', data);
	                this._state = GET_INFO;
	                this.startLoop(cb);
	            });
	        }
	    }
	    /**
	   * Builds an error object.
	   *
	   * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
	   * @param {String} message The error message
	   * @param {Boolean} prefix Specifies whether or not to add a default prefix to
	   *     `message`
	   * @param {Number} statusCode The status code
	   * @param {String} errorCode The exposed error code
	   * @return {(Error|RangeError)} The error
	   * @private
	   */ createError(ErrorCtor, message, prefix, statusCode, errorCode) {
	        this._loop = false;
	        this._errored = true;
	        const err = new ErrorCtor(prefix ? `Invalid WebSocket frame: ${message}` : message);
	        Error.captureStackTrace(err, this.createError);
	        err.code = errorCode;
	        err[kStatusCode] = statusCode;
	        return err;
	    }
	    /**
	   * Creates a Receiver instance.
	   *
	   * @param {Object} [options] Options object
	   * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
	   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
	   *     multiple times in the same tick
	   * @param {String} [options.binaryType=nodebuffer] The type for binary data
	   * @param {Object} [options.extensions] An object containing the negotiated
	   *     extensions
	   * @param {Boolean} [options.isServer=false] Specifies whether to operate in
	   *     client or server mode
	   * @param {Number} [options.maxPayload=0] The maximum allowed message length
	   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	   *     not to skip UTF-8 validation for text and close messages
	   */ constructor(options = {}){
	        super();
	        this._allowSynchronousEvents = options.allowSynchronousEvents !== undefined ? options.allowSynchronousEvents : true;
	        this._binaryType = options.binaryType || BINARY_TYPES[0];
	        this._extensions = options.extensions || {};
	        this._isServer = !!options.isServer;
	        this._maxPayload = options.maxPayload | 0;
	        this._skipUTF8Validation = !!options.skipUTF8Validation;
	        this[kWebSocket] = undefined;
	        this._bufferedBytes = 0;
	        this._buffers = [];
	        this._compressed = false;
	        this._payloadLength = 0;
	        this._mask = undefined;
	        this._fragmented = 0;
	        this._masked = false;
	        this._fin = false;
	        this._opcode = 0;
	        this._totalPayloadLength = 0;
	        this._messageLength = 0;
	        this._fragments = [];
	        this._errored = false;
	        this._loop = false;
	        this._state = GET_INFO;
	    }
	}
	receiver = Receiver;
	return receiver;
}

requireReceiver();

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Duplex" }] */

var sender;
var hasRequiredSender;

function requireSender () {
	if (hasRequiredSender) return sender;
	hasRequiredSender = 1;
	const { Duplex } = require$$0;
	const { randomFillSync } = crypto;
	const PerMessageDeflate = requirePermessageDeflate();
	const { EMPTY_BUFFER } = requireConstants();
	const { isValidStatusCode } = requireValidation();
	const { mask: applyMask, toBuffer } = requireBufferUtil();
	const kByteLength = Symbol('kByteLength');
	const maskBuffer = Buffer.alloc(4);
	const RANDOM_POOL_SIZE = 8 * 1024;
	let randomPool;
	let randomPoolPointer = RANDOM_POOL_SIZE;
	/**
	 * HyBi Sender implementation.
	 */ class Sender {
	    /**
	   * Frames a piece of data according to the HyBi WebSocket protocol.
	   *
	   * @param {(Buffer|String)} data The data to frame
	   * @param {Object} options Options object
	   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
	   *     FIN bit
	   * @param {Function} [options.generateMask] The function used to generate the
	   *     masking key
	   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
	   *     `data`
	   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
	   *     key
	   * @param {Number} options.opcode The opcode
	   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
	   *     modified
	   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
	   *     RSV1 bit
	   * @return {(Buffer|String)[]} The framed data
	   * @public
	   */ static frame(data, options) {
	        let mask;
	        let merge = false;
	        let offset = 2;
	        let skipMasking = false;
	        if (options.mask) {
	            mask = options.maskBuffer || maskBuffer;
	            if (options.generateMask) {
	                options.generateMask(mask);
	            } else {
	                if (randomPoolPointer === RANDOM_POOL_SIZE) {
	                    /* istanbul ignore else  */ if (randomPool === undefined) {
	                        //
	                        // This is lazily initialized because server-sent frames must not
	                        // be masked so it may never be used.
	                        //
	                        randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
	                    }
	                    randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
	                    randomPoolPointer = 0;
	                }
	                mask[0] = randomPool[randomPoolPointer++];
	                mask[1] = randomPool[randomPoolPointer++];
	                mask[2] = randomPool[randomPoolPointer++];
	                mask[3] = randomPool[randomPoolPointer++];
	            }
	            skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
	            offset = 6;
	        }
	        let dataLength;
	        if (typeof data === 'string') {
	            if ((!options.mask || skipMasking) && options[kByteLength] !== undefined) {
	                dataLength = options[kByteLength];
	            } else {
	                data = Buffer.from(data);
	                dataLength = data.length;
	            }
	        } else {
	            dataLength = data.length;
	            merge = options.mask && options.readOnly && !skipMasking;
	        }
	        let payloadLength = dataLength;
	        if (dataLength >= 65536) {
	            offset += 8;
	            payloadLength = 127;
	        } else if (dataLength > 125) {
	            offset += 2;
	            payloadLength = 126;
	        }
	        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
	        target[0] = options.fin ? options.opcode | 0x80 : options.opcode;
	        if (options.rsv1) target[0] |= 0x40;
	        target[1] = payloadLength;
	        if (payloadLength === 126) {
	            target.writeUInt16BE(dataLength, 2);
	        } else if (payloadLength === 127) {
	            target[2] = target[3] = 0;
	            target.writeUIntBE(dataLength, 4, 6);
	        }
	        if (!options.mask) return [
	            target,
	            data
	        ];
	        target[1] |= 0x80;
	        target[offset - 4] = mask[0];
	        target[offset - 3] = mask[1];
	        target[offset - 2] = mask[2];
	        target[offset - 1] = mask[3];
	        if (skipMasking) return [
	            target,
	            data
	        ];
	        if (merge) {
	            applyMask(data, mask, target, offset, dataLength);
	            return [
	                target
	            ];
	        }
	        applyMask(data, mask, data, 0, dataLength);
	        return [
	            target,
	            data
	        ];
	    }
	    /**
	   * Sends a close message to the other peer.
	   *
	   * @param {Number} [code] The status code component of the body
	   * @param {(String|Buffer)} [data] The message component of the body
	   * @param {Boolean} [mask=false] Specifies whether or not to mask the message
	   * @param {Function} [cb] Callback
	   * @public
	   */ close(code, data, mask, cb) {
	        let buf;
	        if (code === undefined) {
	            buf = EMPTY_BUFFER;
	        } else if (typeof code !== 'number' || !isValidStatusCode(code)) {
	            throw new TypeError('First argument must be a valid error code number');
	        } else if (data === undefined || !data.length) {
	            buf = Buffer.allocUnsafe(2);
	            buf.writeUInt16BE(code, 0);
	        } else {
	            const length = Buffer.byteLength(data);
	            if (length > 123) {
	                throw new RangeError('The message must not be greater than 123 bytes');
	            }
	            buf = Buffer.allocUnsafe(2 + length);
	            buf.writeUInt16BE(code, 0);
	            if (typeof data === 'string') {
	                buf.write(data, 2);
	            } else {
	                buf.set(data, 2);
	            }
	        }
	        const options = {
	            [kByteLength]: buf.length,
	            fin: true,
	            generateMask: this._generateMask,
	            mask,
	            maskBuffer: this._maskBuffer,
	            opcode: 0x08,
	            readOnly: false,
	            rsv1: false
	        };
	        if (this._deflating) {
	            this.enqueue([
	                this.dispatch,
	                buf,
	                false,
	                options,
	                cb
	            ]);
	        } else {
	            this.sendFrame(Sender.frame(buf, options), cb);
	        }
	    }
	    /**
	   * Sends a ping message to the other peer.
	   *
	   * @param {*} data The message to send
	   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
	   * @param {Function} [cb] Callback
	   * @public
	   */ ping(data, mask, cb) {
	        let byteLength;
	        let readOnly;
	        if (typeof data === 'string') {
	            byteLength = Buffer.byteLength(data);
	            readOnly = false;
	        } else {
	            data = toBuffer(data);
	            byteLength = data.length;
	            readOnly = toBuffer.readOnly;
	        }
	        if (byteLength > 125) {
	            throw new RangeError('The data size must not be greater than 125 bytes');
	        }
	        const options = {
	            [kByteLength]: byteLength,
	            fin: true,
	            generateMask: this._generateMask,
	            mask,
	            maskBuffer: this._maskBuffer,
	            opcode: 0x09,
	            readOnly,
	            rsv1: false
	        };
	        if (this._deflating) {
	            this.enqueue([
	                this.dispatch,
	                data,
	                false,
	                options,
	                cb
	            ]);
	        } else {
	            this.sendFrame(Sender.frame(data, options), cb);
	        }
	    }
	    /**
	   * Sends a pong message to the other peer.
	   *
	   * @param {*} data The message to send
	   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
	   * @param {Function} [cb] Callback
	   * @public
	   */ pong(data, mask, cb) {
	        let byteLength;
	        let readOnly;
	        if (typeof data === 'string') {
	            byteLength = Buffer.byteLength(data);
	            readOnly = false;
	        } else {
	            data = toBuffer(data);
	            byteLength = data.length;
	            readOnly = toBuffer.readOnly;
	        }
	        if (byteLength > 125) {
	            throw new RangeError('The data size must not be greater than 125 bytes');
	        }
	        const options = {
	            [kByteLength]: byteLength,
	            fin: true,
	            generateMask: this._generateMask,
	            mask,
	            maskBuffer: this._maskBuffer,
	            opcode: 0x0a,
	            readOnly,
	            rsv1: false
	        };
	        if (this._deflating) {
	            this.enqueue([
	                this.dispatch,
	                data,
	                false,
	                options,
	                cb
	            ]);
	        } else {
	            this.sendFrame(Sender.frame(data, options), cb);
	        }
	    }
	    /**
	   * Sends a data message to the other peer.
	   *
	   * @param {*} data The message to send
	   * @param {Object} options Options object
	   * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
	   *     or text
	   * @param {Boolean} [options.compress=false] Specifies whether or not to
	   *     compress `data`
	   * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
	   *     last one
	   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
	   *     `data`
	   * @param {Function} [cb] Callback
	   * @public
	   */ send(data, options, cb) {
	        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
	        let opcode = options.binary ? 2 : 1;
	        let rsv1 = options.compress;
	        let byteLength;
	        let readOnly;
	        if (typeof data === 'string') {
	            byteLength = Buffer.byteLength(data);
	            readOnly = false;
	        } else {
	            data = toBuffer(data);
	            byteLength = data.length;
	            readOnly = toBuffer.readOnly;
	        }
	        if (this._firstFragment) {
	            this._firstFragment = false;
	            if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? 'server_no_context_takeover' : 'client_no_context_takeover']) {
	                rsv1 = byteLength >= perMessageDeflate._threshold;
	            }
	            this._compress = rsv1;
	        } else {
	            rsv1 = false;
	            opcode = 0;
	        }
	        if (options.fin) this._firstFragment = true;
	        if (perMessageDeflate) {
	            const opts = {
	                [kByteLength]: byteLength,
	                fin: options.fin,
	                generateMask: this._generateMask,
	                mask: options.mask,
	                maskBuffer: this._maskBuffer,
	                opcode,
	                readOnly,
	                rsv1
	            };
	            if (this._deflating) {
	                this.enqueue([
	                    this.dispatch,
	                    data,
	                    this._compress,
	                    opts,
	                    cb
	                ]);
	            } else {
	                this.dispatch(data, this._compress, opts, cb);
	            }
	        } else {
	            this.sendFrame(Sender.frame(data, {
	                [kByteLength]: byteLength,
	                fin: options.fin,
	                generateMask: this._generateMask,
	                mask: options.mask,
	                maskBuffer: this._maskBuffer,
	                opcode,
	                readOnly,
	                rsv1: false
	            }), cb);
	        }
	    }
	    /**
	   * Dispatches a message.
	   *
	   * @param {(Buffer|String)} data The message to send
	   * @param {Boolean} [compress=false] Specifies whether or not to compress
	   *     `data`
	   * @param {Object} options Options object
	   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
	   *     FIN bit
	   * @param {Function} [options.generateMask] The function used to generate the
	   *     masking key
	   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
	   *     `data`
	   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
	   *     key
	   * @param {Number} options.opcode The opcode
	   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
	   *     modified
	   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
	   *     RSV1 bit
	   * @param {Function} [cb] Callback
	   * @private
	   */ dispatch(data, compress, options, cb) {
	        if (!compress) {
	            this.sendFrame(Sender.frame(data, options), cb);
	            return;
	        }
	        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
	        this._bufferedBytes += options[kByteLength];
	        this._deflating = true;
	        perMessageDeflate.compress(data, options.fin, (_, buf)=>{
	            if (this._socket.destroyed) {
	                const err = new Error('The socket was closed while data was being compressed');
	                if (typeof cb === 'function') cb(err);
	                for(let i = 0; i < this._queue.length; i++){
	                    const params = this._queue[i];
	                    const callback = params[params.length - 1];
	                    if (typeof callback === 'function') callback(err);
	                }
	                return;
	            }
	            this._bufferedBytes -= options[kByteLength];
	            this._deflating = false;
	            options.readOnly = false;
	            this.sendFrame(Sender.frame(buf, options), cb);
	            this.dequeue();
	        });
	    }
	    /**
	   * Executes queued send operations.
	   *
	   * @private
	   */ dequeue() {
	        while(!this._deflating && this._queue.length){
	            const params = this._queue.shift();
	            this._bufferedBytes -= params[3][kByteLength];
	            Reflect.apply(params[0], this, params.slice(1));
	        }
	    }
	    /**
	   * Enqueues a send operation.
	   *
	   * @param {Array} params Send operation parameters.
	   * @private
	   */ enqueue(params) {
	        this._bufferedBytes += params[3][kByteLength];
	        this._queue.push(params);
	    }
	    /**
	   * Sends a frame.
	   *
	   * @param {Buffer[]} list The frame to send
	   * @param {Function} [cb] Callback
	   * @private
	   */ sendFrame(list, cb) {
	        if (list.length === 2) {
	            this._socket.cork();
	            this._socket.write(list[0]);
	            this._socket.write(list[1], cb);
	            this._socket.uncork();
	        } else {
	            this._socket.write(list[0], cb);
	        }
	    }
	    /**
	   * Creates a Sender instance.
	   *
	   * @param {Duplex} socket The connection socket
	   * @param {Object} [extensions] An object containing the negotiated extensions
	   * @param {Function} [generateMask] The function used to generate the masking
	   *     key
	   */ constructor(socket, extensions, generateMask){
	        this._extensions = extensions || {};
	        if (generateMask) {
	            this._generateMask = generateMask;
	            this._maskBuffer = Buffer.alloc(4);
	        }
	        this._socket = socket;
	        this._firstFragment = true;
	        this._compress = false;
	        this._bufferedBytes = 0;
	        this._deflating = false;
	        this._queue = [];
	    }
	}
	sender = Sender;
	return sender;
}

requireSender();

var eventTarget;
var hasRequiredEventTarget;

function requireEventTarget () {
	if (hasRequiredEventTarget) return eventTarget;
	hasRequiredEventTarget = 1;
	const { kForOnEventAttribute, kListener } = requireConstants();
	const kCode = Symbol('kCode');
	const kData = Symbol('kData');
	const kError = Symbol('kError');
	const kMessage = Symbol('kMessage');
	const kReason = Symbol('kReason');
	const kTarget = Symbol('kTarget');
	const kType = Symbol('kType');
	const kWasClean = Symbol('kWasClean');
	/**
	 * Class representing an event.
	 */ class Event {
	    /**
	   * @type {*}
	   */ get target() {
	        return this[kTarget];
	    }
	    /**
	   * @type {String}
	   */ get type() {
	        return this[kType];
	    }
	    /**
	   * Create a new `Event`.
	   *
	   * @param {String} type The name of the event
	   * @throws {TypeError} If the `type` argument is not specified
	   */ constructor(type){
	        this[kTarget] = null;
	        this[kType] = type;
	    }
	}
	Object.defineProperty(Event.prototype, 'target', {
	    enumerable: true
	});
	Object.defineProperty(Event.prototype, 'type', {
	    enumerable: true
	});
	/**
	 * Class representing a close event.
	 *
	 * @extends Event
	 */ class CloseEvent extends Event {
	    /**
	   * @type {Number}
	   */ get code() {
	        return this[kCode];
	    }
	    /**
	   * @type {String}
	   */ get reason() {
	        return this[kReason];
	    }
	    /**
	   * @type {Boolean}
	   */ get wasClean() {
	        return this[kWasClean];
	    }
	    /**
	   * Create a new `CloseEvent`.
	   *
	   * @param {String} type The name of the event
	   * @param {Object} [options] A dictionary object that allows for setting
	   *     attributes via object members of the same name
	   * @param {Number} [options.code=0] The status code explaining why the
	   *     connection was closed
	   * @param {String} [options.reason=''] A human-readable string explaining why
	   *     the connection was closed
	   * @param {Boolean} [options.wasClean=false] Indicates whether or not the
	   *     connection was cleanly closed
	   */ constructor(type, options = {}){
	        super(type);
	        this[kCode] = options.code === undefined ? 0 : options.code;
	        this[kReason] = options.reason === undefined ? '' : options.reason;
	        this[kWasClean] = options.wasClean === undefined ? false : options.wasClean;
	    }
	}
	Object.defineProperty(CloseEvent.prototype, 'code', {
	    enumerable: true
	});
	Object.defineProperty(CloseEvent.prototype, 'reason', {
	    enumerable: true
	});
	Object.defineProperty(CloseEvent.prototype, 'wasClean', {
	    enumerable: true
	});
	/**
	 * Class representing an error event.
	 *
	 * @extends Event
	 */ class ErrorEvent extends Event {
	    /**
	   * @type {*}
	   */ get error() {
	        return this[kError];
	    }
	    /**
	   * @type {String}
	   */ get message() {
	        return this[kMessage];
	    }
	    /**
	   * Create a new `ErrorEvent`.
	   *
	   * @param {String} type The name of the event
	   * @param {Object} [options] A dictionary object that allows for setting
	   *     attributes via object members of the same name
	   * @param {*} [options.error=null] The error that generated this event
	   * @param {String} [options.message=''] The error message
	   */ constructor(type, options = {}){
	        super(type);
	        this[kError] = options.error === undefined ? null : options.error;
	        this[kMessage] = options.message === undefined ? '' : options.message;
	    }
	}
	Object.defineProperty(ErrorEvent.prototype, 'error', {
	    enumerable: true
	});
	Object.defineProperty(ErrorEvent.prototype, 'message', {
	    enumerable: true
	});
	/**
	 * Class representing a message event.
	 *
	 * @extends Event
	 */ class MessageEvent extends Event {
	    /**
	   * @type {*}
	   */ get data() {
	        return this[kData];
	    }
	    /**
	   * Create a new `MessageEvent`.
	   *
	   * @param {String} type The name of the event
	   * @param {Object} [options] A dictionary object that allows for setting
	   *     attributes via object members of the same name
	   * @param {*} [options.data=null] The message content
	   */ constructor(type, options = {}){
	        super(type);
	        this[kData] = options.data === undefined ? null : options.data;
	    }
	}
	Object.defineProperty(MessageEvent.prototype, 'data', {
	    enumerable: true
	});
	/**
	 * This provides methods for emulating the `EventTarget` interface. It's not
	 * meant to be used directly.
	 *
	 * @mixin
	 */ const EventTarget = {
	    /**
	   * Register an event listener.
	   *
	   * @param {String} type A string representing the event type to listen for
	   * @param {(Function|Object)} handler The listener to add
	   * @param {Object} [options] An options object specifies characteristics about
	   *     the event listener
	   * @param {Boolean} [options.once=false] A `Boolean` indicating that the
	   *     listener should be invoked at most once after being added. If `true`,
	   *     the listener would be automatically removed when invoked.
	   * @public
	   */ addEventListener (type, handler, options = {}) {
	        for (const listener of this.listeners(type)){
	            if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
	                return;
	            }
	        }
	        let wrapper;
	        if (type === 'message') {
	            wrapper = function onMessage(data, isBinary) {
	                const event = new MessageEvent('message', {
	                    data: isBinary ? data : data.toString()
	                });
	                event[kTarget] = this;
	                callListener(handler, this, event);
	            };
	        } else if (type === 'close') {
	            wrapper = function onClose(code, message) {
	                const event = new CloseEvent('close', {
	                    code,
	                    reason: message.toString(),
	                    wasClean: this._closeFrameReceived && this._closeFrameSent
	                });
	                event[kTarget] = this;
	                callListener(handler, this, event);
	            };
	        } else if (type === 'error') {
	            wrapper = function onError(error) {
	                const event = new ErrorEvent('error', {
	                    error,
	                    message: error.message
	                });
	                event[kTarget] = this;
	                callListener(handler, this, event);
	            };
	        } else if (type === 'open') {
	            wrapper = function onOpen() {
	                const event = new Event('open');
	                event[kTarget] = this;
	                callListener(handler, this, event);
	            };
	        } else {
	            return;
	        }
	        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
	        wrapper[kListener] = handler;
	        if (options.once) {
	            this.once(type, wrapper);
	        } else {
	            this.on(type, wrapper);
	        }
	    },
	    /**
	   * Remove an event listener.
	   *
	   * @param {String} type A string representing the event type to remove
	   * @param {(Function|Object)} handler The listener to remove
	   * @public
	   */ removeEventListener (type, handler) {
	        for (const listener of this.listeners(type)){
	            if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
	                this.removeListener(type, listener);
	                break;
	            }
	        }
	    }
	};
	eventTarget = {
	    CloseEvent,
	    ErrorEvent,
	    Event,
	    EventTarget,
	    MessageEvent
	};
	/**
	 * Call an event listener
	 *
	 * @param {(Function|Object)} listener The listener to call
	 * @param {*} thisArg The value to use as `this`` when calling the listener
	 * @param {Event} event The event to pass to the listener
	 * @private
	 */ function callListener(listener, thisArg, event) {
	    if (typeof listener === 'object' && listener.handleEvent) {
	        listener.handleEvent.call(listener, event);
	    } else {
	        listener.call(thisArg, event);
	    }
	}
	return eventTarget;
}

var extension;
var hasRequiredExtension;

function requireExtension () {
	if (hasRequiredExtension) return extension;
	hasRequiredExtension = 1;
	const { tokenChars } = requireValidation();
	/**
	 * Adds an offer to the map of extension offers or a parameter to the map of
	 * parameters.
	 *
	 * @param {Object} dest The map of extension offers or parameters
	 * @param {String} name The extension or parameter name
	 * @param {(Object|Boolean|String)} elem The extension parameters or the
	 *     parameter value
	 * @private
	 */ function push(dest, name, elem) {
	    if (dest[name] === undefined) dest[name] = [
	        elem
	    ];
	    else dest[name].push(elem);
	}
	/**
	 * Parses the `Sec-WebSocket-Extensions` header into an object.
	 *
	 * @param {String} header The field value of the header
	 * @return {Object} The parsed object
	 * @public
	 */ function parse(header) {
	    const offers = Object.create(null);
	    let params = Object.create(null);
	    let mustUnescape = false;
	    let isEscaping = false;
	    let inQuotes = false;
	    let extensionName;
	    let paramName;
	    let start = -1;
	    let code = -1;
	    let end = -1;
	    let i = 0;
	    for(; i < header.length; i++){
	        code = header.charCodeAt(i);
	        if (extensionName === undefined) {
	            if (end === -1 && tokenChars[code] === 1) {
	                if (start === -1) start = i;
	            } else if (i !== 0 && (code === 0x20 /* ' ' */  || code === 0x09)) {
	                if (end === -1 && start !== -1) end = i;
	            } else if (code === 0x3b /* ';' */  || code === 0x2c /* ',' */ ) {
	                if (start === -1) {
	                    throw new SyntaxError(`Unexpected character at index ${i}`);
	                }
	                if (end === -1) end = i;
	                const name = header.slice(start, end);
	                if (code === 0x2c) {
	                    push(offers, name, params);
	                    params = Object.create(null);
	                } else {
	                    extensionName = name;
	                }
	                start = end = -1;
	            } else {
	                throw new SyntaxError(`Unexpected character at index ${i}`);
	            }
	        } else if (paramName === undefined) {
	            if (end === -1 && tokenChars[code] === 1) {
	                if (start === -1) start = i;
	            } else if (code === 0x20 || code === 0x09) {
	                if (end === -1 && start !== -1) end = i;
	            } else if (code === 0x3b || code === 0x2c) {
	                if (start === -1) {
	                    throw new SyntaxError(`Unexpected character at index ${i}`);
	                }
	                if (end === -1) end = i;
	                push(params, header.slice(start, end), true);
	                if (code === 0x2c) {
	                    push(offers, extensionName, params);
	                    params = Object.create(null);
	                    extensionName = undefined;
	                }
	                start = end = -1;
	            } else if (code === 0x3d /* '=' */  && start !== -1 && end === -1) {
	                paramName = header.slice(start, i);
	                start = end = -1;
	            } else {
	                throw new SyntaxError(`Unexpected character at index ${i}`);
	            }
	        } else {
	            //
	            // The value of a quoted-string after unescaping must conform to the
	            // token ABNF, so only token characters are valid.
	            // Ref: https://tools.ietf.org/html/rfc6455#section-9.1
	            //
	            if (isEscaping) {
	                if (tokenChars[code] !== 1) {
	                    throw new SyntaxError(`Unexpected character at index ${i}`);
	                }
	                if (start === -1) start = i;
	                else if (!mustUnescape) mustUnescape = true;
	                isEscaping = false;
	            } else if (inQuotes) {
	                if (tokenChars[code] === 1) {
	                    if (start === -1) start = i;
	                } else if (code === 0x22 /* '"' */  && start !== -1) {
	                    inQuotes = false;
	                    end = i;
	                } else if (code === 0x5c /* '\' */ ) {
	                    isEscaping = true;
	                } else {
	                    throw new SyntaxError(`Unexpected character at index ${i}`);
	                }
	            } else if (code === 0x22 && header.charCodeAt(i - 1) === 0x3d) {
	                inQuotes = true;
	            } else if (end === -1 && tokenChars[code] === 1) {
	                if (start === -1) start = i;
	            } else if (start !== -1 && (code === 0x20 || code === 0x09)) {
	                if (end === -1) end = i;
	            } else if (code === 0x3b || code === 0x2c) {
	                if (start === -1) {
	                    throw new SyntaxError(`Unexpected character at index ${i}`);
	                }
	                if (end === -1) end = i;
	                let value = header.slice(start, end);
	                if (mustUnescape) {
	                    value = value.replace(/\\/g, '');
	                    mustUnescape = false;
	                }
	                push(params, paramName, value);
	                if (code === 0x2c) {
	                    push(offers, extensionName, params);
	                    params = Object.create(null);
	                    extensionName = undefined;
	                }
	                paramName = undefined;
	                start = end = -1;
	            } else {
	                throw new SyntaxError(`Unexpected character at index ${i}`);
	            }
	        }
	    }
	    if (start === -1 || inQuotes || code === 0x20 || code === 0x09) {
	        throw new SyntaxError('Unexpected end of input');
	    }
	    if (end === -1) end = i;
	    const token = header.slice(start, end);
	    if (extensionName === undefined) {
	        push(offers, token, params);
	    } else {
	        if (paramName === undefined) {
	            push(params, token, true);
	        } else if (mustUnescape) {
	            push(params, paramName, token.replace(/\\/g, ''));
	        } else {
	            push(params, paramName, token);
	        }
	        push(offers, extensionName, params);
	    }
	    return offers;
	}
	/**
	 * Builds the `Sec-WebSocket-Extensions` header field value.
	 *
	 * @param {Object} extensions The map of extensions and parameters to format
	 * @return {String} A string representing the given object
	 * @public
	 */ function format(extensions) {
	    return Object.keys(extensions).map((extension)=>{
	        let configurations = extensions[extension];
	        if (!Array.isArray(configurations)) configurations = [
	            configurations
	        ];
	        return configurations.map((params)=>{
	            return [
	                extension
	            ].concat(Object.keys(params).map((k)=>{
	                let values = params[k];
	                if (!Array.isArray(values)) values = [
	                    values
	                ];
	                return values.map((v)=>v === true ? k : `${k}=${v}`).join('; ');
	            })).join('; ');
	        }).join(', ');
	    }).join(', ');
	}
	extension = {
	    format,
	    parse
	};
	return extension;
}

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Duplex|Readable$", "caughtErrors": "none" }] */

var websocket;
var hasRequiredWebsocket;

function requireWebsocket () {
	if (hasRequiredWebsocket) return websocket;
	hasRequiredWebsocket = 1;
	const EventEmitter = require$$0$3;
	const https = require$$1;
	const http = require$$2;
	const net = require$$3;
	const tls = require$$4;
	const { randomBytes, createHash } = crypto;
	const { Duplex, Readable } = require$$0;
	const { URL } = require$$7;
	const PerMessageDeflate = requirePermessageDeflate();
	const Receiver = requireReceiver();
	const Sender = requireSender();
	const { BINARY_TYPES, EMPTY_BUFFER, GUID, kForOnEventAttribute, kListener, kStatusCode, kWebSocket, NOOP } = requireConstants();
	const { EventTarget: { addEventListener, removeEventListener } } = requireEventTarget();
	const { format, parse } = requireExtension();
	const { toBuffer } = requireBufferUtil();
	const closeTimeout = 30 * 1000;
	const kAborted = Symbol('kAborted');
	const protocolVersions = [
	    8,
	    13
	];
	const readyStates = [
	    'CONNECTING',
	    'OPEN',
	    'CLOSING',
	    'CLOSED'
	];
	const subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
	/**
	 * Class representing a WebSocket.
	 *
	 * @extends EventEmitter
	 */ class WebSocket extends EventEmitter {
	    /**
	   * This deviates from the WHATWG interface since ws doesn't support the
	   * required default "blob" type (instead we define a custom "nodebuffer"
	   * type).
	   *
	   * @type {String}
	   */ get binaryType() {
	        return this._binaryType;
	    }
	    set binaryType(type) {
	        if (!BINARY_TYPES.includes(type)) return;
	        this._binaryType = type;
	        //
	        // Allow to change `binaryType` on the fly.
	        //
	        if (this._receiver) this._receiver._binaryType = type;
	    }
	    /**
	   * @type {Number}
	   */ get bufferedAmount() {
	        if (!this._socket) return this._bufferedAmount;
	        return this._socket._writableState.length + this._sender._bufferedBytes;
	    }
	    /**
	   * @type {String}
	   */ get extensions() {
	        return Object.keys(this._extensions).join();
	    }
	    /**
	   * @type {Boolean}
	   */ get isPaused() {
	        return this._paused;
	    }
	    /**
	   * @type {Function}
	   */ /* istanbul ignore next */ get onclose() {
	        return null;
	    }
	    /**
	   * @type {Function}
	   */ /* istanbul ignore next */ get onerror() {
	        return null;
	    }
	    /**
	   * @type {Function}
	   */ /* istanbul ignore next */ get onopen() {
	        return null;
	    }
	    /**
	   * @type {Function}
	   */ /* istanbul ignore next */ get onmessage() {
	        return null;
	    }
	    /**
	   * @type {String}
	   */ get protocol() {
	        return this._protocol;
	    }
	    /**
	   * @type {Number}
	   */ get readyState() {
	        return this._readyState;
	    }
	    /**
	   * @type {String}
	   */ get url() {
	        return this._url;
	    }
	    /**
	   * Set up the socket and the internal resources.
	   *
	   * @param {Duplex} socket The network socket between the server and client
	   * @param {Buffer} head The first packet of the upgraded stream
	   * @param {Object} options Options object
	   * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
	   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
	   *     multiple times in the same tick
	   * @param {Function} [options.generateMask] The function used to generate the
	   *     masking key
	   * @param {Number} [options.maxPayload=0] The maximum allowed message size
	   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	   *     not to skip UTF-8 validation for text and close messages
	   * @private
	   */ setSocket(socket, head, options) {
	        const receiver = new Receiver({
	            allowSynchronousEvents: options.allowSynchronousEvents,
	            binaryType: this.binaryType,
	            extensions: this._extensions,
	            isServer: this._isServer,
	            maxPayload: options.maxPayload,
	            skipUTF8Validation: options.skipUTF8Validation
	        });
	        this._sender = new Sender(socket, this._extensions, options.generateMask);
	        this._receiver = receiver;
	        this._socket = socket;
	        receiver[kWebSocket] = this;
	        socket[kWebSocket] = this;
	        receiver.on('conclude', receiverOnConclude);
	        receiver.on('drain', receiverOnDrain);
	        receiver.on('error', receiverOnError);
	        receiver.on('message', receiverOnMessage);
	        receiver.on('ping', receiverOnPing);
	        receiver.on('pong', receiverOnPong);
	        //
	        // These methods may not be available if `socket` is just a `Duplex`.
	        //
	        if (socket.setTimeout) socket.setTimeout(0);
	        if (socket.setNoDelay) socket.setNoDelay();
	        if (head.length > 0) socket.unshift(head);
	        socket.on('close', socketOnClose);
	        socket.on('data', socketOnData);
	        socket.on('end', socketOnEnd);
	        socket.on('error', socketOnError);
	        this._readyState = WebSocket.OPEN;
	        this.emit('open');
	    }
	    /**
	   * Emit the `'close'` event.
	   *
	   * @private
	   */ emitClose() {
	        if (!this._socket) {
	            this._readyState = WebSocket.CLOSED;
	            this.emit('close', this._closeCode, this._closeMessage);
	            return;
	        }
	        if (this._extensions[PerMessageDeflate.extensionName]) {
	            this._extensions[PerMessageDeflate.extensionName].cleanup();
	        }
	        this._receiver.removeAllListeners();
	        this._readyState = WebSocket.CLOSED;
	        this.emit('close', this._closeCode, this._closeMessage);
	    }
	    /**
	   * Start a closing handshake.
	   *
	   *          +----------+   +-----------+   +----------+
	   *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
	   *    |     +----------+   +-----------+   +----------+     |
	   *          +----------+   +-----------+         |
	   * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
	   *          +----------+   +-----------+   |
	   *    |           |                        |   +---+        |
	   *                +------------------------+-->|fin| - - - -
	   *    |         +---+                      |   +---+
	   *     - - - - -|fin|<---------------------+
	   *              +---+
	   *
	   * @param {Number} [code] Status code explaining why the connection is closing
	   * @param {(String|Buffer)} [data] The reason why the connection is
	   *     closing
	   * @public
	   */ close(code, data) {
	        if (this.readyState === WebSocket.CLOSED) return;
	        if (this.readyState === WebSocket.CONNECTING) {
	            const msg = 'WebSocket was closed before the connection was established';
	            abortHandshake(this, this._req, msg);
	            return;
	        }
	        if (this.readyState === WebSocket.CLOSING) {
	            if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
	                this._socket.end();
	            }
	            return;
	        }
	        this._readyState = WebSocket.CLOSING;
	        this._sender.close(code, data, !this._isServer, (err)=>{
	            //
	            // This error is handled by the `'error'` listener on the socket. We only
	            // want to know if the close frame has been sent here.
	            //
	            if (err) return;
	            this._closeFrameSent = true;
	            if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
	                this._socket.end();
	            }
	        });
	        //
	        // Specify a timeout for the closing handshake to complete.
	        //
	        this._closeTimer = setTimeout(this._socket.destroy.bind(this._socket), closeTimeout);
	    }
	    /**
	   * Pause the socket.
	   *
	   * @public
	   */ pause() {
	        if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) {
	            return;
	        }
	        this._paused = true;
	        this._socket.pause();
	    }
	    /**
	   * Send a ping.
	   *
	   * @param {*} [data] The data to send
	   * @param {Boolean} [mask] Indicates whether or not to mask `data`
	   * @param {Function} [cb] Callback which is executed when the ping is sent
	   * @public
	   */ ping(data, mask, cb) {
	        if (this.readyState === WebSocket.CONNECTING) {
	            throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
	        }
	        if (typeof data === 'function') {
	            cb = data;
	            data = mask = undefined;
	        } else if (typeof mask === 'function') {
	            cb = mask;
	            mask = undefined;
	        }
	        if (typeof data === 'number') data = data.toString();
	        if (this.readyState !== WebSocket.OPEN) {
	            sendAfterClose(this, data, cb);
	            return;
	        }
	        if (mask === undefined) mask = !this._isServer;
	        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
	    }
	    /**
	   * Send a pong.
	   *
	   * @param {*} [data] The data to send
	   * @param {Boolean} [mask] Indicates whether or not to mask `data`
	   * @param {Function} [cb] Callback which is executed when the pong is sent
	   * @public
	   */ pong(data, mask, cb) {
	        if (this.readyState === WebSocket.CONNECTING) {
	            throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
	        }
	        if (typeof data === 'function') {
	            cb = data;
	            data = mask = undefined;
	        } else if (typeof mask === 'function') {
	            cb = mask;
	            mask = undefined;
	        }
	        if (typeof data === 'number') data = data.toString();
	        if (this.readyState !== WebSocket.OPEN) {
	            sendAfterClose(this, data, cb);
	            return;
	        }
	        if (mask === undefined) mask = !this._isServer;
	        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
	    }
	    /**
	   * Resume the socket.
	   *
	   * @public
	   */ resume() {
	        if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) {
	            return;
	        }
	        this._paused = false;
	        if (!this._receiver._writableState.needDrain) this._socket.resume();
	    }
	    /**
	   * Send a data message.
	   *
	   * @param {*} data The message to send
	   * @param {Object} [options] Options object
	   * @param {Boolean} [options.binary] Specifies whether `data` is binary or
	   *     text
	   * @param {Boolean} [options.compress] Specifies whether or not to compress
	   *     `data`
	   * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
	   *     last one
	   * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
	   * @param {Function} [cb] Callback which is executed when data is written out
	   * @public
	   */ send(data, options, cb) {
	        if (this.readyState === WebSocket.CONNECTING) {
	            throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
	        }
	        if (typeof options === 'function') {
	            cb = options;
	            options = {};
	        }
	        if (typeof data === 'number') data = data.toString();
	        if (this.readyState !== WebSocket.OPEN) {
	            sendAfterClose(this, data, cb);
	            return;
	        }
	        const opts = {
	            binary: typeof data !== 'string',
	            mask: !this._isServer,
	            compress: true,
	            fin: true,
	            ...options
	        };
	        if (!this._extensions[PerMessageDeflate.extensionName]) {
	            opts.compress = false;
	        }
	        this._sender.send(data || EMPTY_BUFFER, opts, cb);
	    }
	    /**
	   * Forcibly close the connection.
	   *
	   * @public
	   */ terminate() {
	        if (this.readyState === WebSocket.CLOSED) return;
	        if (this.readyState === WebSocket.CONNECTING) {
	            const msg = 'WebSocket was closed before the connection was established';
	            abortHandshake(this, this._req, msg);
	            return;
	        }
	        if (this._socket) {
	            this._readyState = WebSocket.CLOSING;
	            this._socket.destroy();
	        }
	    }
	    /**
	   * Create a new `WebSocket`.
	   *
	   * @param {(String|URL)} address The URL to which to connect
	   * @param {(String|String[])} [protocols] The subprotocols
	   * @param {Object} [options] Connection options
	   */ constructor(address, protocols, options){
	        super();
	        this._binaryType = BINARY_TYPES[0];
	        this._closeCode = 1006;
	        this._closeFrameReceived = false;
	        this._closeFrameSent = false;
	        this._closeMessage = EMPTY_BUFFER;
	        this._closeTimer = null;
	        this._extensions = {};
	        this._paused = false;
	        this._protocol = '';
	        this._readyState = WebSocket.CONNECTING;
	        this._receiver = null;
	        this._sender = null;
	        this._socket = null;
	        if (address !== null) {
	            this._bufferedAmount = 0;
	            this._isServer = false;
	            this._redirects = 0;
	            if (protocols === undefined) {
	                protocols = [];
	            } else if (!Array.isArray(protocols)) {
	                if (typeof protocols === 'object' && protocols !== null) {
	                    options = protocols;
	                    protocols = [];
	                } else {
	                    protocols = [
	                        protocols
	                    ];
	                }
	            }
	            initAsClient(this, address, protocols, options);
	        } else {
	            this._autoPong = options.autoPong;
	            this._isServer = true;
	        }
	    }
	}
	/**
	 * @constant {Number} CONNECTING
	 * @memberof WebSocket
	 */ Object.defineProperty(WebSocket, 'CONNECTING', {
	    enumerable: true,
	    value: readyStates.indexOf('CONNECTING')
	});
	/**
	 * @constant {Number} CONNECTING
	 * @memberof WebSocket.prototype
	 */ Object.defineProperty(WebSocket.prototype, 'CONNECTING', {
	    enumerable: true,
	    value: readyStates.indexOf('CONNECTING')
	});
	/**
	 * @constant {Number} OPEN
	 * @memberof WebSocket
	 */ Object.defineProperty(WebSocket, 'OPEN', {
	    enumerable: true,
	    value: readyStates.indexOf('OPEN')
	});
	/**
	 * @constant {Number} OPEN
	 * @memberof WebSocket.prototype
	 */ Object.defineProperty(WebSocket.prototype, 'OPEN', {
	    enumerable: true,
	    value: readyStates.indexOf('OPEN')
	});
	/**
	 * @constant {Number} CLOSING
	 * @memberof WebSocket
	 */ Object.defineProperty(WebSocket, 'CLOSING', {
	    enumerable: true,
	    value: readyStates.indexOf('CLOSING')
	});
	/**
	 * @constant {Number} CLOSING
	 * @memberof WebSocket.prototype
	 */ Object.defineProperty(WebSocket.prototype, 'CLOSING', {
	    enumerable: true,
	    value: readyStates.indexOf('CLOSING')
	});
	/**
	 * @constant {Number} CLOSED
	 * @memberof WebSocket
	 */ Object.defineProperty(WebSocket, 'CLOSED', {
	    enumerable: true,
	    value: readyStates.indexOf('CLOSED')
	});
	/**
	 * @constant {Number} CLOSED
	 * @memberof WebSocket.prototype
	 */ Object.defineProperty(WebSocket.prototype, 'CLOSED', {
	    enumerable: true,
	    value: readyStates.indexOf('CLOSED')
	});
	[
	    'binaryType',
	    'bufferedAmount',
	    'extensions',
	    'isPaused',
	    'protocol',
	    'readyState',
	    'url'
	].forEach((property)=>{
	    Object.defineProperty(WebSocket.prototype, property, {
	        enumerable: true
	    });
	});
	//
	// Add the `onopen`, `onerror`, `onclose`, and `onmessage` attributes.
	// See https://html.spec.whatwg.org/multipage/comms.html#the-websocket-interface
	//
	[
	    'open',
	    'error',
	    'close',
	    'message'
	].forEach((method)=>{
	    Object.defineProperty(WebSocket.prototype, `on${method}`, {
	        enumerable: true,
	        get () {
	            for (const listener of this.listeners(method)){
	                if (listener[kForOnEventAttribute]) return listener[kListener];
	            }
	            return null;
	        },
	        set (handler) {
	            for (const listener of this.listeners(method)){
	                if (listener[kForOnEventAttribute]) {
	                    this.removeListener(method, listener);
	                    break;
	                }
	            }
	            if (typeof handler !== 'function') return;
	            this.addEventListener(method, handler, {
	                [kForOnEventAttribute]: true
	            });
	        }
	    });
	});
	WebSocket.prototype.addEventListener = addEventListener;
	WebSocket.prototype.removeEventListener = removeEventListener;
	websocket = WebSocket;
	/**
	 * Initialize a WebSocket client.
	 *
	 * @param {WebSocket} websocket The client to initialize
	 * @param {(String|URL)} address The URL to which to connect
	 * @param {Array} protocols The subprotocols
	 * @param {Object} [options] Connection options
	 * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether any
	 *     of the `'message'`, `'ping'`, and `'pong'` events can be emitted multiple
	 *     times in the same tick
	 * @param {Boolean} [options.autoPong=true] Specifies whether or not to
	 *     automatically send a pong in response to a ping
	 * @param {Function} [options.finishRequest] A function which can be used to
	 *     customize the headers of each http request before it is sent
	 * @param {Boolean} [options.followRedirects=false] Whether or not to follow
	 *     redirects
	 * @param {Function} [options.generateMask] The function used to generate the
	 *     masking key
	 * @param {Number} [options.handshakeTimeout] Timeout in milliseconds for the
	 *     handshake request
	 * @param {Number} [options.maxPayload=104857600] The maximum allowed message
	 *     size
	 * @param {Number} [options.maxRedirects=10] The maximum number of redirects
	 *     allowed
	 * @param {String} [options.origin] Value of the `Origin` or
	 *     `Sec-WebSocket-Origin` header
	 * @param {(Boolean|Object)} [options.perMessageDeflate=true] Enable/disable
	 *     permessage-deflate
	 * @param {Number} [options.protocolVersion=13] Value of the
	 *     `Sec-WebSocket-Version` header
	 * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	 *     not to skip UTF-8 validation for text and close messages
	 * @private
	 */ function initAsClient(websocket, address, protocols, options) {
	    const opts = {
	        allowSynchronousEvents: true,
	        autoPong: true,
	        protocolVersion: protocolVersions[1],
	        maxPayload: 100 * 1024 * 1024,
	        skipUTF8Validation: false,
	        perMessageDeflate: true,
	        followRedirects: false,
	        maxRedirects: 10,
	        ...options,
	        socketPath: undefined,
	        hostname: undefined,
	        protocol: undefined,
	        timeout: undefined,
	        method: 'GET',
	        host: undefined,
	        path: undefined,
	        port: undefined
	    };
	    websocket._autoPong = opts.autoPong;
	    if (!protocolVersions.includes(opts.protocolVersion)) {
	        throw new RangeError(`Unsupported protocol version: ${opts.protocolVersion} ` + `(supported versions: ${protocolVersions.join(', ')})`);
	    }
	    let parsedUrl;
	    if (address instanceof URL) {
	        parsedUrl = address;
	    } else {
	        try {
	            parsedUrl = new URL(address);
	        } catch (e) {
	            throw new SyntaxError(`Invalid URL: ${address}`);
	        }
	    }
	    if (parsedUrl.protocol === 'http:') {
	        parsedUrl.protocol = 'ws:';
	    } else if (parsedUrl.protocol === 'https:') {
	        parsedUrl.protocol = 'wss:';
	    }
	    websocket._url = parsedUrl.href;
	    const isSecure = parsedUrl.protocol === 'wss:';
	    const isIpcUrl = parsedUrl.protocol === 'ws+unix:';
	    let invalidUrlMessage;
	    if (parsedUrl.protocol !== 'ws:' && !isSecure && !isIpcUrl) {
	        invalidUrlMessage = 'The URL\'s protocol must be one of "ws:", "wss:", ' + '"http:", "https", or "ws+unix:"';
	    } else if (isIpcUrl && !parsedUrl.pathname) {
	        invalidUrlMessage = "The URL's pathname is empty";
	    } else if (parsedUrl.hash) {
	        invalidUrlMessage = 'The URL contains a fragment identifier';
	    }
	    if (invalidUrlMessage) {
	        const err = new SyntaxError(invalidUrlMessage);
	        if (websocket._redirects === 0) {
	            throw err;
	        } else {
	            emitErrorAndClose(websocket, err);
	            return;
	        }
	    }
	    const defaultPort = isSecure ? 443 : 80;
	    const key = randomBytes(16).toString('base64');
	    const request = isSecure ? https.request : http.request;
	    const protocolSet = new Set();
	    let perMessageDeflate;
	    opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
	    opts.defaultPort = opts.defaultPort || defaultPort;
	    opts.port = parsedUrl.port || defaultPort;
	    opts.host = parsedUrl.hostname.startsWith('[') ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
	    opts.headers = {
	        ...opts.headers,
	        'Sec-WebSocket-Version': opts.protocolVersion,
	        'Sec-WebSocket-Key': key,
	        Connection: 'Upgrade',
	        Upgrade: 'websocket'
	    };
	    opts.path = parsedUrl.pathname + parsedUrl.search;
	    opts.timeout = opts.handshakeTimeout;
	    if (opts.perMessageDeflate) {
	        perMessageDeflate = new PerMessageDeflate(opts.perMessageDeflate !== true ? opts.perMessageDeflate : {}, false, opts.maxPayload);
	        opts.headers['Sec-WebSocket-Extensions'] = format({
	            [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
	        });
	    }
	    if (protocols.length) {
	        for (const protocol of protocols){
	            if (typeof protocol !== 'string' || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
	                throw new SyntaxError('An invalid or duplicated subprotocol was specified');
	            }
	            protocolSet.add(protocol);
	        }
	        opts.headers['Sec-WebSocket-Protocol'] = protocols.join(',');
	    }
	    if (opts.origin) {
	        if (opts.protocolVersion < 13) {
	            opts.headers['Sec-WebSocket-Origin'] = opts.origin;
	        } else {
	            opts.headers.Origin = opts.origin;
	        }
	    }
	    if (parsedUrl.username || parsedUrl.password) {
	        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
	    }
	    if (isIpcUrl) {
	        const parts = opts.path.split(':');
	        opts.socketPath = parts[0];
	        opts.path = parts[1];
	    }
	    let req;
	    if (opts.followRedirects) {
	        if (websocket._redirects === 0) {
	            websocket._originalIpc = isIpcUrl;
	            websocket._originalSecure = isSecure;
	            websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
	            const headers = options && options.headers;
	            //
	            // Shallow copy the user provided options so that headers can be changed
	            // without mutating the original object.
	            //
	            options = {
	                ...options,
	                headers: {}
	            };
	            if (headers) {
	                for (const [key, value] of Object.entries(headers)){
	                    options.headers[key.toLowerCase()] = value;
	                }
	            }
	        } else if (websocket.listenerCount('redirect') === 0) {
	            const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
	            if (!isSameHost || websocket._originalSecure && !isSecure) {
	                //
	                // Match curl 7.77.0 behavior and drop the following headers. These
	                // headers are also dropped when following a redirect to a subdomain.
	                //
	                delete opts.headers.authorization;
	                delete opts.headers.cookie;
	                if (!isSameHost) delete opts.headers.host;
	                opts.auth = undefined;
	            }
	        }
	        //
	        // Match curl 7.77.0 behavior and make the first `Authorization` header win.
	        // If the `Authorization` header is set, then there is nothing to do as it
	        // will take precedence.
	        //
	        if (opts.auth && !options.headers.authorization) {
	            options.headers.authorization = 'Basic ' + Buffer.from(opts.auth).toString('base64');
	        }
	        req = websocket._req = request(opts);
	        if (websocket._redirects) {
	            //
	            // Unlike what is done for the `'upgrade'` event, no early exit is
	            // triggered here if the user calls `websocket.close()` or
	            // `websocket.terminate()` from a listener of the `'redirect'` event. This
	            // is because the user can also call `request.destroy()` with an error
	            // before calling `websocket.close()` or `websocket.terminate()` and this
	            // would result in an error being emitted on the `request` object with no
	            // `'error'` event listeners attached.
	            //
	            websocket.emit('redirect', websocket.url, req);
	        }
	    } else {
	        req = websocket._req = request(opts);
	    }
	    if (opts.timeout) {
	        req.on('timeout', ()=>{
	            abortHandshake(websocket, req, 'Opening handshake has timed out');
	        });
	    }
	    req.on('error', (err)=>{
	        if (req === null || req[kAborted]) return;
	        req = websocket._req = null;
	        emitErrorAndClose(websocket, err);
	    });
	    req.on('response', (res)=>{
	        const location = res.headers.location;
	        const statusCode = res.statusCode;
	        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
	            if (++websocket._redirects > opts.maxRedirects) {
	                abortHandshake(websocket, req, 'Maximum redirects exceeded');
	                return;
	            }
	            req.abort();
	            let addr;
	            try {
	                addr = new URL(location, address);
	            } catch (e) {
	                const err = new SyntaxError(`Invalid URL: ${location}`);
	                emitErrorAndClose(websocket, err);
	                return;
	            }
	            initAsClient(websocket, addr, protocols, options);
	        } else if (!websocket.emit('unexpected-response', req, res)) {
	            abortHandshake(websocket, req, `Unexpected server response: ${res.statusCode}`);
	        }
	    });
	    req.on('upgrade', (res, socket, head)=>{
	        websocket.emit('upgrade', res);
	        //
	        // The user may have closed the connection from a listener of the
	        // `'upgrade'` event.
	        //
	        if (websocket.readyState !== WebSocket.CONNECTING) return;
	        req = websocket._req = null;
	        const upgrade = res.headers.upgrade;
	        if (upgrade === undefined || upgrade.toLowerCase() !== 'websocket') {
	            abortHandshake(websocket, socket, 'Invalid Upgrade header');
	            return;
	        }
	        const digest = createHash('sha1').update(key + GUID).digest('base64');
	        if (res.headers['sec-websocket-accept'] !== digest) {
	            abortHandshake(websocket, socket, 'Invalid Sec-WebSocket-Accept header');
	            return;
	        }
	        const serverProt = res.headers['sec-websocket-protocol'];
	        let protError;
	        if (serverProt !== undefined) {
	            if (!protocolSet.size) {
	                protError = 'Server sent a subprotocol but none was requested';
	            } else if (!protocolSet.has(serverProt)) {
	                protError = 'Server sent an invalid subprotocol';
	            }
	        } else if (protocolSet.size) {
	            protError = 'Server sent no subprotocol';
	        }
	        if (protError) {
	            abortHandshake(websocket, socket, protError);
	            return;
	        }
	        if (serverProt) websocket._protocol = serverProt;
	        const secWebSocketExtensions = res.headers['sec-websocket-extensions'];
	        if (secWebSocketExtensions !== undefined) {
	            if (!perMessageDeflate) {
	                const message = 'Server sent a Sec-WebSocket-Extensions header but no extension ' + 'was requested';
	                abortHandshake(websocket, socket, message);
	                return;
	            }
	            let extensions;
	            try {
	                extensions = parse(secWebSocketExtensions);
	            } catch (err) {
	                const message = 'Invalid Sec-WebSocket-Extensions header';
	                abortHandshake(websocket, socket, message);
	                return;
	            }
	            const extensionNames = Object.keys(extensions);
	            if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
	                const message = 'Server indicated an extension that was not requested';
	                abortHandshake(websocket, socket, message);
	                return;
	            }
	            try {
	                perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
	            } catch (err) {
	                const message = 'Invalid Sec-WebSocket-Extensions header';
	                abortHandshake(websocket, socket, message);
	                return;
	            }
	            websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
	        }
	        websocket.setSocket(socket, head, {
	            allowSynchronousEvents: opts.allowSynchronousEvents,
	            generateMask: opts.generateMask,
	            maxPayload: opts.maxPayload,
	            skipUTF8Validation: opts.skipUTF8Validation
	        });
	    });
	    if (opts.finishRequest) {
	        opts.finishRequest(req, websocket);
	    } else {
	        req.end();
	    }
	}
	/**
	 * Emit the `'error'` and `'close'` events.
	 *
	 * @param {WebSocket} websocket The WebSocket instance
	 * @param {Error} The error to emit
	 * @private
	 */ function emitErrorAndClose(websocket, err) {
	    websocket._readyState = WebSocket.CLOSING;
	    websocket.emit('error', err);
	    websocket.emitClose();
	}
	/**
	 * Create a `net.Socket` and initiate a connection.
	 *
	 * @param {Object} options Connection options
	 * @return {net.Socket} The newly created socket used to start the connection
	 * @private
	 */ function netConnect(options) {
	    options.path = options.socketPath;
	    return net.connect(options);
	}
	/**
	 * Create a `tls.TLSSocket` and initiate a connection.
	 *
	 * @param {Object} options Connection options
	 * @return {tls.TLSSocket} The newly created socket used to start the connection
	 * @private
	 */ function tlsConnect(options) {
	    options.path = undefined;
	    if (!options.servername && options.servername !== '') {
	        options.servername = net.isIP(options.host) ? '' : options.host;
	    }
	    return tls.connect(options);
	}
	/**
	 * Abort the handshake and emit an error.
	 *
	 * @param {WebSocket} websocket The WebSocket instance
	 * @param {(http.ClientRequest|net.Socket|tls.Socket)} stream The request to
	 *     abort or the socket to destroy
	 * @param {String} message The error message
	 * @private
	 */ function abortHandshake(websocket, stream, message) {
	    websocket._readyState = WebSocket.CLOSING;
	    const err = new Error(message);
	    Error.captureStackTrace(err, abortHandshake);
	    if (stream.setHeader) {
	        stream[kAborted] = true;
	        stream.abort();
	        if (stream.socket && !stream.socket.destroyed) {
	            //
	            // On Node.js >= 14.3.0 `request.abort()` does not destroy the socket if
	            // called after the request completed. See
	            // https://github.com/websockets/ws/issues/1869.
	            //
	            stream.socket.destroy();
	        }
	        process.nextTick(emitErrorAndClose, websocket, err);
	    } else {
	        stream.destroy(err);
	        stream.once('error', websocket.emit.bind(websocket, 'error'));
	        stream.once('close', websocket.emitClose.bind(websocket));
	    }
	}
	/**
	 * Handle cases where the `ping()`, `pong()`, or `send()` methods are called
	 * when the `readyState` attribute is `CLOSING` or `CLOSED`.
	 *
	 * @param {WebSocket} websocket The WebSocket instance
	 * @param {*} [data] The data to send
	 * @param {Function} [cb] Callback
	 * @private
	 */ function sendAfterClose(websocket, data, cb) {
	    if (data) {
	        const length = toBuffer(data).length;
	        //
	        // The `_bufferedAmount` property is used only when the peer is a client and
	        // the opening handshake fails. Under these circumstances, in fact, the
	        // `setSocket()` method is not called, so the `_socket` and `_sender`
	        // properties are set to `null`.
	        //
	        if (websocket._socket) websocket._sender._bufferedBytes += length;
	        else websocket._bufferedAmount += length;
	    }
	    if (cb) {
	        const err = new Error(`WebSocket is not open: readyState ${websocket.readyState} ` + `(${readyStates[websocket.readyState]})`);
	        process.nextTick(cb, err);
	    }
	}
	/**
	 * The listener of the `Receiver` `'conclude'` event.
	 *
	 * @param {Number} code The status code
	 * @param {Buffer} reason The reason for closing
	 * @private
	 */ function receiverOnConclude(code, reason) {
	    const websocket = this[kWebSocket];
	    websocket._closeFrameReceived = true;
	    websocket._closeMessage = reason;
	    websocket._closeCode = code;
	    if (websocket._socket[kWebSocket] === undefined) return;
	    websocket._socket.removeListener('data', socketOnData);
	    process.nextTick(resume, websocket._socket);
	    if (code === 1005) websocket.close();
	    else websocket.close(code, reason);
	}
	/**
	 * The listener of the `Receiver` `'drain'` event.
	 *
	 * @private
	 */ function receiverOnDrain() {
	    const websocket = this[kWebSocket];
	    if (!websocket.isPaused) websocket._socket.resume();
	}
	/**
	 * The listener of the `Receiver` `'error'` event.
	 *
	 * @param {(RangeError|Error)} err The emitted error
	 * @private
	 */ function receiverOnError(err) {
	    const websocket = this[kWebSocket];
	    if (websocket._socket[kWebSocket] !== undefined) {
	        websocket._socket.removeListener('data', socketOnData);
	        //
	        // On Node.js < 14.0.0 the `'error'` event is emitted synchronously. See
	        // https://github.com/websockets/ws/issues/1940.
	        //
	        process.nextTick(resume, websocket._socket);
	        websocket.close(err[kStatusCode]);
	    }
	    websocket.emit('error', err);
	}
	/**
	 * The listener of the `Receiver` `'finish'` event.
	 *
	 * @private
	 */ function receiverOnFinish() {
	    this[kWebSocket].emitClose();
	}
	/**
	 * The listener of the `Receiver` `'message'` event.
	 *
	 * @param {Buffer|ArrayBuffer|Buffer[])} data The message
	 * @param {Boolean} isBinary Specifies whether the message is binary or not
	 * @private
	 */ function receiverOnMessage(data, isBinary) {
	    this[kWebSocket].emit('message', data, isBinary);
	}
	/**
	 * The listener of the `Receiver` `'ping'` event.
	 *
	 * @param {Buffer} data The data included in the ping frame
	 * @private
	 */ function receiverOnPing(data) {
	    const websocket = this[kWebSocket];
	    if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
	    websocket.emit('ping', data);
	}
	/**
	 * The listener of the `Receiver` `'pong'` event.
	 *
	 * @param {Buffer} data The data included in the pong frame
	 * @private
	 */ function receiverOnPong(data) {
	    this[kWebSocket].emit('pong', data);
	}
	/**
	 * Resume a readable stream
	 *
	 * @param {Readable} stream The readable stream
	 * @private
	 */ function resume(stream) {
	    stream.resume();
	}
	/**
	 * The listener of the socket `'close'` event.
	 *
	 * @private
	 */ function socketOnClose() {
	    const websocket = this[kWebSocket];
	    this.removeListener('close', socketOnClose);
	    this.removeListener('data', socketOnData);
	    this.removeListener('end', socketOnEnd);
	    websocket._readyState = WebSocket.CLOSING;
	    let chunk;
	    //
	    // The close frame might not have been received or the `'end'` event emitted,
	    // for example, if the socket was destroyed due to an error. Ensure that the
	    // `receiver` stream is closed after writing any remaining buffered data to
	    // it. If the readable side of the socket is in flowing mode then there is no
	    // buffered data as everything has been already written and `readable.read()`
	    // will return `null`. If instead, the socket is paused, any possible buffered
	    // data will be read as a single chunk.
	    //
	    if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && (chunk = websocket._socket.read()) !== null) {
	        websocket._receiver.write(chunk);
	    }
	    websocket._receiver.end();
	    this[kWebSocket] = undefined;
	    clearTimeout(websocket._closeTimer);
	    if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
	        websocket.emitClose();
	    } else {
	        websocket._receiver.on('error', receiverOnFinish);
	        websocket._receiver.on('finish', receiverOnFinish);
	    }
	}
	/**
	 * The listener of the socket `'data'` event.
	 *
	 * @param {Buffer} chunk A chunk of data
	 * @private
	 */ function socketOnData(chunk) {
	    if (!this[kWebSocket]._receiver.write(chunk)) {
	        this.pause();
	    }
	}
	/**
	 * The listener of the socket `'end'` event.
	 *
	 * @private
	 */ function socketOnEnd() {
	    const websocket = this[kWebSocket];
	    websocket._readyState = WebSocket.CLOSING;
	    websocket._receiver.end();
	    this.end();
	}
	/**
	 * The listener of the socket `'error'` event.
	 *
	 * @private
	 */ function socketOnError() {
	    const websocket = this[kWebSocket];
	    this.removeListener('error', socketOnError);
	    this.on('error', NOOP);
	    if (websocket) {
	        websocket._readyState = WebSocket.CLOSING;
	        this.destroy();
	    }
	}
	return websocket;
}

requireWebsocket();

var subprotocol;
var hasRequiredSubprotocol;

function requireSubprotocol () {
	if (hasRequiredSubprotocol) return subprotocol;
	hasRequiredSubprotocol = 1;
	const { tokenChars } = requireValidation();
	/**
	 * Parses the `Sec-WebSocket-Protocol` header into a set of subprotocol names.
	 *
	 * @param {String} header The field value of the header
	 * @return {Set} The subprotocol names
	 * @public
	 */ function parse(header) {
	    const protocols = new Set();
	    let start = -1;
	    let end = -1;
	    let i = 0;
	    for(i; i < header.length; i++){
	        const code = header.charCodeAt(i);
	        if (end === -1 && tokenChars[code] === 1) {
	            if (start === -1) start = i;
	        } else if (i !== 0 && (code === 0x20 /* ' ' */  || code === 0x09)) {
	            if (end === -1 && start !== -1) end = i;
	        } else if (code === 0x2c /* ',' */ ) {
	            if (start === -1) {
	                throw new SyntaxError(`Unexpected character at index ${i}`);
	            }
	            if (end === -1) end = i;
	            const protocol = header.slice(start, end);
	            if (protocols.has(protocol)) {
	                throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
	            }
	            protocols.add(protocol);
	            start = end = -1;
	        } else {
	            throw new SyntaxError(`Unexpected character at index ${i}`);
	        }
	    }
	    if (start === -1 || end !== -1) {
	        throw new SyntaxError('Unexpected end of input');
	    }
	    const protocol = header.slice(start, i);
	    if (protocols.has(protocol)) {
	        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
	    }
	    protocols.add(protocol);
	    return protocols;
	}
	subprotocol = {
	    parse
	};
	return subprotocol;
}

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Duplex$", "caughtErrors": "none" }] */

var websocketServer;
var hasRequiredWebsocketServer;

function requireWebsocketServer () {
	if (hasRequiredWebsocketServer) return websocketServer;
	hasRequiredWebsocketServer = 1;
	const EventEmitter = require$$0$3;
	const http = require$$2;
	const { Duplex } = require$$0;
	const { createHash } = crypto;
	const extension = requireExtension();
	const PerMessageDeflate = requirePermessageDeflate();
	const subprotocol = requireSubprotocol();
	const WebSocket = requireWebsocket();
	const { GUID, kWebSocket } = requireConstants();
	const keyRegex = /^[+/0-9A-Za-z]{22}==$/;
	const RUNNING = 0;
	const CLOSING = 1;
	const CLOSED = 2;
	/**
	 * Class representing a WebSocket server.
	 *
	 * @extends EventEmitter
	 */ class WebSocketServer extends EventEmitter {
	    /**
	   * Returns the bound address, the address family name, and port of the server
	   * as reported by the operating system if listening on an IP socket.
	   * If the server is listening on a pipe or UNIX domain socket, the name is
	   * returned as a string.
	   *
	   * @return {(Object|String|null)} The address of the server
	   * @public
	   */ address() {
	        if (this.options.noServer) {
	            throw new Error('The server is operating in "noServer" mode');
	        }
	        if (!this._server) return null;
	        return this._server.address();
	    }
	    /**
	   * Stop the server from accepting new connections and emit the `'close'` event
	   * when all existing connections are closed.
	   *
	   * @param {Function} [cb] A one-time listener for the `'close'` event
	   * @public
	   */ close(cb) {
	        if (this._state === CLOSED) {
	            if (cb) {
	                this.once('close', ()=>{
	                    cb(new Error('The server is not running'));
	                });
	            }
	            process.nextTick(emitClose, this);
	            return;
	        }
	        if (cb) this.once('close', cb);
	        if (this._state === CLOSING) return;
	        this._state = CLOSING;
	        if (this.options.noServer || this.options.server) {
	            if (this._server) {
	                this._removeListeners();
	                this._removeListeners = this._server = null;
	            }
	            if (this.clients) {
	                if (!this.clients.size) {
	                    process.nextTick(emitClose, this);
	                } else {
	                    this._shouldEmitClose = true;
	                }
	            } else {
	                process.nextTick(emitClose, this);
	            }
	        } else {
	            const server = this._server;
	            this._removeListeners();
	            this._removeListeners = this._server = null;
	            //
	            // The HTTP/S server was created internally. Close it, and rely on its
	            // `'close'` event.
	            //
	            server.close(()=>{
	                emitClose(this);
	            });
	        }
	    }
	    /**
	   * See if a given request should be handled by this server instance.
	   *
	   * @param {http.IncomingMessage} req Request object to inspect
	   * @return {Boolean} `true` if the request is valid, else `false`
	   * @public
	   */ shouldHandle(req) {
	        if (this.options.path) {
	            const index = req.url.indexOf('?');
	            const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
	            if (pathname !== this.options.path) return false;
	        }
	        return true;
	    }
	    /**
	   * Handle a HTTP Upgrade request.
	   *
	   * @param {http.IncomingMessage} req The request object
	   * @param {Duplex} socket The network socket between the server and client
	   * @param {Buffer} head The first packet of the upgraded stream
	   * @param {Function} cb Callback
	   * @public
	   */ handleUpgrade(req, socket, head, cb) {
	        socket.on('error', socketOnError);
	        const key = req.headers['sec-websocket-key'];
	        const upgrade = req.headers.upgrade;
	        const version = +req.headers['sec-websocket-version'];
	        if (req.method !== 'GET') {
	            const message = 'Invalid HTTP method';
	            abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
	            return;
	        }
	        if (upgrade === undefined || upgrade.toLowerCase() !== 'websocket') {
	            const message = 'Invalid Upgrade header';
	            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
	            return;
	        }
	        if (key === undefined || !keyRegex.test(key)) {
	            const message = 'Missing or invalid Sec-WebSocket-Key header';
	            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
	            return;
	        }
	        if (version !== 8 && version !== 13) {
	            const message = 'Missing or invalid Sec-WebSocket-Version header';
	            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
	            return;
	        }
	        if (!this.shouldHandle(req)) {
	            abortHandshake(socket, 400);
	            return;
	        }
	        const secWebSocketProtocol = req.headers['sec-websocket-protocol'];
	        let protocols = new Set();
	        if (secWebSocketProtocol !== undefined) {
	            try {
	                protocols = subprotocol.parse(secWebSocketProtocol);
	            } catch (err) {
	                const message = 'Invalid Sec-WebSocket-Protocol header';
	                abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
	                return;
	            }
	        }
	        const secWebSocketExtensions = req.headers['sec-websocket-extensions'];
	        const extensions = {};
	        if (this.options.perMessageDeflate && secWebSocketExtensions !== undefined) {
	            const perMessageDeflate = new PerMessageDeflate(this.options.perMessageDeflate, true, this.options.maxPayload);
	            try {
	                const offers = extension.parse(secWebSocketExtensions);
	                if (offers[PerMessageDeflate.extensionName]) {
	                    perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
	                    extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
	                }
	            } catch (err) {
	                const message = 'Invalid or unacceptable Sec-WebSocket-Extensions header';
	                abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
	                return;
	            }
	        }
	        //
	        // Optionally call external client verification handler.
	        //
	        if (this.options.verifyClient) {
	            const info = {
	                origin: req.headers[`${version === 8 ? 'sec-websocket-origin' : 'origin'}`],
	                secure: !!(req.socket.authorized || req.socket.encrypted),
	                req
	            };
	            if (this.options.verifyClient.length === 2) {
	                this.options.verifyClient(info, (verified, code, message, headers)=>{
	                    if (!verified) {
	                        return abortHandshake(socket, code || 401, message, headers);
	                    }
	                    this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
	                });
	                return;
	            }
	            if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
	        }
	        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
	    }
	    /**
	   * Upgrade the connection to WebSocket.
	   *
	   * @param {Object} extensions The accepted extensions
	   * @param {String} key The value of the `Sec-WebSocket-Key` header
	   * @param {Set} protocols The subprotocols
	   * @param {http.IncomingMessage} req The request object
	   * @param {Duplex} socket The network socket between the server and client
	   * @param {Buffer} head The first packet of the upgraded stream
	   * @param {Function} cb Callback
	   * @throws {Error} If called more than once with the same socket
	   * @private
	   */ completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
	        //
	        // Destroy the socket if the client has already sent a FIN packet.
	        //
	        if (!socket.readable || !socket.writable) return socket.destroy();
	        if (socket[kWebSocket]) {
	            throw new Error('server.handleUpgrade() was called more than once with the same ' + 'socket, possibly due to a misconfiguration');
	        }
	        if (this._state > RUNNING) return abortHandshake(socket, 503);
	        const digest = createHash('sha1').update(key + GUID).digest('base64');
	        const headers = [
	            'HTTP/1.1 101 Switching Protocols',
	            'Upgrade: websocket',
	            'Connection: Upgrade',
	            `Sec-WebSocket-Accept: ${digest}`
	        ];
	        const ws = new this.options.WebSocket(null, undefined, this.options);
	        if (protocols.size) {
	            //
	            // Optionally call external protocol selection handler.
	            //
	            const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
	            if (protocol) {
	                headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
	                ws._protocol = protocol;
	            }
	        }
	        if (extensions[PerMessageDeflate.extensionName]) {
	            const params = extensions[PerMessageDeflate.extensionName].params;
	            const value = extension.format({
	                [PerMessageDeflate.extensionName]: [
	                    params
	                ]
	            });
	            headers.push(`Sec-WebSocket-Extensions: ${value}`);
	            ws._extensions = extensions;
	        }
	        //
	        // Allow external modification/inspection of handshake headers.
	        //
	        this.emit('headers', headers, req);
	        socket.write(headers.concat('\r\n').join('\r\n'));
	        socket.removeListener('error', socketOnError);
	        ws.setSocket(socket, head, {
	            allowSynchronousEvents: this.options.allowSynchronousEvents,
	            maxPayload: this.options.maxPayload,
	            skipUTF8Validation: this.options.skipUTF8Validation
	        });
	        if (this.clients) {
	            this.clients.add(ws);
	            ws.on('close', ()=>{
	                this.clients.delete(ws);
	                if (this._shouldEmitClose && !this.clients.size) {
	                    process.nextTick(emitClose, this);
	                }
	            });
	        }
	        cb(ws, req);
	    }
	    /**
	   * Create a `WebSocketServer` instance.
	   *
	   * @param {Object} options Configuration options
	   * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
	   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
	   *     multiple times in the same tick
	   * @param {Boolean} [options.autoPong=true] Specifies whether or not to
	   *     automatically send a pong in response to a ping
	   * @param {Number} [options.backlog=511] The maximum length of the queue of
	   *     pending connections
	   * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
	   *     track clients
	   * @param {Function} [options.handleProtocols] A hook to handle protocols
	   * @param {String} [options.host] The hostname where to bind the server
	   * @param {Number} [options.maxPayload=104857600] The maximum allowed message
	   *     size
	   * @param {Boolean} [options.noServer=false] Enable no server mode
	   * @param {String} [options.path] Accept only connections matching this path
	   * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
	   *     permessage-deflate
	   * @param {Number} [options.port] The port where to bind the server
	   * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
	   *     server to use
	   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	   *     not to skip UTF-8 validation for text and close messages
	   * @param {Function} [options.verifyClient] A hook to reject connections
	   * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
	   *     class to use. It must be the `WebSocket` class or class that extends it
	   * @param {Function} [callback] A listener for the `listening` event
	   */ constructor(options, callback){
	        super();
	        options = {
	            allowSynchronousEvents: true,
	            autoPong: true,
	            maxPayload: 100 * 1024 * 1024,
	            skipUTF8Validation: false,
	            perMessageDeflate: false,
	            handleProtocols: null,
	            clientTracking: true,
	            verifyClient: null,
	            noServer: false,
	            backlog: null,
	            server: null,
	            host: null,
	            path: null,
	            port: null,
	            WebSocket,
	            ...options
	        };
	        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
	            throw new TypeError('One and only one of the "port", "server", or "noServer" options ' + 'must be specified');
	        }
	        if (options.port != null) {
	            this._server = http.createServer((req, res)=>{
	                const body = http.STATUS_CODES[426];
	                res.writeHead(426, {
	                    'Content-Length': body.length,
	                    'Content-Type': 'text/plain'
	                });
	                res.end(body);
	            });
	            this._server.listen(options.port, options.host, options.backlog, callback);
	        } else if (options.server) {
	            this._server = options.server;
	        }
	        if (this._server) {
	            const emitConnection = this.emit.bind(this, 'connection');
	            this._removeListeners = addListeners(this._server, {
	                listening: this.emit.bind(this, 'listening'),
	                error: this.emit.bind(this, 'error'),
	                upgrade: (req, socket, head)=>{
	                    this.handleUpgrade(req, socket, head, emitConnection);
	                }
	            });
	        }
	        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
	        if (options.clientTracking) {
	            this.clients = new Set();
	            this._shouldEmitClose = false;
	        }
	        this.options = options;
	        this._state = RUNNING;
	    }
	}
	websocketServer = WebSocketServer;
	/**
	 * Add event listeners on an `EventEmitter` using a map of <event, listener>
	 * pairs.
	 *
	 * @param {EventEmitter} server The event emitter
	 * @param {Object.<String, Function>} map The listeners to add
	 * @return {Function} A function that will remove the added listeners when
	 *     called
	 * @private
	 */ function addListeners(server, map) {
	    for (const event of Object.keys(map))server.on(event, map[event]);
	    return function removeListeners() {
	        for (const event of Object.keys(map)){
	            server.removeListener(event, map[event]);
	        }
	    };
	}
	/**
	 * Emit a `'close'` event on an `EventEmitter`.
	 *
	 * @param {EventEmitter} server The event emitter
	 * @private
	 */ function emitClose(server) {
	    server._state = CLOSED;
	    server.emit('close');
	}
	/**
	 * Handle socket errors.
	 *
	 * @private
	 */ function socketOnError() {
	    this.destroy();
	}
	/**
	 * Close the connection when preconditions are not fulfilled.
	 *
	 * @param {Duplex} socket The socket of the upgrade request
	 * @param {Number} code The HTTP response status code
	 * @param {String} [message] The HTTP response body
	 * @param {Object} [headers] Additional HTTP response headers
	 * @private
	 */ function abortHandshake(socket, code, message, headers) {
	    //
	    // The socket is writable unless the user destroyed or ended it before calling
	    // `server.handleUpgrade()` or in the `verifyClient` function, which is a user
	    // error. Handling this does not make much sense as the worst that can happen
	    // is that some of the data written by the user might be discarded due to the
	    // call to `socket.end()` below, which triggers an `'error'` event that in
	    // turn causes the socket to be destroyed.
	    //
	    message = message || http.STATUS_CODES[code];
	    headers = {
	        Connection: 'close',
	        'Content-Type': 'text/html',
	        'Content-Length': Buffer.byteLength(message),
	        ...headers
	    };
	    socket.once('finish', socket.destroy);
	    socket.end(`HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` + Object.keys(headers).map((h)=>`${h}: ${headers[h]}`).join('\r\n') + '\r\n\r\n' + message);
	}
	/**
	 * Emit a `'wsClientError'` event on a `WebSocketServer` if there is at least
	 * one listener for it, otherwise call `abortHandshake()`.
	 *
	 * @param {WebSocketServer} server The WebSocket server
	 * @param {http.IncomingMessage} req The request object
	 * @param {Duplex} socket The socket of the upgrade request
	 * @param {Number} code The HTTP response status code
	 * @param {String} message The HTTP response body
	 * @private
	 */ function abortHandshakeOrEmitwsClientError(server, req, socket, code, message) {
	    if (server.listenerCount('wsClientError')) {
	        const err = new Error(message);
	        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
	        server.emit('wsClientError', err, socket, req);
	    } else {
	        abortHandshake(socket, code, message);
	    }
	}
	return websocketServer;
}

var websocketServerExports = requireWebsocketServer();
var WebSocketServer = /*@__PURE__*/getDefaultExportFromCjs(websocketServerExports);

// src/index.ts
function _class_private_field_loose_base(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id = 0;
function _class_private_field_loose_key(name) {
    return "__private_" + id++ + "_" + name;
}
var _eventInitDict;
// src/events.ts
var CloseEvent = globalThis.CloseEvent ?? (_eventInitDict = /*#__PURE__*/ _class_private_field_loose_key("_eventInitDict"), class extends Event {
    get wasClean() {
        return _class_private_field_loose_base(this, _eventInitDict)[_eventInitDict].wasClean ?? false;
    }
    get code() {
        return _class_private_field_loose_base(this, _eventInitDict)[_eventInitDict].code ?? 0;
    }
    get reason() {
        return _class_private_field_loose_base(this, _eventInitDict)[_eventInitDict].reason ?? "";
    }
    constructor(type, eventInitDict = {}){
        super(type, eventInitDict), Object.defineProperty(this, _eventInitDict, {
            writable: true,
            value: void 0
        });
        _class_private_field_loose_base(this, _eventInitDict)[_eventInitDict] = eventInitDict;
    }
});
// src/index.ts
var generateConnectionSymbol = ()=>Symbol("connection");
var CONNECTION_SYMBOL_KEY = Symbol("CONNECTION_SYMBOL_KEY");
var createNodeWebSocket = (init)=>{
    const wss = new WebSocketServer({
        noServer: true
    });
    const waiterMap = /* @__PURE__ */ new Map();
    wss.on("connection", (ws, request)=>{
        const waiter = waiterMap.get(request);
        if (waiter) {
            waiter.resolve(ws);
            waiterMap.delete(request);
        }
    });
    const nodeUpgradeWebSocket = (request, connectionSymbol)=>{
        return new Promise((resolve)=>{
            waiterMap.set(request, {
                resolve,
                connectionSymbol
            });
        });
    };
    return {
        wss,
        injectWebSocket (server) {
            server.on("upgrade", async (request, socket, head)=>{
                const url = new URL(request.url ?? "/", init.baseUrl ?? "http://localhost");
                const headers = new Headers();
                for(const key in request.headers){
                    const value = request.headers[key];
                    if (!value) {
                        continue;
                    }
                    headers.append(key, Array.isArray(value) ? value[0] : value);
                }
                const env = {
                    incoming: request,
                    outgoing: void 0
                };
                await init.app.request(url, {
                    headers
                }, env);
                const waiter = waiterMap.get(request);
                if (!waiter || waiter.connectionSymbol !== env[CONNECTION_SYMBOL_KEY]) {
                    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
                    waiterMap.delete(request);
                    return;
                }
                wss.handleUpgrade(request, socket, head, (ws)=>{
                    wss.emit("connection", ws, request);
                });
            });
        },
        upgradeWebSocket: defineWebSocketHelper(async (c, events, options)=>{
            if (c.req.header("upgrade")?.toLowerCase() !== "websocket") {
                return;
            }
            const connectionSymbol = generateConnectionSymbol();
            c.env[CONNECTION_SYMBOL_KEY] = connectionSymbol;
            (async ()=>{
                const ws = await nodeUpgradeWebSocket(c.env.incoming, connectionSymbol);
                const messagesReceivedInStarting = [];
                const bufferMessage = (data, isBinary)=>{
                    messagesReceivedInStarting.push([
                        data,
                        isBinary
                    ]);
                };
                ws.on("message", bufferMessage);
                const ctx = {
                    binaryType: "arraybuffer",
                    close (code, reason) {
                        ws.close(code, reason);
                    },
                    protocol: ws.protocol,
                    raw: ws,
                    get readyState () {
                        return ws.readyState;
                    },
                    send (source, opts) {
                        ws.send(source, {
                            compress: opts?.compress
                        });
                    },
                    url: new URL(c.req.url)
                };
                try {
                    events?.onOpen?.(new Event("open"), ctx);
                } catch (e) {
                    (options?.onError ?? console.error)(e);
                }
                const handleMessage = (data, isBinary)=>{
                    const datas = Array.isArray(data) ? data : [
                        data
                    ];
                    for (const data2 of datas){
                        try {
                            events?.onMessage?.(new MessageEvent("message", {
                                data: isBinary ? data2 instanceof ArrayBuffer ? data2 : data2.buffer.slice(data2.byteOffset, data2.byteOffset + data2.byteLength) : data2.toString("utf-8")
                            }), ctx);
                        } catch (e) {
                            (options?.onError ?? console.error)(e);
                        }
                    }
                };
                ws.off("message", bufferMessage);
                for (const message of messagesReceivedInStarting){
                    handleMessage(...message);
                }
                ws.on("message", (data, isBinary)=>{
                    handleMessage(data, isBinary);
                });
                ws.on("close", (code, reason)=>{
                    try {
                        events?.onClose?.(new CloseEvent("close", {
                            code,
                            reason: reason.toString()
                        }), ctx);
                    } catch (e) {
                        (options?.onError ?? console.error)(e);
                    }
                });
                ws.on("error", (error)=>{
                    try {
                        events?.onError?.(new ErrorEvent("error", {
                            error
                        }), ctx);
                    } catch (e) {
                        (options?.onError ?? console.error)(e);
                    }
                });
            })();
            return new Response();
        })
    };
};

const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

const POOL_SIZE_MULTIPLIER = 128;
let pool, poolOffset;
function fillPool(bytes) {
    if (!pool || pool.length < bytes) {
        pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
        webcrypto.getRandomValues(pool);
        poolOffset = 0;
    } else if (poolOffset + bytes > pool.length) {
        webcrypto.getRandomValues(pool);
        poolOffset = 0;
    }
    poolOffset += bytes;
}
function nanoid(size = 21) {
    fillPool(size |= 0);
    let id = '';
    for(let i = poolOffset - size; i < poolOffset; i++){
        id += urlAlphabet[pool[i] & 63];
    }
    return id;
}

const makeRoomManager = ()=>{
    const rooms = new Map();
    const connections = new Map();
    const send = (roomCode, event, ignoreConnection)=>{
        const connectionIds = rooms.get(roomCode);
        if (!connectionIds) {
            return;
        }
        for (const connectionId of connectionIds){
            if (connectionId === ignoreConnection) {
                continue;
            }
            const connection = connections.get(connectionId);
            if (!connection) {
                return;
            }
            const method = connection[event.type];
            if (method) {
                // @ts-ignore
                method(event);
            }
        }
    };
    return {
        register (roomCode) {
            var _a;
            const id = randomUUID();
            const handlers = {};
            const room = (_a = rooms.get(roomCode)) !== null && _a !== void 0 ? _a : [];
            rooms.set(roomCode, room);
            room.push(id);
            connections.set(id, handlers);
            const on = (message, handler)=>{
                handlers[message] = handler;
            };
            const remove = ()=>{
                var _a, _b;
                connections.delete(id);
                const room = rooms.get(roomCode);
                if (!room) {
                    return;
                }
                rooms.set(roomCode, room.filter((x)=>x != id));
                if ((_b = (_a = rooms.get(roomCode)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 1 < 1) {
                    rooms.delete(roomCode);
                }
            };
            const broardcast = (event)=>{
                send(roomCode, event, id);
            };
            return {
                on,
                remove,
                broardcast
            };
        },
        send
    };
};

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
    app
});
const roomManager = makeRoomManager();
// Regular HTTP route
app.get("/", (c)=>c.text("Hello from Hono!"));
app.post("/create-room", (c)=>c.json({
        roomCode: nanoid(10)
    }));
app.get("/ws/:id", upgradeWebSocket((c)=>{
    let conn = roomManager.register(c.req.param("id"));
    return {
        onMessage (message) {
            return __awaiter(this, void 0, void 0, function*() {
                if (typeof message.data !== "string") {
                    return;
                }
                const msg = JSON.parse(message.data);
                console.log(msg);
                switch(msg.type){
                    case "current_state":
                        conn.broardcast(msg);
                }
            });
        },
        onOpen (_ev, ws) {
            return __awaiter(this, void 0, void 0, function*() {
                conn.on("connect", ()=>{
                    ws.send("User connected");
                });
                conn.on("disconnect", ()=>{
                    ws.send("User disconnected");
                });
                conn.on("current_state", (event)=>{
                    ws.send(JSON.stringify(event));
                });
            });
        },
        onClose () {
            return __awaiter(this, void 0, void 0, function*() {
                conn.remove();
            });
        }
    };
}));
// Create Hono HTTP server
const server = serve({
    fetch: app.fetch,
    port: 42069,
    hostname: "0.0.0.0"
}, (info)=>{
    console.log(`Listening on http://${info.address}:${info.port}`);
});
injectWebSocket(server);
