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
var _PortalManager__nextID, _PortalManager_elementMap, _PortalManager_portalIDMap;
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
        return undefined;
    }
}
customElements.define('portal-placeholder', PortalPlaceholder);
class PortalData {
    constructor(portalID, template) {
        this.portalID = portalID;
        this.template = template;
        this.portals = new Set();
    }
    cloneTemplate() {
        return this.template.cloneNode(true);
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
class PortalManager {
    constructor() {
        _PortalManager__nextID.set(this, void 0);
        _PortalManager_elementMap.set(this, void 0);
        _PortalManager_portalIDMap.set(this, void 0);
        __classPrivateFieldSet(this, _PortalManager__nextID, 0, "f");
        __classPrivateFieldSet(this, _PortalManager_elementMap, new Map(), "f");
        __classPrivateFieldSet(this, _PortalManager_portalIDMap, new Map(), "f");
    }
    get unsafeElementMap() {
        return __classPrivateFieldGet(this, _PortalManager_elementMap, "f");
    }
    get unsafePortalIDMap() {
        return __classPrivateFieldGet(this, _PortalManager_portalIDMap, "f");
    }
    get nextID() {
        var _a, _b;
        return (__classPrivateFieldSet(this, _PortalManager__nextID, (_b = __classPrivateFieldGet(this, _PortalManager__nextID, "f"), _a = _b++, _b), "f"), _a).toString();
    }
    makeTemplate(e) {
        let isTopLevel = true;
        const eClone = cloneNodeFilterMap(e, n => {
            if (isTopLevel) {
                isTopLevel = false;
                return { result: n.cloneNode(), visitChildren: true };
            }
            if (!(n instanceof Element)) {
                return { result: n.cloneNode(), visitChildren: true };
            }
            const pd = __classPrivateFieldGet(this, _PortalManager_elementMap, "f").get(n);
            if (pd !== undefined) {
                const result = document.createElement('portal-placeholder');
                result.setPortalID(pd.portalID);
                return {
                    result,
                    visitChildren: false,
                };
            }
            return { result: n.cloneNode(), visitChildren: true };
        });
        return eClone;
    }
    createElementPortal(tagName, options) {
        const e = document.createElement(tagName, options);
        const pd = new PortalData(this.nextID, this.makeTemplate(e));
        __classPrivateFieldGet(this, _PortalManager_portalIDMap, "f").set(pd.portalID.toString(), pd);
        const result = pd.cloneTemplate();
        pd.portals.add(result);
        __classPrivateFieldGet(this, _PortalManager_elementMap, "f").set(result, pd);
        return result;
    }
    portalContainingNode(n) {
        for (const a of ancestors(n)) {
            if (a instanceof Element) {
                if (__classPrivateFieldGet(this, _PortalManager_elementMap, "f").has(a)) {
                    return a;
                }
            }
        }
        return undefined;
    }
    expandPlaceholders(n, deletions, additions) {
        // const portalIDDepths: Map<number, number> = new Map();
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
                const portalID = node.getPortalID();
                if (portalID === undefined) {
                    throw new Error('portalID undefined');
                }
                const pd = __classPrivateFieldGet(this, _PortalManager_portalIDMap, "f").get(portalID);
                if (pd === undefined) {
                    throw new Error('pd undefined');
                }
                const replacement = pd.cloneTemplate();
                deletions.push({
                    element: node,
                    portalData: pd,
                });
                additions.push({
                    element: replacement,
                    portalData: pd,
                });
                node.replaceWith(replacement);
                node = replacement;
            }
            for (const c of node.childNodes) {
                stack.push({
                    node: c,
                    depth: nextDepth,
                });
            }
        }
    }
    // TODO: change to multi root storage + expand approach, i.e., store the roots
    // of the top level portals, then when something changes update that template, 
    // traverse downwards from roots. When a portal is hit, replace it with its template,
    // then expand in place.
    updateChangedPortal(changedPortal) {
        const pd = __classPrivateFieldGet(this, _PortalManager_elementMap, "f").get(changedPortal);
        if (pd === undefined) {
            throw new Error('pd undefined');
        }
        pd.template = this.makeTemplate(changedPortal);
        {
            const deletions = [];
            const additions = [];
            for (const p of pd.portals) {
                const newP = pd.cloneTemplate();
                deletions.push(p);
                additions.push(newP);
                p.replaceWith(newP);
            }
            for (const d of deletions) {
                pd.portals.delete(d);
            }
            for (const a of additions) {
                pd.portals.add(a);
            }
        }
        const deletions = [];
        const additions = [];
        for (const p of pd.portals) {
            this.expandPlaceholders(p, deletions, additions);
        }
        for (const d of deletions) {
            d.portalData.portals.delete(d.element);
        }
        for (const a of additions) {
            a.portalData.portals.add(a.element);
        }
        return pd;
    }
    // Returns the portal data of the containing portal, if there is one.
    updatePortalsContainingChangedNode(node) {
        const containingPortal = this.portalContainingNode(node);
        if (containingPortal !== undefined) {
            return this.updateChangedPortal(containingPortal);
        }
        else {
            return undefined;
        }
    }
    observeNodeChanged(node) {
        if (node instanceof Element && __classPrivateFieldGet(this, _PortalManager_elementMap, "f").has(node)) {
            this.updateChangedPortal(node);
        }
        this.updatePortalsContainingChangedNode(node);
    }
    appendChild(parent, e) {
        const pd = __classPrivateFieldGet(this, _PortalManager_elementMap, "f").get(e);
        if (pd !== undefined) {
            e = pd.cloneTemplate();
            __classPrivateFieldGet(this, _PortalManager_elementMap, "f").set(e, pd);
            pd.portals.add(e);
        }
        else {
            e = this.makeTemplate(e);
        }
        parent.appendChild(e);
        if (this.updatePortalsContainingChangedNode(e) === undefined) {
            const deletions = [];
            const additions = [];
            this.expandPlaceholders(e, deletions, additions);
            for (const d of deletions) {
                d.portalData.portals.delete(d.element);
            }
            for (const a of additions) {
                a.portalData.portals.add(a.element);
            }
        }
        return e;
    }
}
_PortalManager__nextID = new WeakMap(), _PortalManager_elementMap = new WeakMap(), _PortalManager_portalIDMap = new WeakMap();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PortalManager);

portal_manager = __webpack_exports__;
/******/ })()
;