var portal_manager;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PortalPlaceholder: () => (/* binding */ PortalPlaceholder),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PortalManager__nextID, _PortalManager_elementMap, _PortalManager_portalIDMap, _PortalManager_roots;
const MAX_RECURSION_DEPTH = 10;
class PortalPlaceholder extends HTMLElement {
    constructor() {
        super();
    }
    setPortalID(portalID) {
        this.setAttribute('portal-id', portalID);
    }
    getPortalID() {
        const v = this.getAttribute('portal-id');
        if (v !== null) {
            return v;
        }
        throw new Error('portalID undefined');
    }
}
customElements.define('portal-placeholder', PortalPlaceholder);
class PortalData {
    constructor(portalID, template) {
        this.portalID = portalID;
        this.template = template;
        this.parents = new Set();
    }
    cloneTemplate() {
        return this.template.cloneNode(true);
    }
    createPlaceholder() {
        const result = document.createElement('portal-placeholder');
        result.setPortalID(this.portalID);
        return result;
    }
}
function cloneNodeFilterMapImpl(n, filterMap) {
    const nClone = filterMap(n);
    if (nClone.visitChildren) {
        n.childNodes.forEach(cn => {
            const cnClone = cloneNodeFilterMapImpl(cn, filterMap);
            nClone.result.appendChild(cnClone.result);
        });
    }
    return nClone;
}
function cloneNodeFilterMap(n, filterMap) {
    return cloneNodeFilterMapImpl(n, filterMap).result;
}
function* ancestors(node) {
    let n = node;
    while (n !== null) {
        n = n.parentNode;
        if (n !== null) {
            yield n;
        }
    }
}
function* ancestorsIncludingSelf(node) {
    yield node;
    yield* ancestors(node);
}
class PortalManager {
    constructor() {
        _PortalManager__nextID.set(this, void 0);
        _PortalManager_elementMap.set(this, void 0);
        _PortalManager_portalIDMap.set(this, void 0);
        _PortalManager_roots.set(this, void 0);
        __classPrivateFieldSet(this, _PortalManager__nextID, 0, "f");
        __classPrivateFieldSet(this, _PortalManager_elementMap, new Map(), "f");
        __classPrivateFieldSet(this, _PortalManager_portalIDMap, new Map(), "f");
        __classPrivateFieldSet(this, _PortalManager_roots, new Set(), "f");
    }
    pdOf(portalID) {
        const result = __classPrivateFieldGet(this, _PortalManager_portalIDMap, "f").get(portalID);
        if (result === undefined) {
            throw new Error('portalID undefined');
        }
        return result;
    }
    pdOfElement(e) {
        const pd = __classPrivateFieldGet(this, _PortalManager_elementMap, "f").get(e);
        if (pd === undefined) {
            throw new Error('pd undefined');
        }
        return pd;
    }
    templateOf(portalID) {
        return this.pdOf(portalID).template;
    }
    get unsafePortalIDMap() {
        return __classPrivateFieldGet(this, _PortalManager_portalIDMap, "f");
    }
    get unsafeRoots() {
        return __classPrivateFieldGet(this, _PortalManager_roots, "f");
    }
    get nextID() {
        var _a, _b;
        return (__classPrivateFieldSet(this, _PortalManager__nextID, (_b = __classPrivateFieldGet(this, _PortalManager__nextID, "f"), _a = _b++, _b), "f"), _a).toString();
    }
    isPortalID(s) {
        return __classPrivateFieldGet(this, _PortalManager_portalIDMap, "f").has(s);
    }
    replacePortalWithPlaceholder(p) {
        const pd = this.pdOfElement(p);
        __classPrivateFieldGet(this, _PortalManager_elementMap, "f").delete(p);
        const ph = pd.createPlaceholder();
        __classPrivateFieldGet(this, _PortalManager_elementMap, "f").set(ph, pd);
        p.replaceWith(ph);
        return ph;
    }
    replacePlaceholderWithElement(ph) {
        const pd = this.pdOf(ph.getPortalID());
        __classPrivateFieldGet(this, _PortalManager_elementMap, "f").delete(ph);
        const template = pd.cloneTemplate();
        __classPrivateFieldGet(this, _PortalManager_elementMap, "f").set(template, pd);
        ph.replaceWith(template);
        return template;
    }
    expandPlaceholders(n) {
        const stack = [{
                node: n,
                depth: 0,
            }];
        while (stack.length > 0) {
            const item = stack.pop();
            if (item.depth >= MAX_RECURSION_DEPTH) {
                return;
            }
            let node = item.node;
            let nextDepth = item.depth;
            if (node instanceof PortalPlaceholder) {
                nextDepth++;
                node = this.replacePlaceholderWithElement(node);
            }
            for (const c of node.childNodes) {
                stack.push({
                    node: c,
                    depth: nextDepth,
                });
            }
        }
    }
    createElement(tagName, options) {
        const e = document.createElement(tagName, options);
        const pd = new PortalData(this.nextID, e);
        __classPrivateFieldGet(this, _PortalManager_portalIDMap, "f").set(pd.portalID, pd);
        return pd.portalID;
    }
    appendChild(parent, child) {
        const parentPD = this.pdOf(parent);
        const childPD = this.pdOf(child);
        const childPlaceholder = childPD.createPlaceholder();
        parentPD.template.appendChild(childPlaceholder);
    }
    rootAppendChild(root, child) {
        const pd = this.pdOf(child);
        const ph = pd.createPlaceholder();
        __classPrivateFieldGet(this, _PortalManager_elementMap, "f").set(ph, pd);
        root.appendChild(ph);
        __classPrivateFieldGet(this, _PortalManager_roots, "f").add(ph);
    }
    render() {
        for (let r of __classPrivateFieldGet(this, _PortalManager_roots, "f")) {
            r = this.replacePortalWithPlaceholder(r);
            this.expandPlaceholders(r);
        }
    }
}
_PortalManager__nextID = new WeakMap(), _PortalManager_elementMap = new WeakMap(), _PortalManager_portalIDMap = new WeakMap(), _PortalManager_roots = new WeakMap();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PortalManager);

portal_manager = __webpack_exports__;
/******/ })()
;