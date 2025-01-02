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

    expandPlaceholders(n: Node): void {
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
}
