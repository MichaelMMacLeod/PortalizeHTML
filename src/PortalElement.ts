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

    override get childNodes(): NodeListOf<ChildNode> {
        return this.#shadow.childNodes
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
