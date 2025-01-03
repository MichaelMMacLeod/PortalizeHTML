const MAX_RECURSION_DEPTH = 10;

export class PortalPlaceholder extends HTMLElement {
    constructor() {
        super();
    }

    setPortalID(portalID: string) {
        this.setAttribute('portal-id', portalID);
    }

    getPortalID(): string {
        const v = this.getAttribute('portal-id');
        if (v !== null) {
            return v;
        }
        throw new Error('portalID undefined');
    }
}
customElements.define('portal-placeholder', PortalPlaceholder);

class PortalData {
    portalID: string;
    template: Element;
    parents: Set<string>;

    constructor(portalID: string, template: Element) {
        this.portalID = portalID;
        this.template = template;
        this.parents = new Set();
    }

    cloneTemplate(): Element {
        return this.template.cloneNode(true) as Element;
    }

    createPlaceholder(): PortalPlaceholder {
        const result = document.createElement('portal-placeholder') as PortalPlaceholder;
        result.setPortalID(this.portalID);
        return result;
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

function* ancestorsIncludingSelf(node: Node): Generator<Node> {
    yield node;
    yield* ancestors(node);
}

type ExpandPlaceholdersItem = {
    node: Node,
    depth: number,
};

export default class PortalManager {
    #_nextID: number;
    #elementMap: Map<Element, PortalData>;
    #portalIDMap: Map<string, PortalData>;
    #roots: Set<Element>;

    constructor() {
        this.#_nextID = 0;
        this.#elementMap = new Map();
        this.#portalIDMap = new Map();
        this.#roots = new Set();
    }

    pdOf(portalID: string): PortalData {
        const result = this.#portalIDMap.get(portalID);
        if (result === undefined) {
            throw new Error('portalID undefined');
        }
        return result;
    }

    pdOfElement(e: Element): PortalData {
        const pd = this.#elementMap.get(e);
        if (pd === undefined) {
            throw new Error('pd undefined');
        }
        return pd;
    }

    templateOf(portalID: string): Element {
        return this.pdOf(portalID).template;
    }

    get unsafePortalIDMap() {
        return this.#portalIDMap;
    }

    get unsafeRoots() {
        return this.#roots;
    }

    get nextID(): string {
        return (this.#_nextID++).toString();
    }

    isPortalID(s: string): boolean {
        return this.#portalIDMap.has(s);
    }

    replacePortalWithPlaceholder(p: Element): PortalPlaceholder {
        const pd = this.pdOfElement(p);
        this.#elementMap.delete(p);
        const ph = pd.createPlaceholder();
        this.#elementMap.set(ph, pd);
        p.replaceWith(ph);
        return ph;
    }

    replacePlaceholderWithElement(ph: PortalPlaceholder): Element {
        const pd = this.pdOf(ph.getPortalID());
        this.#elementMap.delete(ph);
        const template = pd.cloneTemplate();
        this.#elementMap.set(template, pd);
        ph.replaceWith(template);
        return template;
    }

    expandPlaceholders(
        n: Node,
    ): void {
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
                node = this.replacePlaceholderWithElement(node);
            }
            for (const c of node.childNodes) {
                stack.push({
                    node: c,
                    depth: nextDepth,
                });
            }
        }
    }

    createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K, options?: ElementCreationOptions
    ): string {
        const e = document.createElement(tagName, options);
        const pd = new PortalData(this.nextID, e);
        this.#portalIDMap.set(pd.portalID, pd);
        return pd.portalID;
    }

    appendChild(parent: string, child: string): void {
        const parentPD = this.pdOf(parent);
        const childPD = this.pdOf(child);
        const childPlaceholder = childPD.createPlaceholder();
        parentPD.template.appendChild(childPlaceholder);
    }

    rootAppendChild(root: Node, child: string): void {
        const pd = this.pdOf(child);
        const ph = pd.createPlaceholder();
        this.#elementMap.set(ph, pd);
        root.appendChild(ph);
        this.#roots.add(ph);
    }

    render(): void {
        for (let r of this.#roots) {
            r = this.replacePortalWithPlaceholder(r);
            this.expandPlaceholders(r);
        }
    }

    // portalID(n: Node): string | undefined {
    //     if (n instanceof Element) {
    //         return this.#elementMap.get(n)?.portalID;
    //     }
    //     return undefined;
    // }

    // get unsafeElementMap() {
    //     return this.#elementMap;
    // }


    // isPortal(n: Node): n is Element {
    //     return n instanceof Element && this.#elementMap.has(n);
    // }

    // * portalAncestors(portalID: string): Generator<string> {
    //     let currentPD = this.pdOf(current);
    // }

    // * portalAncestorsIncludingSelf(portalID: string): Generator<string> {
    //     yield portalID;
    //     yield* this.portalAncestors(n);
    // }

    // rootOf(portalID: string): string | undefined {
    //     let oldestPortal = undefined;
    //     for (const a of this.portalAncestorsIncludingSelf(n)) {
    //         oldestPortal = a;
    //     }
    //     return oldestPortal;
    // }

    // makeTemplate(e: Element): Element {
    //     let isTopLevel = true;
    //     const eClone = cloneNodeFilterMap(e, n => {
    //         if (isTopLevel) {
    //             isTopLevel = false;
    //             return { result: n.cloneNode(), visitChildren: true };
    //         }
    //         if (!(n instanceof Element)) {
    //             return { result: n.cloneNode(), visitChildren: true };
    //         }
    //         const pd = this.#elementMap.get(n);
    //         if (pd !== undefined) {
    //             const result = document.createElement('portal-placeholder') as PortalPlaceholder;
    //             result.setPortalID(pd.portalID);
    //             return {
    //                 result,
    //                 visitChildren: false,
    //             };
    //         }
    //         return { result: n.cloneNode(), visitChildren: true };
    //     });
    //     return eClone as Element;
    // }

    // portalContainingNode(n: Node): Element | undefined {
    //     for (const a of this.portalAncestors(n)) {
    //         return a;
    //     }
    //     return undefined;
    // }

    // updateChangedPortal(changedPortal: Element): PortalData {
    //     const pd = this.#elementMap.get(changedPortal);
    //     if (pd === undefined) {
    //         throw new Error('pd undefined');
    //     }
    //     pd.template = this.makeTemplate(changedPortal);
    //     return pd;
    // }

    // // Returns the portal data of the containing portal, if there is one.
    // updatePortalsContainingChangedNode(node: Node): PortalData | undefined {
    //     const containingPortal = this.portalContainingNode(node);
    //     if (containingPortal !== undefined) {
    //         return this.updateChangedPortal(containingPortal);
    //     } else {
    //         return undefined;
    //     }
    // }

    // observeNodeChanged(node: Node): void {
    //     if (node instanceof Element && this.#elementMap.has(node)) {
    //         this.updateChangedPortal(node);
    //     }
    //     this.updatePortalsContainingChangedNode(node);
    // }


    // appendChild2(parentID: string, childID: string): Element {
    //     const oldERoot = this.rootOf(e);
    //     if (oldERoot !== undefined) {
    //         this.#roots.delete(oldERoot);
    //     }
    //     const pd = this.#elementMap.get(e);
    //     if (pd !== undefined) {
    //         e = pd.cloneTemplate();
    //         this.#elementMap.set(e, pd);
    //     } else {
    //         e = this.makeTemplate(e);
    //     }
    //     parent.appendChild(e);
    //     this.updatePortalsContainingChangedNode(e);
    //     const newERoot = this.rootOf(e);
    //     if (newERoot !== undefined) {
    //         this.#roots.add(newERoot);
    //     }
    //     for (const r of this.#roots) {
    //         this.condensePortal(r);
    //         this.expandPlaceholders(r);
    //     }
    //     return e;
    // }
}