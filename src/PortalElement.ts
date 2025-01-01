// type UUID = `${string}-${string}-${string}-${string}-${string}`;

class Portal {
    #node: Node;

    constructor(node: Node) {
        this.#node = node;
    }

    get node() {
        return this.#node;
    }
}

export default class PortalManager {
    #registry: WeakMap<Portal, Set<WeakRef<Portal>>>;
    #revRegistry: Map<Node, Portal>;

    constructor() {
        this.#registry = new Map();
    }

    register(n: Node): Portal {
        const p = new Portal(n);
        this.#registry.set(p, new Set([new WeakRef(p)]));
        return p;
    }

    duplicate(p: Portal): Portal {
        const portals = this.#registry.get(p);
        if (portals === undefined) {
            throw new Error('portal is not registered');
        }
        const pNew = new Portal(p.node);
        portals.add(pNew);
        return pNew;
    }

    replaceNode(p: Portal, newNode: Node): void {
        
    }

    observeNodeAdded(n: Node): void {

    }

    observeNodeRemoved(n: Node): void {

    }

    observeAttributeChanged(n: Node, attributeName: string): void {

    }
}

// type PortalData = {
//     template: Node,
//     portals: Set<Node>,
// };
// type PortalRegistry = Map<Node, PortalData>;
// const MAX_RECURSION_DEPTH = 10;

// function observeChanges(pe: PortalElement, m: Array<MutationRecord>, _mo: MutationObserver): void {
//     m.forEach(mr => {
//         pe.observeChange(mr);
//     });
// }

// type CloneNodeFilterMapFunctionResult = {
//     result: Node,
//     visitChildren: boolean,
// };

// type CloneNodeFilterMapFunction = (n: Node) => CloneNodeFilterMapFunctionResult;

// function makePortalData(template: Node): PortalData {
//     return {
//         template,
//         portals: new Set(),
//     }
// }

// function cloneNodeFilterMapImpl(n: Node, filterMap: CloneNodeFilterMapFunction): CloneNodeFilterMapFunctionResult {
//     const nClone = filterMap(n.cloneNode());
//     if (nClone.visitChildren) {
//         n.childNodes.forEach(cn => {
//             const cnClone = cloneNodeFilterMapImpl(cn, filterMap);
//             nClone.result.appendChild(cnClone.result);
//         });
//     }
//     return nClone;
// }

// function cloneNodeFilterMap(n: Node, filterMap: CloneNodeFilterMapFunction): Node {
//     return cloneNodeFilterMapImpl(n, filterMap).result;
// }


// function findAncestor(n: Node, isCorrectNode: (o: Node) => boolean): Node | undefined {
//     let current = n;
//     while (true) {
//         if (isCorrectNode(current)) {
//             return current;
//         }
//         if (current.parentNode === null) {
//             return undefined;
//         }
//         current = current.parentNode;
//     }
// }

// class PortalElement extends HTMLElement {
//     #shadow: ShadowRoot;
//     #registry: PortalRegistry;
//     #observer: MutationObserver;

//     constructor() {
//         super();
//         this.#shadow = this.attachShadow({ mode: 'open' });
//         this.#registry = new Map();
//         this.#observer = new MutationObserver((m, o) => observeChanges(this, m, o));
//     }

//     registerAsNewPortal(n: Node): UUID {
        
//     }

//     unregisterPortal(portal: UUID): void {

//     }

//     replaceWithPortal(n: Node, portal: UUID): Node {

//     }

//     makeTemplate(n: Node): Node {
//         let isTopLevel = true;
//         return cloneNodeFilterMap(n, n => {
//             if (isTopLevel) {
//                 isTopLevel = false;
//                 return { result: n, visitChildren: true };
//             }
//             if (!(n instanceof Element)) {
//                 return { result: n, visitChildren: false };
//             }
//             if (this.#registry.has(n)) {
//                 return { result: n, visitChildren: false };
//             }
//             return { result: n, visitChildren: true };
//         });
//     }

//     startObserving() {
//         const options: MutationObserverInit = {
//             attributes: true,
//             characterData: true,
//             childList: true,
//             subtree: true,
//         };
//         this.#observer.observe(this.#shadow, options);
//     }

//     stopObserving() {
//         this.#observer.disconnect();
//     }

//     connectedCallback() {
//         this.startObserving();
//     }

//     disconnectedCallback() {
//         this.stopObserving();
//     }

//     override appendChild<T extends Node>(node: T): T {
//         return this.#shadow.appendChild(node);
//     }

//     override get childNodes(): NodeListOf<ChildNode> {
//         return this.#shadow.childNodes
//     }

//     expandTemplatesInNode(
//         node: Node,
//         deletions: Array<Node>,
//         additions: Array<[Node, PortalData]>,
//         depth: number = 0
//     ): void {
//         if (depth >= MAX_RECURSION_DEPTH) {
//             return;
//         }
//         if (!(node instanceof Element)) {
//             return;
//         }
//         const pd = this.#registry.get(node);
//         let nextDepth = depth;
//         if (pd !== undefined) {
//             const tClone = pd.template.cloneNode(true);
//             node.replaceWith(tClone);
//             deletions.push(node);
//             additions.push([tClone, pd]);
//             node = tClone;
//             nextDepth = depth + 1;
//         }
//         node.childNodes.forEach(n => {
//             this.expandTemplatesInNode(n, deletions, additions, nextDepth);
//         })
//     }

//     expandTemplates(pd: PortalData): void {
//         const deletions: Array<Node> = [];
//         const additions: Array<[Node, PortalData]> = [];
//         pd.portals.forEach(p => {
//             this.expandTemplatesInNode(p, deletions, additions);
//         });
//         deletions.forEach(d => {
//             const pd = this.#registry.get(d);
//             if (pd === undefined) {
//                 throw new Error('pd undefined');
//             }
//             pd.portals.delete(d);
//             this.#registry.delete(d);
//         });
//         additions.forEach(([d, pd]) => {
//             pd.portals.add(d);
//             this.#registry.set(d, pd);
//         });
//     }

//     observeNodeRemoved(n: Node): void {

//     }

//     observeNodeAdded(n: Node): void {
//         if (!(n instanceof Element)) {
//             console.log('non-element node added', n);
//             return;
//         }

//         const pd = this.#registry.get(n);
//         if (pd !== undefined) {
//             const pdTemplateClone = pd.template.cloneNode(true);
//             n.replaceWith(pdTemplateClone);
//             n = pdTemplateClone;
//             pd.portals.add(n);
//         } else {
//             const t = this.makeTemplate(n);
//             const pd = makePortalData(t);
//             pd.portals.add(n);
//             this.#registry.set(n, pd);
//         }

//         let isN = true;
//         const enclosingPortal = findAncestor(n, n => {
//             if (isN) {
//                 isN = false;
//                 return false;
//             }
//             if (!(n instanceof Element)) {
//                 return false;
//             }
//             return this.#registry.has(n);
//         });
//         if (enclosingPortal !== undefined) {
//             if (!(enclosingPortal instanceof Element)) {
//                 throw new Error('enclosingPortal not an Element');
//             }
//             const pd = this.#registry.get(enclosingPortal);
//             if (pd === undefined) {
//                 throw new Error('pd undefined');
//             }
//             pd.template = this.makeTemplate(enclosingPortal);
//             this.expandTemplates(pd);
//         }

//         if (pd !== undefined) {
//             this.expandTemplates(pd);
//         }
//     }

//     observeAttributeChange(n: Node, attributeName: string): void {
//         // TODO if attribute name is portal-id

//         const enclosingPortal = findAncestor(n, n => {
//             if (!(n instanceof Element)) {
//                 return false;
//             }
//             return this.#registry.has(n);
//         });
//         if (enclosingPortal !== undefined) {
//             if (!(enclosingPortal instanceof Element)) {
//                 throw new Error('enclosingPortal not element');
//             }
//             const pd = this.#registry.get(enclosingPortal);
//             if (pd === undefined) {
//                 throw new Error('pd undefined');
//             }
//             pd.template = this.makeTemplate(enclosingPortal);
//             const newPortals: Array<Node> = [];
//             pd.portals.forEach(p => {
//                 const templateClone = pd.template.cloneNode(true);
//                 if (!(p instanceof Element)) {
//                     throw new Error('non element portal');
//                 }
//                 p.replaceWith(templateClone);
//                 newPortals.push(templateClone);
//             });
//             pd.portals.clear();
//             newPortals.forEach(p => pd.portals.add(p));
//             this.expandTemplates(pd);
//         }
//     }

//     observeChange(mr: MutationRecord): void {
//         this.stopObserving();

//         console.log(mr);

//         switch (mr.type) {
//             case 'attributes':
//                 if (mr.attributeName === null) {
//                     throw new Error('null attribute name');
//                 }
//                 this.observeAttributeChange(mr.target, mr.attributeName);
//                 break;
//             case 'characterData':
//                 break;
//             case 'childList':
//                 mr.removedNodes.forEach(n => {
//                     this.observeNodeRemoved(n);
//                 });
//                 mr.addedNodes.forEach(n => {
//                     this.observeNodeAdded(n);
//                 });
//                 break;
//         }

//         this.startObserving();
//     }
// }

// customElements.define('portal-element', PortalElement);
