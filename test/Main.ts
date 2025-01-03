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
    let d = pm.createElement('div');
    (pm.templateOf(d) as HTMLDivElement).style.background = 'red';
    pm.rootAppendChild(document.body, d);
    pm.render();
    const expected = document.createElement('body');
    expected.innerHTML = '<div style="background: red;"></div>';
    expect(document.body).toStrictEqual(expected);
});

test('div#0/p div#0/p', () => {
    const pm = new PortalManager();
    const d = pm.createElement('div');
    pm.appendChild(d, pm.createElement('p'));
    pm.rootAppendChild(document.body, d);
    pm.rootAppendChild(document.body, d);
    pm.render();
    const expected = document.createElement('body');
    const dHTML = '<div><p/></div>';
    expected.innerHTML = `${dHTML}${dHTML}`;
    expect(document.body).toStrictEqual(expected);
});

test('div#0/div/div#1/p div#0/div/div#1/p', () => {
    const pm = new PortalManager();
    const p1 = pm.createElement('div');
    pm.appendChild(p1, pm.createElement('p'));
    const p0 = pm.createElement('div');
    const d = pm.createElement('div');
    pm.appendChild(p0, d);
    pm.appendChild(d, p1);
    pm.rootAppendChild(document.body, p0);
    pm.rootAppendChild(document.body, p0);
    pm.render();
    const template = document.createElement('body');
    const divHTML = '<div><div><div><p/></div></div></div>'
    template.innerHTML = `${divHTML}${divHTML}`;
    expect(document.body).toStrictEqual(template);
});

test('recursive div', () => {
    const pm = new PortalManager();
    const d = pm.createElement('div');
    const dTemplate = pm.templateOf(d) as HTMLDivElement;
    dTemplate.style.width = '50%';
    dTemplate.style.height = '100%';
    dTemplate.style.background = 'rgba(0,0,0,0.1)';
    dTemplate.style.display = 'flex';
    pm.appendChild(d, d);
    pm.rootAppendChild(document.body, d);
    pm.render();
    // expect(document.body.childNodes[0] as HTMLDiv)
});