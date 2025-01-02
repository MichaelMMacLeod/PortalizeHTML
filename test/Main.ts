import PortalManager, { PortalPlaceholder } from "../src/PortalManager";

// Things we add to the document persist between tests in the
// same file, so make sure to create a new document before each
// test runs.
let document = new Document();
beforeEach(() => {
    document = document.implementation.createHTMLDocument();
});

test('portal div with background color', () => {
    const pm = new PortalManager();
    let d = pm.createElementPortal('div');
    d.style.background = 'red';
    pm.observeNodeChanged(d);
    d = pm.appendChild(document.body, d) as HTMLDivElement;
    const expected = document.createElement('body');
    expected.innerHTML = '<div style="background: red;"></div>';
    expect(document.body).toStrictEqual(expected);
});

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