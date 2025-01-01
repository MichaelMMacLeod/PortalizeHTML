var portal_element;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 958:
/***/ (function() {


var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PortalElement_shadow, _PortalElement_registry, _PortalElement_observer, _PortalElement_portalIDAttribute;
const MAX_RECURSION_DEPTH = 10;
function observeChanges(pe, m, _mo) {
    m.forEach(mr => {
        pe.observeChange(mr);
    });
}
function portalID(portalIDAttribute, e) {
    const result = e.getAttribute(portalIDAttribute);
    if (result !== null) {
        return result;
    }
    return undefined;
}
function makePortalData(template) {
    return {
        template,
        portals: new Set(),
    };
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
function makeTemplate(portalIDAttribute, n) {
    let isTopLevel = true;
    return cloneNodeFilterMap(n, n => {
        if (isTopLevel) {
            return { result: n, visitChildren: true };
        }
        isTopLevel = false;
        if (!(n instanceof Element)) {
            return { result: n, visitChildren: false };
        }
        const id = portalID(portalIDAttribute, n);
        if (id !== undefined) {
            return { result: n, visitChildren: false };
        }
        return { result: n, visitChildren: true };
    });
}
function findAncestor(n, isCorrectNode) {
    let current = n;
    while (true) {
        if (isCorrectNode(current)) {
            return current;
        }
        if (current.parentNode === null) {
            return undefined;
        }
        current = current.parentNode;
    }
}
class PortalElement extends HTMLElement {
    constructor() {
        super();
        _PortalElement_shadow.set(this, void 0);
        _PortalElement_registry.set(this, void 0);
        _PortalElement_observer.set(this, void 0);
        _PortalElement_portalIDAttribute.set(this, void 0);
        __classPrivateFieldSet(this, _PortalElement_shadow, this.attachShadow({ mode: 'open' }), "f");
        __classPrivateFieldSet(this, _PortalElement_registry, new Map(), "f");
        __classPrivateFieldSet(this, _PortalElement_observer, new MutationObserver((m, o) => observeChanges(this, m, o)), "f");
        __classPrivateFieldSet(this, _PortalElement_portalIDAttribute, 'portal-id', "f");
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
    connectedCallback() {
        this.startObserving();
    }
    disconnectedCallback() {
        this.stopObserving();
    }
    appendChild(node) {
        return __classPrivateFieldGet(this, _PortalElement_shadow, "f").appendChild(node);
    }
    expandTemplatesInNode(node, deletions, additions, depth = 0) {
        if (depth >= MAX_RECURSION_DEPTH) {
            return;
        }
        if (!(node instanceof Element)) {
            return;
        }
        const id = portalID(__classPrivateFieldGet(this, _PortalElement_portalIDAttribute, "f"), node);
        let nextDepth = depth;
        if (id !== undefined) {
            const pd = __classPrivateFieldGet(this, _PortalElement_registry, "f").get(id);
            if (pd === undefined) {
                throw new Error('undefined pd');
            }
            const tClone = pd.template.cloneNode(true);
            node.replaceWith(tClone);
            deletions.push({ id, value: node });
            additions.push({ id, value: tClone });
            node = tClone;
            nextDepth = depth + 1;
        }
        node.childNodes.forEach(n => {
            this.expandTemplatesInNode(n, deletions, additions, nextDepth);
        });
    }
    expandTemplates(id) {
        const pd = __classPrivateFieldGet(this, _PortalElement_registry, "f").get(id);
        if (pd === undefined) {
            throw new Error('pd undefined');
        }
        const deletions = [];
        const additions = [];
        pd.portals.forEach(p => {
            this.expandTemplatesInNode(p, deletions, additions);
        });
        deletions.forEach(d => {
            const pd = __classPrivateFieldGet(this, _PortalElement_registry, "f").get(d.id);
            if (pd === undefined) {
                throw new Error('pd undefined');
            }
            pd.portals.delete(d.value);
        });
        additions.forEach(d => {
            const pd = __classPrivateFieldGet(this, _PortalElement_registry, "f").get(d.id);
            if (pd === undefined) {
                throw new Error('pd undefined');
            }
            pd.portals.add(d.value);
        });
    }
    observeNodeRemoved(n) {
    }
    observeNodeAdded(n) {
        if (!(n instanceof Element)) {
            console.log('non-element node added', n);
            return;
        }
        const id = portalID(__classPrivateFieldGet(this, _PortalElement_portalIDAttribute, "f"), n);
        if (id !== undefined) {
            const pd = __classPrivateFieldGet(this, _PortalElement_registry, "f").get(id);
            if (pd !== undefined) {
                const pdTemplateClone = pd.template.cloneNode(true);
                n.replaceWith(pdTemplateClone);
                n = pdTemplateClone;
                pd.portals.add(n);
            }
            else {
                const t = makeTemplate(__classPrivateFieldGet(this, _PortalElement_portalIDAttribute, "f"), n);
                const pd = makePortalData(t);
                pd.portals.add(n);
                __classPrivateFieldGet(this, _PortalElement_registry, "f").set(id, pd);
            }
        }
        let isN = true;
        const enclosingPortal = findAncestor(n, n => {
            if (isN) {
                isN = false;
                return false;
            }
            if (!(n instanceof Element)) {
                return false;
            }
            return portalID(__classPrivateFieldGet(this, _PortalElement_portalIDAttribute, "f"), n) !== undefined;
        });
        if (enclosingPortal !== undefined) {
            if (!(enclosingPortal instanceof Element)) {
                throw new Error('enclosingPortal not an Element');
            }
            const id = portalID(__classPrivateFieldGet(this, _PortalElement_portalIDAttribute, "f"), enclosingPortal);
            if (id === undefined) {
                throw new Error('id undefined');
            }
            const pd = __classPrivateFieldGet(this, _PortalElement_registry, "f").get(id);
            if (pd === undefined) {
                throw new Error('pd undefined');
            }
            pd.template = makeTemplate(__classPrivateFieldGet(this, _PortalElement_portalIDAttribute, "f"), enclosingPortal);
            this.expandTemplates(id);
        }
        if (id !== undefined) {
            this.expandTemplates(id);
        }
    }
    observeAttributeChange(n, attributeName) {
        // TODO if attribute name is portal-id
        const enclosingPortal = findAncestor(n, n => {
            if (!(n instanceof Element)) {
                return false;
            }
            return portalID(__classPrivateFieldGet(this, _PortalElement_portalIDAttribute, "f"), n) !== undefined;
        });
        if (enclosingPortal !== undefined) {
            if (!(enclosingPortal instanceof Element)) {
                throw new Error('enclosingPortal not element');
            }
            const id = portalID(__classPrivateFieldGet(this, _PortalElement_portalIDAttribute, "f"), enclosingPortal);
            if (id === undefined) {
                throw new Error('id undefined');
            }
            const pd = __classPrivateFieldGet(this, _PortalElement_registry, "f").get(id);
            if (pd === undefined) {
                throw new Error('pd undefined');
            }
            pd.template = makeTemplate(__classPrivateFieldGet(this, _PortalElement_portalIDAttribute, "f"), enclosingPortal);
            const newPortals = [];
            pd.portals.forEach(p => {
                const templateClone = pd.template.cloneNode(true);
                if (!(p instanceof Element)) {
                    throw new Error('non element portal');
                }
                p.replaceWith(templateClone);
                newPortals.push(templateClone);
            });
            pd.portals.clear();
            newPortals.forEach(p => pd.portals.add(p));
            this.expandTemplates(id);
        }
    }
    observeChange(mr) {
        this.stopObserving();
        console.log(mr);
        switch (mr.type) {
            case 'attributes':
                if (mr.attributeName === null) {
                    throw new Error('null attribute name');
                }
                this.observeAttributeChange(mr.target, mr.attributeName);
                break;
            case 'characterData':
                break;
            case 'childList':
                mr.removedNodes.forEach(n => {
                    this.observeNodeRemoved(n);
                });
                mr.addedNodes.forEach(n => {
                    this.observeNodeAdded(n);
                });
                break;
        }
        this.startObserving();
    }
}
_PortalElement_shadow = new WeakMap(), _PortalElement_registry = new WeakMap(), _PortalElement_observer = new WeakMap(), _PortalElement_portalIDAttribute = new WeakMap();
customElements.define('portal-element', PortalElement);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__[958]();
/******/ 	portal_element = __webpack_exports__;
/******/ 	
/******/ })()
;