import {Component, ElementRef, Input, OnInit, Renderer2, ViewChild} from '@angular/core';
import {acceleratedRaycast, computeBoundsTree, disposeBoundsTree, MeshBVH} from 'three-mesh-bvh';
import * as THREE from 'three';
import {
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderTarget,
  MeshPhysicalMaterial,
  WebGLRenderer, BufferGeometry
} from 'three';
import {OrbitControls, STLLoader} from 'three-stdlib';
import {contourShader} from './contour-shader';
import {RenderObject} from './render-object';
import {GUI} from 'lil-gui';
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
  public geometry_up: BufferGeometry;
  public geometry_down: BufferGeometry;
  public render_target: any;
  public contour_material: THREE.ShaderMaterial;
  public sunLight: THREE.PointLight;
  public dLight: THREE.DirectionalLight;
  public dLight1: THREE.DirectionalLight;
  public camera_light: THREE.PointLight;
  public hit_collision: any;
  public material_down: THREE.MeshPhysicalMaterial;

  ngOnInit(): void {
    //add listener for the resize of the window - will resize the renderer to fit the window
    let global = this.render.listen('window', 'resize', (evt) => {
      this.onWindowResize();
    })
  }

  ngAfterViewInit(): void {
    this.init3D().then(r => this.animate());
  }
  constructor(private render: Renderer2){
  }
  async init3D(){
    // renderer
    this.renderer = new THREE.WebGLRenderer({alpha: true, canvas: this.render_canvas.nativeElement});
    this.renderer.setSize( this.render_canvas.nativeElement.clientWidth, this.render_canvas.nativeElement.clientHeight );
    document.body.appendChild( this.renderer.domElement );
    const gui = new GUI();
    const property= {
      hit_collision: false
    };
    gui.add(property, 'hit_collision').onChange((value: boolean) =>{
      if (this.mesh_up != undefined && this.mesh_down != undefined){
        if(this.hit_collision && value == true){
          const color = new THREE.Color(0xE91E63);
          this.material_down.color = color;
        }
        else{
          const color = new THREE.Color(0xffffff);
          this.material_down.color = color;
        }
        this.mesh_down.material = this.material_down;
      }
    })
    // scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xFFFFFF );

    // camera
    this.camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.01, 10000 );
    this.camera.position.set( 113, 111, 113 );
    this.camera.aspect = window.innerWidth / window.innerHeight;

    this.scene.add( new THREE.AmbientLight( 0xffffff, 0.68 ) );
    this.scene.add( this.camera ); // required, because we are adding a light as a child of the camera
    this.sunLight = new THREE.PointLight( new THREE.Color(1.0, 1.0, 1.0), 1.5);
    this.sunLight.position.set( -10.75, 7.5, -3.5 );
    this.sunLight.castShadow=false;
    this.scene.add( this.sunLight );

    this.dLight = new THREE.DirectionalLight( new THREE.Color(1.0, 1.0, 1.0), 0.95);
    this.dLight.position.set( -10.75, 5.5, -3.5 );
    this.dLight.castShadow=true;
    this.dLight.shadow.bias=0.00005;
    this.dLight.shadow.radius=4.5;
    this.scene.add( this.dLight );

    this.dLight1= new THREE.DirectionalLight( new THREE.Color(1.0, 1.0, 1.0), 0.95);
    this.dLight1.position.set( 10.75, 5.5, -3.5 );
    this.dLight1.castShadow=true;
    this.dLight1.shadow.bias=0.00005;
    this.dLight1.shadow.radius=4.5;
    this.scene.add( this.dLight1 );


    // controls
    this.controls = new OrbitControls(this.camera,this.renderer.domElement);

    // lights
    this.camera_light = new THREE.PointLight( 0xffffff, 0.5 );
    this.camera.add( this.camera_light );
    //-------------------------------

    //-------------------load objects and analysis of geometries------------------
    await loader.load(this.path[0], geometry => {
      const material = new MeshPhysicalMaterial({color: 0xffffff});
      geometry.computeVertexNormals();
      geometry.normalizeNormals();
      geometry.setFromPoints([new THREE.Vector3(-2, -1.16, -9)]);
      this.mesh_up = new Mesh(geometry, material);
      this.mesh_up.name = 'scan_up';
      this.mesh_up.geometry.boundsTree = new MeshBVH(geometry);
      // object analysis and adding attributes
      const obj_render = new RenderObject(this.mesh_up)
      obj_render.makeInformationAboutObject();
      obj_render.makeSilhouette();
      obj_render.addShapeAttribute(1.0);
      this.scene.add(this.mesh_up);
      this.geometry_up=geometry;
    })

    await loader.load(this.path[1],
      geometry => {
        this.material_down = new THREE.MeshPhysicalMaterial({color: 0xffffff});
        geometry.computeVertexNormals();
        geometry.normalizeNormals();
        geometry.setFromPoints([new THREE.Vector3(-2, -1.16, -9)]);
        this.mesh_down = new THREE.Mesh(geometry, this.material_down);
        this.mesh_down.name = 'scan_down';
        this.mesh_down.geometry.boundsTree = new MeshBVH(geometry);
        const transformMatrix = new THREE.Matrix4().copy(this.mesh_up.matrixWorld).invert().multiply(this.mesh_down.matrixWorld);
        this.hit_collision = this.mesh_up.geometry.boundsTree?.intersectsGeometry(this.mesh_down.geometry, transformMatrix);
        this.mesh_up.add(this.mesh_down);
        this.mesh_up.rotation.y = Math.PI / 4;
        this.mesh_up.rotation.x = -Math.PI / 2;
        this.mesh_up.rotation.order = 'YZX';
        this.geometry_down=geometry;
      })
    //---------------------------------------------------------
  }//-----------end init--------------------


  /**
   * render the scene and request the window animation frame
   */
  async animate() {
    window.requestAnimationFrame(_ => this.animate());
    await this.main_render();
  }

  async main_render() {
//    this.scene.overrideMaterial = this.contour_material;
//    const texture = await this.generate_base_texture();
    if (this.render_target === undefined) {
      this.render_target = new THREE.WebGLRenderTarget(this.render_canvas.nativeElement.clientWidth,
        this.render_canvas.nativeElement.clientHeight);
    }
    this.renderer.setRenderTarget(this.render_target);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    const texture =  this.render_target.texture;
    if (texture != undefined) {
      this.contour_material = await this.contour_shader(texture);
      this.scene.overrideMaterial = this.contour_material;
    }
    this.renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = null;

  }


 contour_shader(texture: THREE.Texture){
   return  new ShaderMaterial( {
     uniforms: {
       'resolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
       'uBasis':{value: texture}
     },

     vertexShader: contourShader.vertexShader,
     fragmentShader: contourShader.fragmentShader,
   } );
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
