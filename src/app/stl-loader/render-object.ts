import * as THREE from 'three';
import {Face, VertexNode} from 'three-stdlib';


export interface IInfoUVertices{
  vertex: THREE.Vector3;
  indices: any[];
  faces: Face[];
}

export class InfoUVertices implements IInfoUVertices{
  public vertex: THREE.Vector3;
  public indices: any[];
  public faces: Face[];
  constructor(){
    this.vertex=new THREE.Vector3();
    this.indices = [];
    this.faces = [];
  }
}

export interface  IInfoRendering{
  // 1 - up, 2 - down
  indexU: number; // index of unique vertex in array of unique vertices
  textureColor?: THREE.Color;
  uvCoordinates: THREE.Vector2;
  calcPoint: boolean;
  vertex: VertexNode;
  normal: THREE.Vector3;
  onBorder: boolean;
  onContour: boolean;
  onBorder1: boolean;
}

export class InfoRendering implements IInfoRendering {
  public indexU: number; // index of unique vertex in array of unique vertices
  public uvCoordinates: THREE.Vector2;
  public calcPoint: boolean;
  public index_prev: number;
  public index_next: number;
  public vertex: VertexNode;
  public normal: THREE.Vector3;
  public onBorder: boolean;
  public onContour: boolean;
  public onBorder1: boolean;
  public faces: number[];

  constructor() {
    this.indexU = -1; // index of unique vertice in array of unique vertices
    this.uvCoordinates = new THREE.Vector2();
    this.calcPoint = false;
    this.faces = [];
    this.onBorder = false;
    this.onContour = false;
    this.onBorder1 = false;
  };

}

export class RenderObject {
  public object: THREE.Mesh;
  public uniqueVertices: VertexNode[];
  public normals: THREE.Vector3[];
  public describeMesh: InfoRendering[];
  public facesMesh: Face[];
  public isContours: Float32Array;
  public isBorders: Float32Array;
  public isBorders1: Float32Array;
  public bufferContour: THREE.BufferAttribute;
  public bufferBorder: THREE.BufferAttribute;
  public bufferBorder1: THREE.BufferAttribute;

  constructor(obj: THREE.Mesh) {
    this.object = obj;
    this.uniqueVertices = [];
    this.describeMesh = [];
    this.facesMesh = [];
  }

  getVerticesNormals(){
    this.uniqueVertices = [];
    this.normals = [];
    const positions = this.object.geometry.getAttribute("position").array;
    const normals_c = this.object.geometry.getAttribute("normal").array;
// This gets # of vertices
    const vertexCount = this.object.geometry.getAttribute("position").count;
// Each loop counts up by 3
    let prev_vertex_node = null;
    for (let i = 0, index=0; i < vertexCount; i +=3, index+=1) {
      const vertex = new THREE.Vector3(
        positions[i + 0],
        positions[i + 1],
        positions[i + 2]);
      const vertex_node = new VertexNode(vertex);
      if (prev_vertex_node != null){
        vertex_node.prev = prev_vertex_node;
        prev_vertex_node.next = vertex_node;
      }
      prev_vertex_node = vertex_node;
      this.uniqueVertices.push(vertex_node);
      const normal = new THREE.Vector3(
        normals_c[i + 0],
        normals_c[i + 1],
        normals_c[i + 2]);
      this.normals.push(normal);
      const info_rendering = new InfoRendering();
      info_rendering.index_prev= index-1>=0?index-1:info_rendering.index_prev;
      info_rendering.index_next = index+1;
      info_rendering.normal = new THREE.Vector3().copy(normal);
      info_rendering.vertex = vertex_node;
      info_rendering.indexU = index;
      this.describeMesh.push(info_rendering);
    }
    this.describeMesh[0].vertex.prev = this.describeMesh[this.describeMesh.length -1].vertex;
    this.describeMesh[0].index_prev=this.describeMesh.length -1;
    this.describeMesh[this.describeMesh.length -1].vertex.next = this.describeMesh[0].vertex;
    this.describeMesh[this.describeMesh.length -1].index_next = 0

  }

  // information about faces
  makeInformationAboutObject(){
    this.getVerticesNormals();
    let index_face=0;
    for(let i=0; i < this.describeMesh.length; i+=1){
      const current_descr_mesh = this.describeMesh[i];
      const prev_descr_mesh = this.describeMesh[current_descr_mesh.index_prev];
      const next_descr_mesh = this.describeMesh[current_descr_mesh.index_next];
      const vertex_node = current_descr_mesh.vertex;
      const face=Face.create(vertex_node, vertex_node.prev, vertex_node.next);
      face.compute();
      current_descr_mesh.faces.push(index_face);
      prev_descr_mesh.faces.push(index_face);
      next_descr_mesh.faces.push(index_face);
      this.facesMesh.push(face);
      index_face++;
    }
  }

  // add contour attribute
  setOnContour(indexUVert: number){
      this.describeMesh[indexUVert].onContour= true;
  }
  // add border attribute
  setOnBorder(indexUVert: number){
      this.describeMesh[indexUVert].onBorder=true;
  }
  // add border1 attribute
  setOnBorder1(indexUVert: number){
      this.describeMesh[indexUVert].onBorder1=true;
  }

  // information for analisys for getting attributes of contour/border
  testEdge(face1: Face, face2: Face, index1: number){
    const crossP=new THREE.Vector3();
    crossP.crossVectors(face1.normal, face2.normal);
    const len_cross_n=crossP.length();
    if(len_cross_n >=0.04 && len_cross_n <= 0.5){
      this.setOnBorder(index1);
    }
    if(len_cross_n >= 0.5 && len_cross_n <=0.7){
      this.setOnContour(index1);
    }
    if(len_cross_n >= 0.7&& len_cross_n <=0.99){
      this.setOnBorder1(index1);
    }
  }


  contourAnalysis(){
    let count_borders = 0;
    for(let i = 0; i < this.describeMesh.length; i++){
      const info = this.describeMesh[i];
      if (info.onBorder || info.onBorder1 || info.onContour){
        count_borders+=1;
      }
    }
    const diff = this.describeMesh.length - count_borders;
  }

  // information for analysis for getting attributes contour/border
  makeSilhouette(){
    for(let i=0; i < this.describeMesh.length; i+=1){
      const descr_mesh = this.describeMesh[i];
      const face1 = this.facesMesh[descr_mesh.faces[0]];
      const face2 = this.facesMesh[descr_mesh.faces[1]];
      const face3 = this.facesMesh[descr_mesh.faces[2]];
      this.testEdge(face1, face2, i);
      this.testEdge(face1, face3, i);
      this.testEdge(face2, face3, i);
    }
    if(this.isContours === undefined){
      this.isContours = new Float32Array(this.describeMesh.length*3);
      this.bufferContour=new THREE.BufferAttribute( this.isContours, 1 );
      this.object.geometry.setAttribute( 'isContour',this.bufferContour );
    }
    if(this.isBorders === undefined){
      this.isBorders = new Float32Array(this.describeMesh.length*3);
      this.bufferBorder=new THREE.BufferAttribute( this.isBorders, 1 );
      this.object.geometry.setAttribute( 'isBorder', this.bufferBorder );
    }
    if(this.isBorders1 === undefined){
      this.isBorders1 = new Float32Array(this.describeMesh.length*3);
      this.bufferBorder1=new THREE.BufferAttribute( this.isBorders1, 1 );
      this.object.geometry.setAttribute( 'isBorder1', this.bufferBorder1 );
    }
    for(let i=0; i < this.describeMesh.length; i++){
      this.isContours[i]=this.describeMesh[i].onContour?1:0;
      this.isContours[i+1]=this.describeMesh[i].onContour?1:0;
      this.isContours[i+2]=this.describeMesh[i].onContour?1:0;
    }
    this.bufferContour.set(this.isContours);
    this.bufferContour.needsUpdate = true;
//----------------------------------------------------------------------------
    for(let i=0; i < this.describeMesh.length; i++){
      this.isBorders[i]=this.describeMesh[i].onBorder?1:0;
      this.isBorders[i+1]=this.describeMesh[i].onBorder?1:0;
      this.isBorders[i+2]=this.describeMesh[i].onBorder?1:0;
    }
    this.bufferBorder.set(this.isBorders);
    this.bufferBorder.needsUpdate = true;
//----------------------------------------------------------------------------
    for(let i=0; i < this.describeMesh.length; i++){
      this.isBorders1[i]=this.describeMesh[i].onBorder1?1:0;
      this.isBorders1[i+1]=this.describeMesh[i].onBorder1?1:0;
      this.isBorders1[i+2]=this.describeMesh[i].onBorder1?1:0;
    }
    this.bufferBorder1.set(this.isBorders1);
    this.bufferBorder1.needsUpdate = true;
  }

  addShapeAttribute(value:number){
    const shape=new Float32Array(this.object.geometry.attributes['position'].count);
    for(let i=0; i < shape.length; i++){
      shape[i]=value;
    }
    const bufferShape=new THREE.BufferAttribute(shape, 1);
    this.object.geometry.setAttribute('shape', bufferShape);
  }
}
