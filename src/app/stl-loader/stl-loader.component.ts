import {Component, ElementRef, Input, OnInit, Renderer2, ViewChild} from '@angular/core';
import {acceleratedRaycast, computeBoundsTree, disposeBoundsTree, MeshBVH} from 'three-mesh-bvh';
import * as THREE from 'three';
import {Mesh, PerspectiveCamera, Scene, ShaderMaterial, Texture, WebGLRenderTarget, MeshPhysicalMaterial} from 'three';
import {OrbitControls, STLLoader} from 'three-stdlib';
import {contourShader} from './contour-shader';
import {RenderObject} from './render-object';
const loader = new STLLoader();
THREE.Mesh.prototype.raycast = acceleratedRaycast;


@Component({
  selector: 'app-stl-loader',
  standalone: true,
  templateUrl: './stl-loader.component.html',
  styleUrl: './stl-loader.component.css'
})


export class StlLoaderComponent implements OnInit {

  @ViewChild("render_canvas") render_canvas: ElementRef<HTMLCanvasElement>;
  @Input()
  private path = ['scanUpper.stl', 'scanLower.stl'];
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: any;
  private mesh_up: THREE.Mesh;
  private mesh_down: THREE.Mesh;
  public canvas_texture: THREE.CanvasTexture;
  public  postprocessing = { enabled: true,
    'contour_material': new ShaderMaterial( {
      uniforms: {
        'resolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        'uBasis':{value: null}
      },

      vertexShader: contourShader.vertexShader,
      fragmentShader: contourShader.fragmentShader,
    } ),
  };

  ngOnInit(): void {
    //add listener for the resize of the window - will resize the renderer to fit the window
    let global = this.render.listen('window', 'resize', (evt) => {
      this.onWindowResize();
    })
  }

  ngAfterViewInit(): void {
    this.init3D();
  }
  constructor(private render: Renderer2){
  }
  init3D(){
    // renderer
    this.renderer = new THREE.WebGLRenderer({alpha: true, canvas:  this.render_canvas.nativeElement});
    this.renderer.setSize( this.render_canvas.nativeElement.clientWidth, this.render_canvas.nativeElement.clientHeight );
    this.canvas_texture = new THREE.CanvasTexture(this.render_canvas.nativeElement);
    this.canvas_texture.isRenderTargetTexture = true;
    this.canvas_texture.colorSpace = THREE.LinearSRGBColorSpace;

    // scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xFFFFFF );

    // camera
    this.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.01, 10000 );
    this.camera.position.set( 113, 111, 113 );
    this.camera.aspect = window.innerWidth / window.innerHeight;

    this.scene.add( new THREE.AmbientLight( 0xffffff, 0.68 ) );
    this.scene.add( this.camera ); // required, because we are adding a light as a child of the camera
    const sunLight = new THREE.PointLight( new THREE.Color(1.0, 1.0, 1.0), 1.5);
    sunLight.position.set( -10.75, 7.5, -3.5 );
    sunLight.castShadow=false;
    this.scene.add( sunLight );

    const dLight = new THREE.DirectionalLight( new THREE.Color(1.0, 1.0, 1.0), 0.95);
    dLight.position.set( -10.75, 5.5, -3.5 );
    dLight.castShadow=true;
    dLight.shadow.bias=0.00005;
    dLight.shadow.radius=4.5;
    this.scene.add( dLight );

    const dLight1= new THREE.DirectionalLight( new THREE.Color(1.0, 1.0, 1.0), 0.95);
    dLight1.position.set( 10.75, 5.5, -3.5 );
    dLight1.castShadow=true;
    dLight1.shadow.bias=0.00005;
    dLight1.shadow.radius=4.5;
    this.scene.add( dLight1 );


    // controls
    this.controls = new OrbitControls(this.camera,this.renderer.domElement);

    // lights
    const light = new THREE.PointLight( 0xffffff, 0.5 );
    this.camera.add( light );

    loader.load(this.path[0], geometry => {
      const material = new MeshPhysicalMaterial( { color: 0xffffff } );
      geometry.computeVertexNormals();
      geometry.normalizeNormals();
      geometry.setFromPoints([new THREE.Vector3( -2, -1.16, -9)]);
      this.mesh_up = new Mesh( geometry, material );
      this.mesh_up.name='scan_up';
      this.mesh_up.geometry.boundsTree = new MeshBVH(geometry);
      // object analysis and adding attributes
      const obj_render = new RenderObject(this.mesh_up)
      obj_render.makeInformationAboutObject();
      obj_render.makeSilhouette();
      obj_render.addShapeAttribute(1.0);
      this.scene.add(this.mesh_up);
    })

    loader.load(this.path[1],
      geometry => {
        const material = new THREE.MeshPhysicalMaterial({color: 0xffffff});
        geometry.computeVertexNormals();
        geometry.normalizeNormals();
        geometry.setFromPoints([new THREE.Vector3(-2, -1.16, -9)]);
        this.mesh_down = new THREE.Mesh(geometry, material);
        this.mesh_down.name = 'scan_down';
        this.mesh_down.geometry.boundsTree = new MeshBVH(geometry);
        const transformMatrix = new THREE.Matrix4().copy(this.mesh_up.matrixWorld).invert().multiply(this.mesh_down.matrixWorld);
        const hit = this.mesh_up.geometry.boundsTree?.intersectsGeometry(this.mesh_down.geometry, transformMatrix);
        if (hit) {
          const color = new THREE.Color(0xE91E63);
          material.color = color;
        }
        this.mesh_up.add(this.mesh_down);
        this.mesh_up.rotation.y = Math.PI / 4;
        this.mesh_up.rotation.x = -Math.PI / 2;
        this.mesh_up.rotation.order = 'YZX';
      })

    //request animation
    this.animate();

  }


  /**
   * render the scene and request the window animation frame
   */
  animate() {

    window.requestAnimationFrame(_ => this.animate());

    this.camera.updateProjectionMatrix();

    this.camera.updateMatrixWorld();
    this.camera.lookAt( this.scene.position );

    this.renderer.render(this.scene, this.camera);

    this.canvas_texture.updateMatrix();
    this.postprocessing['contour_material'].uniforms['uBasis'].value = this.canvas_texture;
//    this.scene.overrideMaterial = this.postprocessing['contour_material'];
    this.renderer.render(this.scene, this.camera);

  }

  /**
   * will resize the renderer and the camera to the right size of the window
   */
  onWindowResize() {

    this.camera.aspect = window.innerWidth / window.innerHeight;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );

  }

}
