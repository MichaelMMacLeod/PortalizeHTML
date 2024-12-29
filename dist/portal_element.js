var portal_element;
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
var _PortalElementContainer_shadow, _PortalElementContainer_registry, _PortalElementContainer_observer, _PortalElement_shadow, _PortalElement_uuid, _PortalElement_observer, _PortalElement_state;
const RECURSION_DEPTH = 10;
function findAncestor(n, isCorrectNode) {
    let current = n;
    while (true) {
        while (current instanceof ShadowRoot) {
            current = current.host;
        }
        if (isCorrectNode(current)) {
            return current;
        }
        if (current.parentNode === null) {
            return undefined;
        }
        current = current.parentNode;
    }
}
function makePortalData() {
    return {
        template: document.createElement('div'),
        portals: new Set(),
    };
}
function observePortalElementContainerChanges(pec, m, _mo) {
    m.forEach(mr => {
        pec.observePortalElementContainerChange(mr);
    });
}
class PortalElementContainer extends HTMLElement {
    constructor() {
        super();
        _PortalElementContainer_shadow.set(this, void 0);
        _PortalElementContainer_registry.set(this, void 0);
        _PortalElementContainer_observer.set(this, void 0);
        __classPrivateFieldSet(this, _PortalElementContainer_shadow, this.attachShadow({ mode: 'open' }), "f");
        __classPrivateFieldSet(this, _PortalElementContainer_registry, new Map(), "f");
        __classPrivateFieldSet(this, _PortalElementContainer_observer, new MutationObserver((m, o) => observePortalElementContainerChanges(this, m, o)), "f");
    }
    appendChild(node) {
        return __classPrivateFieldGet(this, _PortalElementContainer_shadow, "f").appendChild(node);
    }
    initializePortalData(uuid) {
        let d = __classPrivateFieldGet(this, _PortalElementContainer_registry, "f").get(uuid);
        if (d === undefined) {
            d = makePortalData();
            __classPrivateFieldGet(this, _PortalElementContainer_registry, "f").set(uuid, d);
        }
        return d;
    }
    expandPortals(node, depth = 0) {
        if (depth >= RECURSION_DEPTH) {
            return;
        }
        const children = (() => {
            if (node instanceof PortalElement) {
                if (node.div === undefined) {
                    return new NodeList();
                }
                const pd = this.initializePortalData(node.uuid);
                node.stopObserving();
                node.div = pd.template.cloneNode(true);
                node.startObserving();
                return node.div.childNodes;
            }
            return node.childNodes;
        })();
        const newDepth = node instanceof PortalElement ? depth + 1 : depth;
        children.forEach(c => {
            this.expandPortals(c, newDepth);
        });
    }
    installTemplate(uuid) {
        const pd = this.initializePortalData(uuid);
        pd.portals.forEach(p => {
            this.expandPortals(p);
        });
    }
    observePortalElementContainerChange(m) {
        this.stopObserving();
        const portal = findAncestor(m.target, n => n instanceof PortalElement || n instanceof PortalElementContainer);
        if (portal instanceof PortalElementContainer) {
            m.addedNodes.forEach(n => {
                if (n instanceof PortalElement) {
                    const portal = n;
                    const pd = this.initializePortalData(portal.uuid);
                    const template = portal.makeTemplate();
                    if (template === undefined) {
                        throw new Error('undefined template');
                    }
                    pd.template = template;
                    this.installTemplate(portal.uuid);
                }
            });
        }
        else if (portal instanceof PortalElement) {
            const pd = this.initializePortalData(portal.uuid);
            const template = portal.makeTemplate();
            if (template === undefined) {
                throw new Error('undefined template');
            }
            pd.template = template;
            this.installTemplate(portal.uuid);
        }
        this.startObserving();
    }
    startObserving() {
        const options = {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
        };
        __classPrivateFieldGet(this, _PortalElementContainer_observer, "f").observe(__classPrivateFieldGet(this, _PortalElementContainer_shadow, "f"), options);
    }
    stopObserving() {
        __classPrivateFieldGet(this, _PortalElementContainer_observer, "f").disconnect();
    }
    connectedCallback() {
        const parent = this.parentNode;
        if (parent !== null &&
            findAncestor(parent, o => o instanceof PortalElementContainer || o instanceof PortalElement) !== undefined) {
            throw new Error('portal-element-container was inserted into a portal-element or portal-element-container');
        }
        this.startObserving();
    }
    disconnectedCallback() {
        this.stopObserving();
    }
    registerNewlyConnectedPortal(p) {
        this.initializePortalData(p.uuid).portals.add(p);
    }
    registerNewlyDisconnectedPortal(p) {
        const pd = this.initializePortalData(p.uuid);
        pd.portals.delete(p);
        if (pd.portals.size === 0) {
            __classPrivateFieldGet(this, _PortalElementContainer_registry, "f").delete(p.uuid);
        }
    }
    get registry() {
        return __classPrivateFieldGet(this, _PortalElementContainer_registry, "f");
    }
}
_PortalElementContainer_shadow = new WeakMap(), _PortalElementContainer_registry = new WeakMap(), _PortalElementContainer_observer = new WeakMap();
class PortalElement extends HTMLElement {
    constructor() {
        super();
        _PortalElement_shadow.set(this, void 0);
        _PortalElement_uuid.set(this, void 0);
        _PortalElement_observer.set(this, void 0);
        _PortalElement_state.set(this, void 0);
        __classPrivateFieldSet(this, _PortalElement_shadow, this.attachShadow({ mode: 'open' }), "f");
        __classPrivateFieldSet(this, _PortalElement_uuid, crypto.randomUUID(), "f");
        __classPrivateFieldSet(this, _PortalElement_state, undefined, "f");
        __classPrivateFieldSet(this, _PortalElement_observer, new MutationObserver((m, o) => {
            const container = findAncestor(this, a => a instanceof PortalElementContainer);
            if (container !== undefined) {
                this.stopObserving();
                observePortalElementContainerChanges(container, m, o);
                this.startObserving();
            }
        }), "f");
    }
    startObserving() {
        const options = {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
        };
        __classPrivateFieldGet(this, _PortalElement_observer, "f").observe(__classPrivateFieldGet(this, _PortalElement_shadow, "f"), options);
    }
    stopObserving() {
        __classPrivateFieldGet(this, _PortalElement_observer, "f").disconnect();
    }
    appendChild(node) {
        if (__classPrivateFieldGet(this, _PortalElement_state, "f") !== undefined) {
            return __classPrivateFieldGet(this, _PortalElement_state, "f").div.appendChild(node);
        }
        return node;
    }
    connectedCallback() {
        __classPrivateFieldSet(this, _PortalElement_state, {
            container: (() => {
                const container = findAncestor(this, a => a instanceof PortalElementContainer);
                if (container === undefined) {
                    throw new Error('portal-element outside of portal-element-container');
                }
                return container;
            })(),
            div: document.createElement('div'),
        }, "f");
        __classPrivateFieldGet(this, _PortalElement_shadow, "f").appendChild(__classPrivateFieldGet(this, _PortalElement_state, "f").div);
        __classPrivateFieldGet(this, _PortalElement_state, "f").container.registerNewlyConnectedPortal(this);
        this.startObserving();
    }
    disconnectedCallback() {
        this.stopObserving();
        if (__classPrivateFieldGet(this, _PortalElement_state, "f") !== undefined) {
            __classPrivateFieldGet(this, _PortalElement_state, "f").div.remove();
            __classPrivateFieldGet(this, _PortalElement_state, "f").container.registerNewlyDisconnectedPortal(this);
            __classPrivateFieldSet(this, _PortalElement_state, undefined, "f");
        }
    }
    // override cloneNode(deep?: boolean): Node {
    //     const result = super.cloneNode(deep) as PortalElement;
    //     result.#uuid = this.#uuid;
    //     // if (deep !== undefined && deep) {
    //     //     result.#uuid = this.#uuid;
    //     // }
    //     // this.div?.childNodes.forEach(c => {
    //     //     result.appendChild(c.cloneNode(true));
    //     // });
    //     return result;
    // }
    makeTemplate() {
        if (__classPrivateFieldGet(this, _PortalElement_state, "f") === undefined) {
            return undefined;
        }
        return __classPrivateFieldGet(this, _PortalElement_state, "f").div.cloneNode(true);
    }
    get uuid() {
        return __classPrivateFieldGet(this, _PortalElement_uuid, "f");
    }
    set uuid(uuid) {
        if (__classPrivateFieldGet(this, _PortalElement_state, "f") !== undefined) {
            this.disconnectedCallback();
            __classPrivateFieldSet(this, _PortalElement_uuid, uuid, "f");
            this.connectedCallback();
        }
        else {
            __classPrivateFieldSet(this, _PortalElement_uuid, uuid, "f");
        }
    }
    get div() {
        if (__classPrivateFieldGet(this, _PortalElement_state, "f") === undefined) {
            return undefined;
        }
        return __classPrivateFieldGet(this, _PortalElement_state, "f").div;
    }
    set div(div) {
        if (__classPrivateFieldGet(this, _PortalElement_state, "f") === undefined) {
            return;
        }
        __classPrivateFieldGet(this, _PortalElement_state, "f").div.replaceWith(div);
        __classPrivateFieldGet(this, _PortalElement_state, "f").div = div;
    }
}
_PortalElement_shadow = new WeakMap(), _PortalElement_uuid = new WeakMap(), _PortalElement_observer = new WeakMap(), _PortalElement_state = new WeakMap();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PortalElement);
customElements.define('portal-element-container', PortalElementContainer);
customElements.define('portal-element', PortalElement);

portal_element = __webpack_exports__;
/******/ })()
;