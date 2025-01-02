class PortalData {
    template: Element;
    portals: Set<Element>;

    constructor(template: Element) {
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
    #registry: WeakMap<Element, PortalData>;

    constructor() {
        this.#registry = new Map();
    }

    private makeTemplate(e: Element): Element {
        let isTopLevel = true;
        const eClone = cloneNodeFilterMap(e, n => {
            if (isTopLevel) {
                isTopLevel = false;
                return { result: n, visitChildren: true };
            }
            if (!(n instanceof Element)) {
                return { result: n, visitChildren: false };
            }
            if (this.#registry.has(n)) {
                return { result: n, visitChildren: false };
            }
            return { result: n, visitChildren: true };
        });
        return eClone as Element;
    }

    createElementPortal<K extends keyof HTMLElementTagNameMap>(
        tagName: K, options?: ElementCreationOptions
    ): HTMLElementTagNameMap[K] {
        const e = document.createElement(tagName, options);
        const pd = new PortalData(this.makeTemplate(e).template);
        const result = pd.cloneTemplate() as HTMLElementTagNameMap[K];
        pd.portals.add(result);
        this.#registry.set(result, pd);
        return result;
    }

    private nodeContainsPortalChild(n: Node): boolean {
        for (const c of childrenDFS(n)) {
            if (c instanceof Element && this.#registry.has(c)) {
                return true;
            }
        }
        return false;
    }

    private portalContainingNode(n: Node): Element | undefined {
        for (const a of ancestors(n)) {
            if (a instanceof Element) {
                const pd = this.#registry.get(a);
                if (pd !== undefined) {
                    return a;
                }
            }
        }
        return undefined;
    }

    appendChild(parent: Node, e: Element): Element {
        const pd = this.#registry.get(e);
        const eIsPortal = pd !== undefined;
        const eContainsPortal = this.nodeContainsPortalChild(e)
        if (pd !== undefined) {
            e = pd.cloneTemplate();
            this.#registry.set(e, pd);
            pd.portals.add(e);
        }
        parent.appendChild(e);
        const containingPortal = this.portalContainingNode(e);
        if (containingPortal !== undefined) {
            const pd = this.#registry.get(containingPortal);
            if (pd === undefined) {
                throw new Error('pd undefined');
            }
            pd.template = this.makeTemplate(containingPortal);
            for (const p of pd.portals) {
                
            }
        }
        // const portalContainingParent = this.portalContainingNode(parent);
        // if (portalContainingParent !== undefined) {

        // }
        // const containingPD = 
        // 'e' may be a portal, and it may contain portals (however indirectly)
        // 'parent' may be a portal, or it may be contained in a portal (however indirectly).

        // case 1: 'e' is not a portal, contains no portals, and 'parent' is not a portal, 
        //         nor contained in any portals
        // - do parent.appendChild(e)

        // case 2: 'e' is a portal, contains no portals, and 'parent' is not a portal,
        //         nor contained in any portals
        // - make a template of e
        // - register template, add to portals
        // - append template to parent
        // - expand portals in template

        // case 3: 'e' is a portal, contains one or more portals, and 'parent' is not a portal,
        //         nor contained in any portals
        // - (same as case 2)

        // case 4: 'e' is a portal, contains one or more portals, and 'parent' is a portal, but
        //         is not contained in any portals
        // - do case 2 stuff but do not yet expand portals
        // - make template of parent
        // - swap parent portal template for the new one
        // - replace all registered parent portals with new cloned templates
        // - expand portals in all cloned templates

        // case 5: ... 'parent' is contain in other portals
        // same as case 4?

        // parent.appendChild(e);
        // return e;
    }

    // private initialize(e: Element): PortalData {
    //     let pd = this.#registry.get(e);
    //     if (pd !== undefined) {
    //         return pd;
    //     }
    //     pd = new PortalData(this.makeTemplate(e));
    //     this.#registry.set(e, pd);
    //     return pd;
    // }


    expandPortals(node: Node) {

    }

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

    observeNodeAdded(n: Node): void {

    }

    observeNodeRemoved(n: Node): void {

    }

    observeAttributeChanged(n: Node, attributeName: string): void {

    }

    // Only use this for debugging/testing. This should be considered read-only.
    get unsafeRegistry() {
        return this.#registry;
    }
}
