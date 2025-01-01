jest.useFakeTimers();

test('two portals', done => {
    const p = document.createElement('portal-element') as PortalElement;
    document.body.appendChild(p);
    const d1 = document.createElement('div');
    const background = 'lightblue';
    d1.style.background = background;
    d1.setAttribute('portal-id', '1');
    const d2 = document.createElement('div');
    d2.setAttribute('portal-id', '1');
    p.appendChild(d1);
    p.appendChild(d2);
    setTimeout(() => {
        const newD1 = p.childNodes[0];
        const newD2 = p.childNodes[1];
        console.error(newD1);
        console.error(newD2);
        expect(newD1).toEqual(d1);
        expect(newD1).toEqual(newD2);
        expect(newD2).toEqual(d1);
        expect(newD2).toEqual(newD1);
        expect(newD1).toBeInstanceOf(HTMLDivElement);
        expect(newD2).toBeInstanceOf(HTMLDivElement);
        const newD1E: HTMLDivElement = newD1 as any;
        const newD2E: HTMLDivElement = newD1 as any;
        expect(newD1E.getAttribute('portal-id')).toBe('1');
        expect(newD2E.getAttribute('portal-id')).toBe('1');
        expect(newD1E.style.background).toBe(background);
        expect(newD2E.style.background).toBe(background);
        done();
    }, 500);
    jest.runAllTimers();
});

// test('portal inside itself', () => {
//     const p = document.createElement('portal-element') as PortalElement;
// });