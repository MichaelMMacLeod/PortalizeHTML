type UUID = `${string}-${string}-${string}-${string}-${string}`;
type PortalData = {
    template: HTMLDivElement,
    portals: Array<PortalElement>,
};
type PortalRegistry = Map<UUID, PortalData>;
const globalPortalRegistry: PortalRegistry = new Map();
(window as any).gpr = globalPortalRegistry;

function makePortalData(): PortalData {
    return {
        template: document.createElement('div'),
        portals: [],
    };
}

function initializePortalData(r: PortalRegistry, uuid: UUID): PortalData {
    let d = r.get(uuid);
    if (d === undefined) {
        d = makePortalData();
        r.set(uuid, d);
    }
    return d;
}

function syncToPortals(r: PortalRegistry, uuid: UUID): void {
    const pd = initializePortalData(r, uuid);
    pd.portals.forEach(p => {
        const clonedTemplate = pd.template.cloneNode(true) as HTMLDivElement;
        p.div?.replaceWith(clonedTemplate);
        p.div = clonedTemplate;
    });
}

function replacePortalsWithExits(n: Node) {
    n.childNodes.forEach(c => {
        if (c instanceof PortalElement) {
            const newChild = document.createElement('portal-exit') as PortalExit;
            newChild.uuid = c.uuid;
            n.replaceChild(newChild, c);
        } else {
            replacePortalsWithExits(c);
        }
    });
}

function replaceExitsWithPortals(r: PortalRegistry, n: Node) {
    const RECURSION_LIMIT = 8;
    function go(n: Node) {
        n.childNodes.forEach(c => {
            if (c instanceof PortalExit) {
                const newChild = document.createElement('portal-element') as PortalElement;
                if (c.uuid === undefined) {
                    throw new Error('undefined uuid in portal exit');
                }
                newChild.uuid = c.uuid;
            }
        });
    }
    go(0, n);
}

function syncFromPortal(r: PortalRegistry, uuid: UUID, div: HTMLDivElement): void {
    const pd = initializePortalData(r, uuid);
    pd.template = div.cloneNode(true) as HTMLDivElement;
    replacePortalsWithExits(pd.template);
    syncToPortals(r, uuid);
}

class PortalExit extends HTMLElement {
    uuid: UUID | undefined;

    constructor() {
        super();
        this.uuid = undefined;
    }
}

export default class PortalElement extends HTMLElement {
    shadow: ShadowRoot;
    div: HTMLDivElement | undefined;
    uuid: UUID;
    observer: MutationObserver;
    depth: number;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.div = undefined;
        this.observer = new MutationObserver((m, o) => observe(this, m, o));
        this.uuid = crypto.randomUUID();
        const options: MutationObserverInit = {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
        };
        this.observer.observe(this, options);
        this.depth = 0;
    }

    connectedCallback() {
        console.log('connectedCallback');
        this.div = document.createElement('div');
        this.shadow.appendChild(this.div);
        const pd = initializePortalData(globalPortalRegistry, this.uuid);
        pd.portals.push(this);
        syncToPortals(globalPortalRegistry, this.uuid);
    }

    disconnectedCallback() {
        console.log('disconnectedCallback');
    }

    adoptedCallback() {
        console.log('adoptedCallback');
    }

    appendChild<T extends Node>(node: T): T {
        if (node instanceof PortalElement) {
            const clonedNode = node.cloneNode(true) as PortalElement;
            clonedNode.uuid = node.uuid;
            console.log('recursive instantiation', node, clonedNode);
            super.appendChild(clonedNode);
            const pd = initializePortalData(globalPortalRegistry, clonedNode.uuid);
            pd.portals.push(clonedNode);
            if (this.div !== undefined) {
                syncFromPortal(globalPortalRegistry, this.uuid, this.div);
            }
            syncToPortals(globalPortalRegistry, clonedNode.uuid);
            return clonedNode as unknown as T;
        } else {
            return super.appendChild(node);
        }
    }
}

function handleAttributeChange(p: PortalElement, m: MutationRecord) {
    console.log(m);
}

function handleCharacterDataChange(p: PortalElement, m: MutationRecord) {
    console.log(m);
}

function handleChildListChange(p: PortalElement, m: MutationRecord) {
    console.log(m);
    if (p.div !== undefined) {
        m.addedNodes.forEach(n => {
            p.div?.appendChild(n);
        })
        syncFromPortal(globalPortalRegistry, p.uuid, p.div);
    }
}

function observe(p: PortalElement, mutations: Array<MutationRecord>, observer: MutationObserver): void {
    mutations.forEach(m => {
        switch (m.type) {
            case 'attributes':
                handleAttributeChange(p, m);
                break;
            case 'characterData':
                handleCharacterDataChange(p, m);
                break;
            case 'childList':
                handleChildListChange(p, m);
                break;
        }
    });
}

customElements.define('portal-exit', PortalExit);