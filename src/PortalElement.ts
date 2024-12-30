// type UUID = `${string}-${string}-${string}-${string}-${string}`;
type PortalData = {
    template: Node,
    portals: Set<Node>,
};
type PortalRegistry = Map<string, PortalData>;
const MAX_RECURSION_DEPTH = 10;

function observeChanges(pe: PortalElement, m: Array<MutationRecord>, _mo: MutationObserver): void {
    m.forEach(mr => {
        pe.observeChange(mr);
    });
}

function portalID(portalIDAttribute: string, e: Element): string | undefined {
    const result = e.getAttribute(portalIDAttribute);
    if (result !== null) {
        return result;
    }
    return undefined;
}

type CloneNodeFilterMapFunctionResult = {
    result: Node,
    visitChildren: boolean,
};

type CloneNodeFilterMapFunction = (n: Node) => CloneNodeFilterMapFunctionResult;

function makePortalData(template: Node): PortalData {
    return {
        template,
        portals: new Set(),
    }
}

function cloneNodeFilterMapImpl(n: Node, filterMap: CloneNodeFilterMapFunction): CloneNodeFilterMapFunctionResult {
    const nClone = filterMap(n.cloneNode());
    if (nClone.visitChildren) {
        n.childNodes.forEach(cn => {
            const cnClone = cloneNodeFilterMapImpl(cn, filterMap);
            nClone.result.appendChild(cnClone.result);
        });
    }
    return nClone;
}

function cloneNodeFilterMap(n: Node, filterMap: CloneNodeFilterMapFunction): Node {
    return cloneNodeFilterMapImpl(n, filterMap).result;
}

function makeTemplate(portalIDAttribute: string, n: Node): Node {
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

function findAncestor(n: Node, isCorrectNode: (o: Node) => boolean): Node | undefined {
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

type AddDelElement = { id: string, value: Node };

class PortalElement extends HTMLElement {
    #shadow: ShadowRoot;
    #registry: PortalRegistry;
    #observer: MutationObserver;
    #portalIDAttribute: string;

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'open' });
        this.#registry = new Map();
        this.#observer = new MutationObserver((m, o) => observeChanges(this, m, o));
        this.#portalIDAttribute = 'portal-id';
    }

    startObserving() {
        const options: MutationObserverInit = {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
        };
        this.#observer.observe(this.#shadow, options);
    }

    stopObserving() {
        this.#observer.disconnect();
    }

    connectedCallback() {
        this.startObserving();
    }

    disconnectedCallback() {
        this.stopObserving();
    }

    override appendChild<T extends Node>(node: T): T {
        return this.#shadow.appendChild(node);
    }

    expandTemplatesInNode(
        node: Node,
        deletions: Array<AddDelElement>,
        additions: Array<AddDelElement>,
        depth: number = 0
    ): void {
        if (depth >= MAX_RECURSION_DEPTH) {
            return;
        }
        if (!(node instanceof Element)) {
            return;
        }
        const id = portalID(this.#portalIDAttribute, node);
        let nextDepth = depth;
        if (id !== undefined) {
            const pd = this.#registry.get(id);
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
        })
    }

    expandTemplates(id: string): void {
        const pd = this.#registry.get(id);
        if (pd === undefined) {
            throw new Error('pd undefined');
        }
        const deletions: Array<AddDelElement> = [];
        const additions: Array<AddDelElement> = [];
        pd.portals.forEach(p => {
            this.expandTemplatesInNode(p, deletions, additions);
        });
        deletions.forEach(d => {
            const pd = this.#registry.get(d.id);
            if (pd === undefined) {
                throw new Error('pd undefined');
            }
            pd.portals.delete(d.value);
        });
        additions.forEach(d => {
            const pd = this.#registry.get(d.id);
            if (pd === undefined) {
                throw new Error('pd undefined');
            }
            pd.portals.add(d.value);
        });
    }

    observeNodeRemoved(n: Node): void {

    }

    observeNodeAdded(n: Node): void {
        if (!(n instanceof Element)) {
            console.log('non-element node added', n);
            return;
        }

        const id = portalID(this.#portalIDAttribute, n);
        if (id !== undefined) {
            const pd = this.#registry.get(id);
            if (pd !== undefined) {
                const pdTemplateClone = pd.template.cloneNode(true);
                n.replaceWith(pdTemplateClone);
                n = pdTemplateClone;
                pd.portals.add(n);
            } else {
                const t = makeTemplate(this.#portalIDAttribute, n);
                const pd = makePortalData(t);
                pd.portals.add(n);
                this.#registry.set(id, pd);
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
            return portalID(this.#portalIDAttribute, n) !== undefined;
        });
        if (enclosingPortal !== undefined) {
            if (!(enclosingPortal instanceof Element)) {
                throw new Error('enclosingPortal not an Element');
            }
            const id = portalID(this.#portalIDAttribute, enclosingPortal);
            if (id === undefined) {
                throw new Error('id undefined');
            }
            const pd = this.#registry.get(id);
            if (pd === undefined) {
                throw new Error('pd undefined');
            }
            pd.template = makeTemplate(this.#portalIDAttribute, enclosingPortal);
            this.expandTemplates(id);
        }

        if (id !== undefined) {
            this.expandTemplates(id);
        }
    }

    observeAttributeChange(n: Node, attributeName: string): void {
        // TODO if attribute name is portal-id

        const enclosingPortal = findAncestor(n, n => {
            if (!(n instanceof Element)) {
                return false;
            }
            return portalID(this.#portalIDAttribute, n) !== undefined;
        });
        if (enclosingPortal !== undefined) {
            if (!(enclosingPortal instanceof Element)) {
                throw new Error('enclosingPortal not element');
            }
            const id = portalID(this.#portalIDAttribute, enclosingPortal);
            if (id === undefined) {
                throw new Error('id undefined');
            }
            const pd = this.#registry.get(id);
            if (pd === undefined) {
                throw new Error('pd undefined');
            }
            pd.template = makeTemplate(this.#portalIDAttribute, enclosingPortal);
            const newPortals: Array<Node> = [];
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

    observeChange(mr: MutationRecord): void {
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

customElements.define('portal-element', PortalElement);

//
// class PortalElementContainer extends HTMLElement {
//     #shadow: ShadowRoot;
//     #registry: PortalRegistry;
//     #observer: MutationObserver;

//     constructor() {
//         super();
//         this.#shadow = this.attachShadow({ mode: 'open' });
//         this.#registry = new Map();
//         this.#observer = new MutationObserver((m, o) => observePortalElementContainerChanges(this, m, o));
//     }

//     override appendChild<T extends Node>(node: T): T {
//         return this.#shadow.appendChild(node);
//     }

//     initializePortalData(uuid: UUID): PortalData {
//         let d = this.#registry.get(uuid);
//         if (d === undefined) {
//             d = makePortalData();
//             this.#registry.set(uuid, d);
//         }
//         return d;
//     }

//     expandPortals(node: Node, depth: number = 0): void {
//         if (depth >= RECURSION_DEPTH) {
//             return;
//         }
//         const children: NodeListOf<ChildNode> = (() => {
//             if (node instanceof PortalElement) {
//                 if (node.div === undefined) {
//                     return new NodeList() as NodeListOf<ChildNode>;
//                 }
//                 const pd = this.initializePortalData(node.uuid);
//                 node.stopObserving();
//                 node.div = pd.template.cloneNode(true) as HTMLDivElement;
//                 node.startObserving();
//                 return node.div.childNodes;
//             }
//             return node.childNodes;
//         })();
//         const newDepth = node instanceof PortalElement ? depth + 1 : depth;
//         children.forEach(c => {
//             this.expandPortals(c, newDepth);
//         })
//     }

//     installTemplate(uuid: UUID): void {
//         const pd = this.initializePortalData(uuid);
//         pd.portals.forEach(p => {
//             this.expandPortals(p);
//         });
//     }

//     observePortalElementContainerChange(m: MutationRecord): void {
//         this.stopObserving();

//         const portal = findAncestor(m.target, n => n instanceof PortalElement || n instanceof PortalElementContainer);
//         if (portal instanceof PortalElementContainer) {
//             m.addedNodes.forEach(n => {
//                 if (n instanceof PortalElement) {
//                     const portal = n;
//                     const pd = this.initializePortalData(portal.uuid);
//                     const template = portal.makeTemplate();
//                     if (template === undefined) {
//                         throw new Error('undefined template');
//                     }
//                     pd.template = template;
//                     this.installTemplate(portal.uuid);
//                 }
//             });
//         } else if (portal instanceof PortalElement) {
//             const pd = this.initializePortalData(portal.uuid);
//             const template = portal.makeTemplate();
//             if (template === undefined) {
//                 throw new Error('undefined template');
//             }
//             pd.template = template;
//             this.installTemplate(portal.uuid);
//         }

//         this.startObserving();
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

//     connectedCallback(): void {
//         const parent = this.parentNode;
//         if (parent !== null &&
//             findAncestor(parent, o => o instanceof PortalElementContainer || o instanceof PortalElement) !== undefined) {
//             throw new Error('portal-element-container was inserted into a portal-element or portal-element-container');
//         }
//         this.startObserving();
//     }

//     disconnectedCallback(): void {
//         this.stopObserving();
//     }

//     registerNewlyConnectedPortal(p: PortalElement): void {
//         this.initializePortalData(p.uuid).portals.add(p);
//     }

//     registerNewlyDisconnectedPortal(p: PortalElement): void {
//         const pd = this.initializePortalData(p.uuid);
//         pd.portals.delete(p);
//         if (pd.portals.size === 0) {
//             this.#registry.delete(p.uuid);
//         }
//     }

//     get registry(): PortalRegistry {
//         return this.#registry;
//     }
// }

// type PortalElementState = {
//     container: PortalElementContainer,
//     div: HTMLDivElement,
// };

// export default class PortalElement extends HTMLElement {
//     #shadow: ShadowRoot;
//     #uuid: UUID;
//     #observer: MutationObserver;
//     #state: PortalElementState | undefined;

//     constructor() {
//         super();
//         this.#shadow = this.attachShadow({ mode: 'open' });
//         this.#uuid = crypto.randomUUID();
//         this.#state = undefined;
//         this.#observer = new MutationObserver((m, o) => {
//             const container = findAncestor(this, a => a instanceof PortalElementContainer);
//             if (container !== undefined) {
//                 this.stopObserving();
//                 observePortalElementContainerChanges(container, m, o)
//                 this.startObserving();
//             }
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

//     override appendChild<T extends Node>(node: T): T {
//         if (this.#state !== undefined) {
//             return this.#state.div.appendChild(node);
//         }
//         return node;
//     }

//     connectedCallback() {
//         this.#state = {
//             container: (() => {
//                 const container = findAncestor(this, a => a instanceof PortalElementContainer);
//                 if (container === undefined) {
//                     throw new Error('portal-element outside of portal-element-container');
//                 }
//                 return container;
//             })(),
//             div: document.createElement('div'),
//         };
//         this.#shadow.appendChild(this.#state.div);
//         this.#state.container.registerNewlyConnectedPortal(this);
//         this.startObserving();
//     }

//     disconnectedCallback() {
//         this.stopObserving();
//         if (this.#state !== undefined) {
//             this.#state.div.remove();
//             this.#state.container.registerNewlyDisconnectedPortal(this);
//             this.#state = undefined;
//         }
//     }

//     // override cloneNode(deep?: boolean): Node {
//     //     const result = super.cloneNode(deep) as PortalElement;
//     //     result.#uuid = this.#uuid;
//     //     // if (deep !== undefined && deep) {
//     //     //     result.#uuid = this.#uuid;
//     //     // }
//     //     // this.div?.childNodes.forEach(c => {
//     //     //     result.appendChild(c.cloneNode(true));
//     //     // });
//     //     return result;
//     // }

//     makeTemplate(): HTMLDivElement | undefined {
//         if (this.#state === undefined) {
//             return undefined;
//         }
//         return this.#state.div.cloneNode(true) as HTMLDivElement;
//     }

//     get uuid(): UUID {
//         return this.#uuid;
//     }

//     set uuid(uuid: UUID) {
//         if (this.#state !== undefined) {
//             this.disconnectedCallback();
//             this.#uuid = uuid;
//             this.connectedCallback();
//         } else {
//             this.#uuid = uuid;
//         }
//     }

//     get div(): HTMLDivElement | undefined {
//         if (this.#state === undefined) {
//             return undefined;
//         }
//         return this.#state.div;
//     }

//     set div(div: HTMLDivElement) {
//         if (this.#state === undefined) {
//             return;
//         }
//         this.#state.div.replaceWith(div);
//         this.#state.div = div;
//     }
// }
