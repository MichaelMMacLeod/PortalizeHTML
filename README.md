# PortalizeHTML: Graph Structured DOM

This WIP library relaxes restrictions on the DOM hierarchy so that HTML elements:

- may have more than one parent
- may be their own descendants

The effect of this is that a single element may be inserted in multiple places and may even be inserted as a child of itself. Modifications of the element's template (`PortalManager.templateOf`) will be visible in all insertion locations after the next call to `PortalManager.render`.

The following example creates a `div` that contains itself as a child: 

```html
<!DOCTYPE html>
<html>

<head>
  <title>PortalizeHTML Demo</title>
</head>

<body style="width: 100vw; height: 100vh; margin: 0; display: flex;">
  <script src="dist/portal_manager.js"></script>
  <script>
    // access the library
    const PortalManager = portal_manager.default;
    const pm = new PortalManager();

    // create a portalized div
    const d = pm.createElement('div');

    // add some CSS styles to it
    const dTemplate = pm.templateOf(d);
    dTemplate.style.width = '80%';
    dTemplate.style.height = '80%';
    dTemplate.style.background = 'rgba(0,0,0,0.1)';
    dTemplate.style.display = 'flex';
    dTemplate.style.margin = 'auto';
    
    // make it a child of itself
    pm.appendChild(d, d);

    // display it on the document 
    pm.rootAppendChild(document.body, d);
    pm.render();
  </script>
</body>

</html>
```

A cool effect is created as the recursive references' semi-transparent backgrounds overlap each other:

![div with itself as a child, looks like a dark hallway](recursive-div.png)

### How does it work?

In essence, we fake a graph structure by duplicating nodes in the DOM tree, hiding all of the messy copying behind a nice facade.

`PortalManager.createElement` returns a portalID, a string used to reference a specific element. Internally, `PortalManager` maintains a mapping between these portalIDs and *template* elements. A template element is an HTML element (such as a `div`), except that each of its children is replaced with the custom element `<portal-placeholder>`. The portalID of each child is stored as an attribute of `<portal-placeholder>`. Upon a call to `PortalManager.render`, each `<portal-placeholder>` in the document is replaced with a copy of the template corresponding to its portalID attribute, a process that continues recursively. This replacement process is stopped once a maximum recursion depth is reached.