export class PortalPlaceholder extends HTMLElement {
    #portalID: number | undefined;

    constructor() {
        super();
    }

    set portalID(portalID: number) {
        this.#portalID = portalID;
    }

    get portalID(): number | undefined {
        return this.#portalID;
    }
}
customElements.define('portal-placeholder', PortalPlaceholder);

class PortalData {
    portalID: number;
    template: Element;
    portals: Set<Element>;

    constructor(portalID: number, template: Element) {
        this.portalID = portalID;
        this.template = template;
        this.portals = new Set();
    }

    cloneTemplate(): Element {
        return this.template.cloneNode(true) as Element;
    }
}

type CloneNodeFilterMapFunctionResult = {
    result: Node,
    visitChildren: boolean,
};

type CloneNodeFilterMapFunction = (n: Node) => CloneNodeFilterMapFunctionResult;

function cloneNodeFilterMapImpl(n: Node, filterMap: CloneNodeFilterMapFunction): CloneNodeFilterMapFunctionResult {
    const nClone = filterMap(n);
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

function* childrenDFS(n: Node): Generator<Node> {
    const stack = [n];
    while (stack.length > 0) {
        const n = stack.pop() as Node;
        for (const c of n.childNodes) {
            yield c;
            stack.push(c);
        }
    }
}

function* ancestors(node: Node): Generator<Node> {
    let n: Node | null = node;
    while (n !== null) {
        n = n.parentNode;
        if (n !== null) {
            yield n;
        }
    }
}

function* ancestorsIncludingSelf(node: Node): Generator<Node> {
    yield node;
    yield* ancestors(node);
}

export default class PortalManager {
    #_nextID: number;
    #elementMap: Map<Element, PortalData>;
    #portalIDMap: Map<number, PortalData>;

    constructor() {
        this.#_nextID = 0;
        this.#elementMap = new Map();
        this.#portalIDMap = new Map();
    }

    get unsafeElementMap() {
        return this.#elementMap;
    }

    get unsafePortalIDMap() {
        return this.#portalIDMap;
    }

    get nextID(): number {
        return this.#_nextID++;
    }

    makeTemplate(e: Element): Element {
        let isTopLevel = true;
        const eClone = cloneNodeFilterMap(e, n => {
            if (isTopLevel) {
                isTopLevel = false;
                return { result: n.cloneNode(), visitChildren: true };
            }
            if (!(n instanceof Element)) {
                return { result: n.cloneNode(), visitChildren: true };
            }
            const pd = this.#elementMap.get(n);
            if (pd !== undefined) {
                const result = document.createElement('portal-placeholder') as PortalPlaceholder;
                result.portalID = pd.portalID;
                return {
                    result,
                    visitChildren: false,
                };
            }
            return { result: n.cloneNode(), visitChildren: true };
        });
        return eClone as Element;
    }

    createElementPortal<K extends keyof HTMLElementTagNameMap>(
        tagName: K, options?: ElementCreationOptions
    ): HTMLElementTagNameMap[K] {
        const e = document.createElement(tagName, options);
        const pd = new PortalData(this.nextID, this.makeTemplate(e));
        this.#portalIDMap.set(pd.portalID, pd);
        const result = pd.cloneTemplate() as HTMLElementTagNameMap[K];
        pd.portals.add(result);
        this.#elementMap.set(result, pd);
        return result;
    }

    portalContainingNode(n: Node): Element | undefined {
        for (const a of ancestors(n)) {
            if (a instanceof Element) {
                if (this.#elementMap.has(a)) {
                    return a;
                }
            }
        }
        return undefined;
    }

    expandPlaceholders(n: Node): void {

    }

    updateChangedPortal(changedPortal: Element): PortalData {
        const pd = this.#elementMap.get(changedPortal);
        if (pd === undefined) {
            throw new Error('pd undefined');
        }
        pd.template = this.makeTemplate(changedPortal);
        const additions = [];
        const deletions = [];
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
        for (const p of pd.portals) {
            this.expandPlaceholders(p);
        }
        return pd;
    }

    // Returns the portal data of the containing portal, if there is one.
    updatePortalsContainingChangedNode(node: Node): PortalData | undefined {
        const containingPortal = this.portalContainingNode(node);
        if (containingPortal !== undefined) {
            return this.updateChangedPortal(containingPortal);
        } else {
            return undefined;
        }
    }

    observeNodeChanged(node: Node): void {
        if (node instanceof Element && this.#elementMap.has(node)) {
            this.updateChangedPortal(node);
        }
        this.updatePortalsContainingChangedNode(node);
    }

    appendChild(parent: Node, e: Element): Element {
        const pd = this.#elementMap.get(e);
        const oldE = e;
        if (pd !== undefined) {
            e = pd.cloneTemplate();
            this.#elementMap.set(e, pd);
            pd.portals.add(e);
        } else {
            e = this.makeTemplate(e);
        }
        oldE.innerHTML = '<p>Use the return result of appendChild instead of this node</p>';
        parent.appendChild(e);
        if (this.updatePortalsContainingChangedNode(e) === undefined) {
            this.expandPlaceholders(e);
        }
        return e;
    }


    // private nodeContainsPortalChild(n: Node): boolean {
    //     for (const c of childrenDFS(n)) {
    //         if (c instanceof Element && this.#elementMap.has(c)) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }
    // private initialize(e: Element): PortalData {
    //     let pd = this.#registry.get(e);
    //     if (pd !== undefined) {
    //         return pd;
    //     }
    //     pd = new PortalData(this.makeTemplate(e));
    //     this.#registry.set(e, pd);
    //     return pd;
    // }


    // expandPortals(node: Node) {

    // }

    // appendChildPortal(parent: Node, e: Element): Element {
    //     let pd = this.#registry.get(e);
    //     if (pd === undefined) {
    //         pd = new PortalData(this.makeTemplate(e));
    //     }
    //     const result = pd.cloneTemplate();
    //     pd.portals.add(result);
    //     this.#registry.set(result, pd);
    //     parent.appendChild(result);
    //     return result;
    // }

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

    // observeNodeAdded(n: Node): void {

    // }

    // observeNodeRemoved(n: Node): void {

    // }

    // observeAttributeChanged(n: Node, attributeName: string): void {

    // }

    // // Only use this for debugging/testing. This should be considered read-only.
    // get unsafeRegistry() {
    //     return this.#registry;
    // }
}
