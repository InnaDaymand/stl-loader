
/*
Inna Daymand, 2025

contourShader

*/

export const contourShader = {
  vertexShader: [
    "precision highp float;",
    "precision highp int;",

//    "uniform mat4 modelMatrix;", //= object.MatrixWorld
//    "uniform mat4 modelViewMatrix;", // = camera.matrixWorldInverse*object.matrixWorld
//    "uniform mat4 projectionMatrix;", // = camera.projectionMatrix
//    "uniform mat4 viewMatrix;", // = camera.matrixWorldInverse
//    "uniform mat3 normalMatrix;", // = inverse transpose of modelViewMatrix
//    "uniform vec3 cameraPosition;", // = camera position in world space

//    "attribute vec3 position;",
//    "attribute vec3 normal;",
//    "attribute vec2 uv;",
    "attribute float isContour;",
    "attribute float isBorder;",
    "attribute float isBorder1;",
    "attribute float shape;",

    "uniform vec2 resolution;",


    "varying vec3 vWorldPosition;",
    "varying vec3 vWorldNormal;",
    "varying vec2 vUv;",
    "varying float vShape;",
    "varying vec2 vtex_coord;",
    "varying float vIsContour;",
    "varying float vIsBorder;",
    "varying float vIsBorder1;",

    "void main() {",

    // This sets the position of the vertex in 3d space. The correct math is
    // provided below to take into account camera and object data.
    "	vec4 mv_position=modelViewMatrix * vec4( position, 1.0 );",
//    "	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
//    "	vWorldPosition =worldPosition.xyz; ",

//    "	vWorldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",

    "	 vIsContour = isContour;",
    "	 vIsBorder = isBorder;",
    "	 vIsBorder1 = isBorder1;",

    "   gl_Position = projectionMatrix * mv_position;",
//    "   csm_PositionRaw = projectionMatrix * mv_position;",
// 	getting UV coordinates of position in input texture
    "	float x1 = ((gl_Position.x/gl_Position.w)+1.0)*resolution.x/2.0;",
    "	float y1 = ((gl_Position.y/gl_Position.w)+1.0)*resolution.y/2.0;",
    "	vUv.x = (x1)/resolution.x;",
    "	vUv.y = (y1)/resolution.y;",
    "	vShape=shape;",
    "	vtex_coord=uv;",
//---------------------------------------------------------
    "}",
  ].join( "\n" ),
  fragmentShader: [
    "precision highp float;",

    "uniform sampler2D uBasis;",
    "uniform vec2 resolution;",


    "varying vec3 vWorldPosition;",
    "varying vec3 vWorldNormal;",
    "varying vec2 vUv;",
    "varying float vShape;",
    "varying vec2 vtex_coord;",
    "varying float vIsContour;",
    "varying float vIsBorder;",
    "varying float vIsBorder1;",


//model of contour.
//use aperture 5 left, 5 right (radius)
    "float normColor(vec3 color){",
    "	return (color.r+color.g+color.b);",
    "}",

    "const int radius=5;",
//calculation value of factor in row
    "float calcX(int y,  float offset_x){",
    "	vec3 color=texture2D(uBasis, vUv).rgb;",
    "	vec2 onePixel=vec2(1.0, 1.0)/resolution;",
    "	float avgNorm=normColor(color);",
    "	float count=1.0;",
    "	for(int x= -1; x > -radius -1 ; x--){",
    "		color=texture2D(uBasis, vec2(vUv.x + offset_x*onePixel.x, vUv.y) + onePixel*vec2(x, y)).rgb;	",
    "		avgNorm=avgNorm+normColor(color);",
    "		count+=1.0;",
    "	}",
    "	for(int x= 1; x <radius +1 ; x++){",
    "		color=texture2D(uBasis, vec2(vUv.x + offset_x*onePixel.x, vUv.y) + onePixel*vec2(x, y)).rgb;	",
    "		avgNorm=avgNorm+normColor(color);",
    "		count+=1.0;",
    "	}",
    "	avgNorm=avgNorm/count;",
    "	return avgNorm;",
    "}",

// base color of contour is white
    "vec3 applyMyFilterContour(){",
    "    return vec3(1.0);",
    "}",

// base color of border is red
    "vec3 applyMyFilterBorder(){",
    "vec3 ret= vec3(1.0, 0.0, 0.0);",
    "	return ret;",
    "}",

// base color of border1 is green
    "vec3 applyMyFilterBorder1(){",
    "vec3 ret = vec3(0.0, 1.0, 0.0);",
    "	return ret;",
    "}",

    "void main() {",
    "		vec3 color=texture2D(uBasis, vUv).rgb;",
    "		float count=0.0;",
    "		if( vShape > 0.98 && vIsContour > 0.98){",
    "			color=applyMyFilterContour();",
    "				count=count+1.0;",
    "		}",
    // "		if(vShape > 0.98 && vIsBorder > 0.98 ){",
    // "			color=applyMyFilterBorder();",
    // "				count=count+1.0;",
    // "		}",
    // "		if(vShape > 0.98 && vIsBorder1 > 0.98 ){",
    // "			color=applyMyFilterBorder1();",
    // "				count=count+1.0;",
    // "		}",
    "   if (count > 0.0){",
    "		  gl_FragColor = vec4(color.rgb, 1.0);",
    "   }",
    "   else{",
    "		  gl_FragColor=vec4(texture2D(uBasis, vUv).rgb, 1.0);",
    "   }",
    "}",
  ].join( "\n" )

};

