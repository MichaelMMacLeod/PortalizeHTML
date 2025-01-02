const MAX_RECURSION_DEPTH = 10;

export class PortalPlaceholder extends HTMLElement {
    constructor() {
        super();
    }

    setPortalID(portalID: string) {
        this.setAttribute('portal-id', portalID);
    }

    getPortalID(): string | undefined {
        const v = this.getAttribute('portal-id');
        if (v !== null) {
            return v;
        }
        return undefined;
    }
}
customElements.define('portal-placeholder', PortalPlaceholder);

class PortalData {
    portalID: string;
    template: Element;
    portals: Set<Element>;

    constructor(portalID: string, template: Element) {
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

function* ancestors(node: Node): Generator<Node> {
    let n: Node | null = node;
    while (n !== null) {
        n = n.parentNode;
        if (n !== null) {
            yield n;
        }
    }
}

type ExpandPlaceholdersItem = {
    node: Node,
    depth: number,
};

type ExpandPlaceholdersAdditionItem = {
    element: Element,
    portalData: PortalData,
};

type ExpandPlaceholdersDeletionItem = {
    element: Element,
    portalData: PortalData,
};

export default class PortalManager {
    #_nextID: number;
    #elementMap: Map<Element, PortalData>;
    #portalIDMap: Map<string, PortalData>;

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

    get nextID(): string {
        return (this.#_nextID++).toString();
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
                result.setPortalID(pd.portalID);
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
        this.#portalIDMap.set(pd.portalID.toString(), pd);
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

    expandPlaceholders(
        n: Node,
        deletions: Array<ExpandPlaceholdersDeletionItem>,
        additions: Array<ExpandPlaceholdersAdditionItem>,
    ): void {
        // const portalIDDepths: Map<number, number> = new Map();
        const stack: Array<ExpandPlaceholdersItem> = [{
            node: n,
            depth: 0,
        }];
        while (stack.length > 0) {
            const item = stack.pop() as ExpandPlaceholdersItem;
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
                const pd = this.#portalIDMap.get(portalID);
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
    updateChangedPortal(changedPortal: Element): PortalData {
        const pd = this.#elementMap.get(changedPortal);
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
        const deletions: Array<ExpandPlaceholdersDeletionItem> = [];
        const additions: Array<ExpandPlaceholdersAdditionItem> = [];
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
        if (pd !== undefined) {
            e = pd.cloneTemplate();
            this.#elementMap.set(e, pd);
            pd.portals.add(e);
        } else {
            e = this.makeTemplate(e);
        }
        parent.appendChild(e);
        if (this.updatePortalsContainingChangedNode(e) === undefined) {
            const deletions: Array<ExpandPlaceholdersDeletionItem> = [];
            const additions: Array<ExpandPlaceholdersAdditionItem> = [];
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
