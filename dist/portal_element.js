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
/* harmony export */   "default": () => (/* binding */ PortalElement)
/* harmony export */ });
const globalPortalRegistry = new Map();
window.gpr = globalPortalRegistry;
function makePortalData() {
    return {
        template: document.createElement('div'),
        portals: [],
    };
}
function initializePortalData(r, uuid) {
    let d = r.get(uuid);
    if (d === undefined) {
        d = makePortalData();
        r.set(uuid, d);
    }
    return d;
}
function syncToPortals(r, uuid) {
    const pd = initializePortalData(r, uuid);
    pd.portals.forEach(p => {
        var _a;
        const clonedTemplate = pd.template.cloneNode(true);
        (_a = p.div) === null || _a === void 0 ? void 0 : _a.replaceWith(clonedTemplate);
        p.div = clonedTemplate;
    });
}
function replacePortalsWithExits(n) {
    n.childNodes.forEach(c => {
        if (c instanceof PortalElement) {
            const newChild = document.createElement('portal-exit');
            newChild.uuid = c.uuid;
            n.replaceChild(newChild, c);
        }
        else {
            replacePortalsWithExits(c);
        }
    });
}
function replaceExitsWithPortals(r, n) {
    const RECURSION_LIMIT = 8;
    function go(depth, n) {
        if (depth >= RECURSION_LIMIT) {
            return;
        }
        n.childNodes.forEach(c => {
            if (c instanceof PortalExit) {
                const newChild = document.createElement('portal-element');
                if (c.uuid === undefined) {
                    throw new Error('undefined uuid in portal exit');
                }
                newChild.uuid = c.uuid;
            }
        });
    }
    go(0, n);
}
function syncFromPortal(r, uuid, div) {
    const pd = initializePortalData(r, uuid);
    pd.template = div.cloneNode(true);
    replacePortalsWithExits(pd.template);
    syncToPortals(r, uuid);
}
class PortalExit extends HTMLElement {
    constructor() {
        super();
        this.uuid = undefined;
    }
}
class PortalElement extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.div = undefined;
        this.observer = new MutationObserver((m, o) => observe(this, m, o));
        this.uuid = crypto.randomUUID();
        const options = {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
        };
        this.observer.observe(this, options);
        this.depth = 0;
    }
    connectedCallback() {
        console.log('connectedCallback');
        this.div = document.createElement('div');
        this.shadow.appendChild(this.div);
        const pd = initializePortalData(globalPortalRegistry, this.uuid);
        pd.portals.push(this);
        syncToPortals(globalPortalRegistry, this.uuid);
    }
    disconnectedCallback() {
        console.log('disconnectedCallback');
    }
    adoptedCallback() {
        console.log('adoptedCallback');
    }
    appendChild(node) {
        if (node instanceof PortalElement) {
            const clonedNode = node.cloneNode(true);
            clonedNode.uuid = node.uuid;
            console.log('recursive instantiation', node, clonedNode);
            super.appendChild(clonedNode);
            const pd = initializePortalData(globalPortalRegistry, clonedNode.uuid);
            pd.portals.push(clonedNode);
            if (this.div !== undefined) {
                syncFromPortal(globalPortalRegistry, this.uuid, this.div);
            }
            syncToPortals(globalPortalRegistry, clonedNode.uuid);
            return clonedNode;
        }
        else {
            return super.appendChild(node);
        }
    }
}
function handleAttributeChange(p, m) {
    console.log(m);
}
function handleCharacterDataChange(p, m) {
    console.log(m);
}
function handleChildListChange(p, m) {
    console.log(m);
    if (p.div !== undefined) {
        m.addedNodes.forEach(n => {
            var _a;
            (_a = p.div) === null || _a === void 0 ? void 0 : _a.appendChild(n);
        });
        syncFromPortal(globalPortalRegistry, p.uuid, p.div);
    }
}
function observe(p, mutations, observer) {
    mutations.forEach(m => {
        switch (m.type) {
            case 'attributes':
                handleAttributeChange(p, m);
                break;
            case 'characterData':
                handleCharacterDataChange(p, m);
                break;
            case 'childList':
                handleChildListChange(p, m);
                break;
        }
    });
}
customElements.define('portal-exit', PortalExit);

portal_element = __webpack_exports__;
/******/ })()
;