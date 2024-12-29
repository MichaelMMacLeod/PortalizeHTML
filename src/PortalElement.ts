type UUID = `${string}-${string}-${string}-${string}-${string}`;
type PortalData = {
    template: HTMLDivElement,
    portals: Set<PortalElement>,
};
type PortalRegistry = Map<UUID, PortalData>;
const RECURSION_DEPTH = 10;

function findAncestor<T extends Node>(n: Node, isCorrectNode: (o: Node) => o is T): T | undefined {
    let current = n;
    while (true) {
        while (current instanceof ShadowRoot) {
            current = current.host;
        }
        if (isCorrectNode(current)) {
            return current;
        }
        if (current.parentNode === null) {
            return undefined;
        }
        current = current.parentNode;
    }
}

function makePortalData(): PortalData {
    return {
        template: document.createElement('div'),
        portals: new Set(),
    };
}
function observePortalElementContainerChanges(pec: PortalElementContainer, m: Array<MutationRecord>, _mo: MutationObserver): void {
    m.forEach(mr => {
        pec.observePortalElementContainerChange(mr);
    });
}

class PortalElementContainer extends HTMLElement {
    #shadow: ShadowRoot;
    #registry: PortalRegistry;
    #observer: MutationObserver;

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'open' });
        this.#registry = new Map();
        this.#observer = new MutationObserver((m, o) => observePortalElementContainerChanges(this, m, o));
    }

    override appendChild<T extends Node>(node: T): T {
        return this.#shadow.appendChild(node);
    }

    initializePortalData(uuid: UUID): PortalData {
        let d = this.#registry.get(uuid);
        if (d === undefined) {
            d = makePortalData();
            this.#registry.set(uuid, d);
        }
        return d;
    }

    expandPortals(node: Node, depth: number = 0): void {
        if (depth >= RECURSION_DEPTH) {
            return;
        }
        const children: NodeListOf<ChildNode> = (() => {
            if (node instanceof PortalElement) {
                if (node.div === undefined) {
                    return new NodeList() as NodeListOf<ChildNode>;
                }
                const pd = this.initializePortalData(node.uuid);
                node.stopObserving();
                node.div = pd.template.cloneNode(true) as HTMLDivElement;
                node.startObserving();
                return node.div.childNodes;
            }
            return node.childNodes;
        })();
        const newDepth = node instanceof PortalElement ? depth + 1 : depth;
        children.forEach(c => {
            this.expandPortals(c, newDepth);
        })
    }

    installTemplate(uuid: UUID): void {
        const pd = this.initializePortalData(uuid);
        pd.portals.forEach(p => {
            this.expandPortals(p);
        });
    }

    observePortalElementContainerChange(m: MutationRecord): void {
        this.stopObserving();

        const portal = findAncestor(m.target, n => n instanceof PortalElement || n instanceof PortalElementContainer);
        if (portal instanceof PortalElementContainer) {
            m.addedNodes.forEach(n => {
                if (n instanceof PortalElement) {
                    const portal = n;
                    const pd = this.initializePortalData(portal.uuid);
                    const template = portal.makeTemplate();
                    if (template === undefined) {
                        throw new Error('undefined template');
                    }
                    pd.template = template;
                    this.installTemplate(portal.uuid);
                }
            });
        } else if (portal instanceof PortalElement) {
            const pd = this.initializePortalData(portal.uuid);
            const template = portal.makeTemplate();
            if (template === undefined) {
                throw new Error('undefined template');
            }
            pd.template = template;
            this.installTemplate(portal.uuid);
        }

        this.startObserving();
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

    connectedCallback(): void {
        const parent = this.parentNode;
        if (parent !== null &&
            findAncestor(parent, o => o instanceof PortalElementContainer || o instanceof PortalElement) !== undefined) {
            throw new Error('portal-element-container was inserted into a portal-element or portal-element-container');
        }
        this.startObserving();
    }

    disconnectedCallback(): void {
        this.stopObserving();
    }

    registerNewlyConnectedPortal(p: PortalElement): void {
        this.initializePortalData(p.uuid).portals.add(p);
    }

    registerNewlyDisconnectedPortal(p: PortalElement): void {
        const pd = this.initializePortalData(p.uuid);
        pd.portals.delete(p);
        if (pd.portals.size === 0) {
            this.#registry.delete(p.uuid);
        }
    }

    get registry(): PortalRegistry {
        return this.#registry;
    }
}

type PortalElementState = {
    container: PortalElementContainer,
    div: HTMLDivElement,
};

export default class PortalElement extends HTMLElement {
    #shadow: ShadowRoot;
    #uuid: UUID;
    #observer: MutationObserver;
    #state: PortalElementState | undefined;

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'open' });
        this.#uuid = crypto.randomUUID();
        this.#state = undefined;
        this.#observer = new MutationObserver((m, o) => {
            const container = findAncestor(this, a => a instanceof PortalElementContainer);
            if (container !== undefined) {
                this.stopObserving();
                observePortalElementContainerChanges(container, m, o)
                this.startObserving();
            }
        });
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

    override appendChild<T extends Node>(node: T): T {
        if (this.#state !== undefined) {
            return this.#state.div.appendChild(node);
        }
        return node;
    }

    connectedCallback() {
        this.#state = {
            container: (() => {
                const container = findAncestor(this, a => a instanceof PortalElementContainer);
                if (container === undefined) {
                    throw new Error('portal-element outside of portal-element-container');
                }
                return container;
            })(),
            div: document.createElement('div'),
        };
        this.#shadow.appendChild(this.#state.div);
        this.#state.container.registerNewlyConnectedPortal(this);
        this.startObserving();
    }

    disconnectedCallback() {
        this.stopObserving();
        if (this.#state !== undefined) {
            this.#state.div.remove();
            this.#state.container.registerNewlyDisconnectedPortal(this);
            this.#state = undefined;
        }
    }

    // override cloneNode(deep?: boolean): Node {
    //     const result = super.cloneNode(deep) as PortalElement;
    //     result.#uuid = this.#uuid;
    //     // if (deep !== undefined && deep) {
    //     //     result.#uuid = this.#uuid;
    //     // }
    //     // this.div?.childNodes.forEach(c => {
    //     //     result.appendChild(c.cloneNode(true));
    //     // });
    //     return result;
    // }

    makeTemplate(): HTMLDivElement | undefined {
        if (this.#state === undefined) {
            return undefined;
        }
        return this.#state.div.cloneNode(true) as HTMLDivElement;
    }

    get uuid(): UUID {
        return this.#uuid;
    }

    set uuid(uuid: UUID) {
        if (this.#state !== undefined) {
            this.disconnectedCallback();
            this.#uuid = uuid;
            this.connectedCallback();
        } else {
            this.#uuid = uuid;
        }
    }

    get div(): HTMLDivElement | undefined {
        if (this.#state === undefined) {
            return undefined;
        }
        return this.#state.div;
    }

    set div(div: HTMLDivElement) {
        if (this.#state === undefined) {
            return;
        }
        this.#state.div.replaceWith(div);
        this.#state.div = div;
    }
}

customElements.define('portal-element-container', PortalElementContainer);
customElements.define('portal-element', PortalElement);