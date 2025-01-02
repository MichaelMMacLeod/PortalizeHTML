import PortalManager, { PortalPlaceholder } from "../src/PortalManager";

// Things we add to the document persist between tests in the
// same file, so make sure to create a new document before each
// test runs.
let document = new Document();
beforeEach(() => {
    document = document.implementation.createHTMLDocument();
});

test('makeTemplate creates placeholder', () => {
    const pm = new PortalManager();
    const d1 = pm.createElementPortal('div');
    const d2 = document.createElement('div');
    d2.appendChild(d1);
    const template = pm.makeTemplate(d2);
    const expected = document.createElement('div');
    const ph = document.createElement('portal-placeholder') as PortalPlaceholder;
    const pd1 = pm.unsafeElementMap.get(d1);
    if (pd1 === undefined) {
        throw new Error('pd1 undefined');
    }
    ph.portalID = pd1.portalID;
    expected.appendChild(ph);
    expect(template).toStrictEqual(expected);
});

test('appendChild creates placeholder', () => {
    const pm = new PortalManager();
    const d1 = pm.createElementPortal('div');
    const d2 = pm.createElementPortal('div');
    pm.appendChild(d1, d2);
    const pd1 = pm.unsafeElementMap.get(d1);
    const pd2 = pm.unsafeElementMap.get(d2);
    if (pd1 === undefined) {
        throw new Error('pd1 undefined');
    }
    if (pd2 === undefined) {
        throw new Error('pd2 undefined');
    }
    const d1Template = document.createElement('div');
    const ph = document.createElement('portal-placeholder') as PortalPlaceholder;
    ph.portalID = pd2.portalID;
    d1Template.appendChild(ph);
    expect(pd1.template).toStrictEqual(d1Template);
});

test('portal div with background color', () => {
    const pm = new PortalManager();
    let d = pm.createElementPortal('div');
    d.style.background = 'red';
    d = pm.appendChild(document.body, d) as HTMLDivElement;
    const expected = document.createElement('body');
    expected.innerHTML = '<div style="background: red;"></div>';
    expect(document.body).toStrictEqual(expected);
});

// test('styled div#0 div#0', () => {
//     const pm = new PortalManager();
//     const d = pm.createElementPortal('div');
//     d.style.background = 'red';
//     const d1 = pm.appendChild(document.body, d);
//     const d2 = pm.appendChild(document.body, d);
//     const dHTML = '<div style="background: red;"></div>';
//     const expected = `${dHTML}${dHTML}`;
//     console.error(document.body.innerHTML);
//     expect(document.body).toStrictEqual(expected);
// });

test('div#0/p div#0/p', () => {
    const pm = new PortalManager();
    const d = pm.createElementPortal('div');
    pm.appendChild(d, document.createElement('p'));
    pm.appendChild(document.body, d);
    pm.appendChild(document.body, d);
    const expected = document.createElement('body');
    const dHTML = '<div><p/></div>';
    expected.innerHTML = `${dHTML}${dHTML}`;
    expect(document.body).toStrictEqual(expected);
});

test('div#0/div/div#1/p div#0/div/div#1/p', () => {
    const pm = new PortalManager();
    let p1 = pm.createElementPortal('div');
    pm.appendChild(p1, document.createElement('p'));
    let p0 = pm.createElementPortal('div');
    let d = document.createElement('div');
    d = pm.appendChild(p0, d) as HTMLDivElement;
    p1 = pm.appendChild(d, p1) as HTMLDivElement;
    pm.appendChild(document.body, p0);
    pm.appendChild(document.body, p0);
    const template = document.createElement('body');
    const divHTML = '<div><div><div><p/></div></div></div>'
    template.innerHTML = `${divHTML}${divHTML}`;
    expect(document.body).toStrictEqual(template);
});