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
var _PortalManager_registry;
class PortalData {
    constructor(template) {
        this.template = template;
        this.portalsInDocument = new Set();
    }
    cloneTemplate() {
        return this.template.cloneNode(true);
    }
}
function cloneNodeFilterMapImpl(n, filterMap) {
    const nClone = filterMap(n.cloneNode());
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
class PortalManager {
    constructor() {
        _PortalManager_registry.set(this, void 0);
        __classPrivateFieldSet(this, _PortalManager_registry, new Map(), "f");
    }
    makeTemplate(e) {
        let isTopLevel = true;
        const eClone = cloneNodeFilterMap(e, n => {
            if (isTopLevel) {
                isTopLevel = false;
                return { result: n, visitChildren: true };
            }
            if (!(n instanceof Element)) {
                return { result: n, visitChildren: false };
            }
            if (__classPrivateFieldGet(this, _PortalManager_registry, "f").has(n)) {
                return { result: n, visitChildren: false };
            }
            return { result: n, visitChildren: true };
        });
        return eClone;
    }
    initialize(e) {
        let pd = __classPrivateFieldGet(this, _PortalManager_registry, "f").get(e);
        if (pd !== undefined) {
            return pd;
        }
        pd = new PortalData(this.makeTemplate(e));
        __classPrivateFieldGet(this, _PortalManager_registry, "f").set(e, pd);
        return pd;
    }
    templateAddedToDocument(t) {
    }
    appendChildPortal(parent, e) {
        let pd = __classPrivateFieldGet(this, _PortalManager_registry, "f").get(e);
        if (pd === undefined) {
            pd = new PortalData(this.makeTemplate(e));
        }
        const result = pd.cloneTemplate();
        __classPrivateFieldGet(this, _PortalManager_registry, "f").set(result, pd);
        parent.appendChild(result);
        this.templateAddedToDocument(result);
        return result;
    }
    // duplicate(e: Element): Element {
    //     const pd = this.initialize(e);
    //     const t = pd.cloneTemplate();
    //     this.initializeAs(t, pd);
    //     return t;
    // }
    // replace(existing: Element, replacement: Element): void {
    //     if (this.#registry.has(replacement)) {
    //         throw new Error('replacement element is already a portal');
    //     }
    //     const pd = this.#registry.get(existing);
    //     if (pd === undefined) {
    //         throw new Error('existing element is not a portal');
    //     }
    //     pd.template = this.makeTemplate(replacement);
    //     for (const p of pd.portalsInDocument) {
    //         p.replaceWith(pd.cloneTemplate());
    //     }
    // }
    observeNodeAdded(n) {
    }
    observeNodeRemoved(n) {
    }
    observeAttributeChanged(n, attributeName) {
    }
    // Only use this for debugging/testing. This should be considered read-only.
    get unsafeRegistry() {
        return __classPrivateFieldGet(this, _PortalManager_registry, "f");
    }
}
_PortalManager_registry = new WeakMap();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PortalManager);

portal_manager = __webpack_exports__;
/******/ })()
;