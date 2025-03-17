# StlLoader

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Description

1. Application loads two STL files by names 'scanLower.stl', 'scanUpper.stl'
2. From the package THREE has been used for rendering the base material MeshPhysicalMaterial
3. contour-shader was used to mark the border margin, which draws the border on texture from the canvas in time postprocessing.
4. To explore collisions has been used the MeshBvh object (https://github.com/gkjohnson/three-mesh-bvh/), which builds a bounding tree based on the input geometry.
5. The application allows you to see the fact of the presence to collision. In such a case, one of the two geometries changes color.
6. For getting the volume of collision, it needs to extend the implementation of MeshBvh, which will allow not only checking collision, but also get the vertices of each pair of intersection of triangles. Also, for each case of triangle intersection we can save the value of the area of intersection.  This information will help us to get an attribute of the depth of collision. Based on the set of vertices, we can build new geometry. For marking the relief of the landscape with new geometry, it needs to write a custom shader. This shader will use the attribute 'depth of collision' for choosing the color.
7. Analysis of geometry for getting the border between the tooth enamel and the gingival tissue.

The start idea was to use the difference of orientation of normal vectors (cross product). But the geometry doesn't allow using such an approach, because the geometry implements the shape of human tissue, which is not geometrically predictable.

Second approach (which actually implemented) was based on an idea, that faces on the border (which we are looking for) have very small area. It is not so in all cases that we can see in an example.

The third approach, which I started researching, is based on the paper https://onlinelibrary.wiley.com/doi/10.1155/2010/535329. My idea is to combine an approach from this paper with the implementation of boundsTree from the https://github.com/gkjohnson/three-mesh-bvh/ package to get vertices that represent minimum curvature < 0 (valleys) and display these points in the shader.

8. GUI controller can be used for checking the intersection of two geometries
9. Application can work with different examples. For changing examples, it needs to change the input files with the same names ('scan_up', 'scan_down') in the folder /public
