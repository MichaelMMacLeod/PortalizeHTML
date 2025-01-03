const MAX_RECURSION_DEPTH = 100;

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

    constructor(portalID: string, template: Element) {
        this.portalID = portalID;
        this.template = template;
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
    #portalIDMap: Map<string, PortalData>;
    #roots: Map<Element, PortalData>;

    constructor() {
        this.#_nextID = 0;
        this.#portalIDMap = new Map();
        this.#roots = new Map();
    }

    pdOf(portalID: string): PortalData {
        const result = this.#portalIDMap.get(portalID);
        if (result === undefined) {
            throw new Error('portalID undefined');
        }
        return result;
    }

    pdOfRoot(root: Element): PortalData {
        const result = this.#roots.get(root);
        if (result === undefined) {
            throw new Error('pd undefined');
        }
        return result;
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
        e: Element,
        pd: PortalData,
    ): PortalPlaceholder {
        const ph = pd.createPlaceholder();
        e.replaceWith(ph);
        return ph;
    }

    replacePlaceholderWithElement(
        ph: PortalPlaceholder,
    ): Element {
        const pd = this.pdOf(ph.getPortalID());
        const template = pd.cloneTemplate();
        ph.replaceWith(template);
        return template;
    }

    expandPlaceholders(
        n: Node,
    ): Node {
        let isTopLevel = true;
        let result = n;
        const stack: Array<ExpandPlaceholdersItem> = [{
            node: n,
            depth: 0,
        }];
        while (stack.length > 0) {
            const item = stack.pop() as ExpandPlaceholdersItem;
            let node = item.node;
            let nextDepth = item.depth;
            if (node instanceof PortalPlaceholder) {
                nextDepth++;
                node = this.replacePlaceholderWithElement(node);
            }
            if (item.depth < MAX_RECURSION_DEPTH) {
                for (const c of node.childNodes) {
                    stack.push({
                        node: c,
                        depth: nextDepth,
                    });
                }
            }
            if (isTopLevel) {
                isTopLevel = false;
                result = node;
            }
        }
        return result;
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
        root.appendChild(ph);
        this.#roots.set(ph, pd);
    }

    render(): void {
        let newRoots = new Map();
        for (let [r, pd] of this.#roots) {
            const ph = this.replacePortalWithPlaceholder(r, pd);
            const newR = this.expandPlaceholders(ph);
            newRoots.set(newR, pd);
        }
        this.#roots = newRoots;
    }
}