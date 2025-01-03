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

    replacePortalWithPlaceholder(
        p: Element,
        rootDeletions: Array<Element>,
        rootAdditions: Array<Element>,
    ): PortalPlaceholder {
        const pd = this.pdOfElement(p);
        this.#elementMap.delete(p);
        const ph = pd.createPlaceholder();
        this.#elementMap.set(ph, pd);
        p.replaceWith(ph);
        if (this.#roots.has(p)) {
            rootDeletions.push(p);
            rootAdditions.push(ph);
        }
        return ph;
    }

    replacePlaceholderWithElement(
        ph: PortalPlaceholder,
        rootDeletions: Array<Element>,
        rootAdditions: Array<Element>,
    ): Element {
        const pd = this.pdOf(ph.getPortalID());
        this.#elementMap.delete(ph);
        const template = pd.cloneTemplate();
        this.#elementMap.set(template, pd);
        ph.replaceWith(template);
        if (this.#roots.has(ph)) {
            rootDeletions.push(ph);
            rootAdditions.push(template);
        }
        return template;
    }

    expandPlaceholders(
        n: Node,
        rootDeletions: Array<Element>,
        rootAdditions: Array<Element>,
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
                node = this.replacePlaceholderWithElement(node, rootDeletions, rootAdditions);
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
        this.#elementMap.set(childPlaceholder, childPD);
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
        const deletions: Array<Element> = [];
        const additions: Array<Element> = [];
        for (let r of this.#roots) {
            deletions.push(r);
            r = this.replacePortalWithPlaceholder(r, deletions, additions);
            additions.push(r);
            this.expandPlaceholders(r, deletions, additions);
        }
        for (const d of deletions) {
            this.#roots.delete(d);
        }
        for (const a of additions) {
            this.#roots.add(a);
        }
    }
}