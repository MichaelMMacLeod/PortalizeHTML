import PortalManager from "../src/PortalManager";

// Things we add to the document persist between tests in the
// same file, so make sure to create a new document before each
// test runs.
let document = new Document();
beforeEach(() => {
    document = document.implementation.createHTMLDocument();
});

test('appendChild portal', () => {
    const pm = new PortalManager();
    const d = pm.createElementPortal('div');
    d.style.background = 'red';
    const d1 = pm.appendChild(document.body, d);
    const d2 = pm.appendChild(document.body, d);
    expect(d).toStrictEqual(d1);
    expect(d1).toStrictEqual(d2);
});

test('div#0/p div#0/p', () => {
    const pm = new PortalManager();
    const d = pm.createElementPortal('div');
    pm.appendChild(d, document.createElement('p'));
    pm.appendChild(document.body, d);
    pm.appendChild(document.body, d);
    expect(document.body.childNodes[0]).toStrictEqual(d);
    expect(document.body.childNodes[1]).toStrictEqual(d);
});

test('div#0/div/div#1/p div#0/div/div#1/p', () => {
    const pm = new PortalManager();
    const p1 = pm.createElementPortal('div');
    pm.appendChild(p1, document.createElement('p'));
    const p0 = pm.createElementPortal('div');
    const d = document.createElement('div');
    pm.appendChild(p0, d);
    pm.appendChild(d, p1);
    pm.appendChild(document.body, p0);
    pm.appendChild(document.body, p0);
    const template = document.createElement('div');
    template.innerHTML = '<div><div><p/></div></div>';
    expect(p0).toStrictEqual(template);
    expect(document.body.childNodes[0]).toStrictEqual(template);
    expect(document.body.childNodes[1]).toStrictEqual(template);
});