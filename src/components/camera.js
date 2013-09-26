// ******* CAMERA **************************

/**
* Camera that contains the info about a camera
* @class Camera
* @namespace LS.Components
* @constructor
* @param {String} object to configure from
*/

function Camera(o)
{
	this._type = Camera.PERSPECTIVE;
	this._eye = vec3.fromValues(0,100, 100); //change to position
	this._center = vec3.fromValues(0,0,0);	//change to target
	this._up = vec3.fromValues(0,1,0);
	this._near = 1;
	this._far = 1000;
	this._aspect = 1.0;
	this._fov = 45; //persp
	this._frustrum_size = 50; //ortho

	this._view_matrix = mat4.create();
	this._projection_matrix = mat4.create();
	this._viewprojection_matrix = mat4.create();
	this._model_matrix = mat4.create(); //inverse of viewmatrix (used for local vectors)

	if(o) this.configure(o);
	//this.updateMatrices(); //done by configure
}

Camera.PERSPECTIVE = 1;
Camera.ORTHOGRAPHIC = 2;

/**
* Camera type, could be Camera.PERSPECTIVE or Camera.ORTHOGRAPHIC
* @property type {vec3}
* @default Camera.PERSPECTIVE;
*/
Object.defineProperty( Camera.prototype, "type", {
	get: function() {
		return this._type;
	},
	set: function(v) {
		if(	this._type != v)
			this._dirty_matrices = true;
		this._type = v;
	}
});

/**
* The position of the camera (in local space form the node)
* @property eye {vec3}
* @default [0,100,100]
*/
Object.defineProperty( Camera.prototype, "eye", {
	get: function() {
		return this._eye;
	},
	set: function(v) {
		this._eye.set(v);
		this._dirty_matrices = true;
	}
});

/**
* The center where the camera points (in node space)
* @property center {vec3}
* @default [0,0,0]
*/
Object.defineProperty( Camera.prototype, "center", {
	get: function() {
		return this._center;
	},
	set: function(v) {
		this._center.set(v);
		this._dirty_matrices = true;
	}
});

/**
* The near plane
* @property near {number}
* @default 1
*/
Object.defineProperty( Camera.prototype, "near", {
	get: function() {
		return this._near;
	},
	set: function(v) {
		if(	this._near != v)
			this._dirty_matrices = true;
		this._near = v;
	}
});

/**
* The far plane
* @property far {number}
* @default 1000
*/
Object.defineProperty( Camera.prototype, "far", {
	get: function() {
		return this._far;
	},
	set: function(v) {
		if(	this._far != v)
			this._dirty_matrices = true;
		this._far = v;
	}
});

/**
* The camera aspect ratio
* @property aspect {number}
* @default 1
*/
Object.defineProperty( Camera.prototype, "aspect", {
	get: function() {
		return this._aspect;
	},
	set: function(v) {
		if(	this._aspect != v)
			this._dirty_matrices = true;
		this._aspect = v;
	}
});
/**
* The field of view in degrees
* @property fov {number}
* @default 45
*/
Object.defineProperty( Camera.prototype, "fov", {
	get: function() {
		return this._fov;
	},
	set: function(v) {
		if(	this._fov != v)
			this._dirty_matrices = true;
		this._fov  = v;
	}
});

/**
* The frustrum size when working in ORTHOGRAPHIC
* @property frustrum_size {number}
* @default 50
*/

Object.defineProperty( Camera.prototype, "frustrum_size", {
	get: function() {
		return this._frustrum_size;
	},
	set: function(v) {
		if(	this._frustrum_size != v)
			this._dirty_matrices = true;
		this._frustrum_size  = v;
	}
});


Camera.prototype.onAddedToNode = function(node)
{
	if(!node.camera)
		node.camera = this;
	//this.updateNodeTransform();
}

Camera.prototype.onRemovedFromNode = function(node)
{
	if(node.camera == this)
		delete node.camera;
}

Camera.prototype.setActive = function()
{
	Scene.current_camera = this;
}

/**
* 
* @method updateMatrices
* @param {vec3} eye
* @param {vec3} center
* @param {vec3} up
*/
Camera.prototype.lookAt = function(eye,center,up)
{
	vec3.copy(this._eye, eye);
	vec3.copy(this._center, center);
	vec3.copy(this._up,up);
	this._dirty_matrices = true;
}

/**
* Update matrices according to the eye,center,up,fov,aspect,...
* @method updateMatrices
*/
Camera.prototype.updateMatrices = function()
{
	if(this.type == Camera.ORTHOGRAPHIC)
		mat4.ortho(this._projection_matrix, -this._frustrum_size*this._aspect*0.5, this._frustrum_size*this._aspect*0.5, -this._frustrum_size*0.5, this._frustrum_size*0.5, this._near, this._far);
	else
		mat4.perspective(this._projection_matrix, this._fov * DEG2RAD, this._aspect, this._near, this._far);
	mat4.lookAt(this._view_matrix, this._eye, this._center, this._up);
	//if(this._root && this._root.transform)

	mat4.multiply(this._viewprojection_matrix, this._projection_matrix, this._view_matrix );
	mat4.invert(this._model_matrix, this._view_matrix );
	this._dirty_matrices = false;
}

Camera.prototype.getModelMatrix = function(m)
{
	m = m || mat4.create();
	if(this._dirty_matrices)
		this.updateMatrices();
	return mat4.copy( m, this._model_matrix );
}

Camera.prototype.getViewMatrix = function(m)
{
	m = m || mat4.create();
	if(this._dirty_matrices)
		this.updateMatrices();
	return mat4.copy( m, this._view_matrix );
}

Camera.prototype.getProjectionMatrix = function(m)
{
	m = m || mat4.create();
	if(this._dirty_matrices)
		this.updateMatrices();
	return mat4.copy( m, this._projection_matrix );
}

Camera.prototype.getViewProjectionMatrix = function(m)
{
	m = m || mat4.create();
	if(this._dirty_matrices)
		this.updateMatrices();
	return mat4.copy( m, this._viewprojection_matrix );
}

Camera.prototype.updateVectors = function(model)
{
	var front = vec3.subtract(vec3.create(), this._center, this._eye);
	var dist = vec3.length(front);
	this._eye = mat4.multiplyVec3(vec3.create(), model, vec3.create() );
	this._center = mat4.multiplyVec3(vec3.create(), model, vec3.fromValues(0,0,-dist));
	this._up = mat4.rotateVec3(vec3.create(), model, vec3.fromValues(0,1,0));
	this.updateMatrices();
}

Camera.prototype.getLocalPoint = function(v, dest)
{
	dest = dest || vec3.create();
	if(this._dirty_matrices)
		this.updateMatrices();
	var temp = this._model_matrix; //mat4.create();
	//mat4.invert( temp, this._view_matrix );
	if(this._root.transform)
		mat4.multiply( temp, temp, this._root.transform.getGlobalMatrixRef() );
	return mat4.multiplyVec3(dest, temp, v );
}

Camera.prototype.getLocalVector = function(v, dest)
{
	dest = dest || vec3.create();
	if(this._dirty_matrices)
		this.updateMatrices();
	var temp = this._model_matrix; //mat4.create();
	//mat4.invert( temp, this._view_matrix );
	if(this._root.transform)
		mat4.multiply(temp, temp, this._root.transform.getGlobalMatrixRef() );
	return mat4.rotateVec3(dest, temp, v );
}

Camera.prototype.getEye = function()
{
	return vec3.clone( this._eye );
}

Camera.prototype.getCenter = function()
{
	return vec3.clone( this._center );
}

Camera.prototype.setEye = function(v)
{
	return vec3.copy( this._eye, v );
}

Camera.prototype.setCenter = function(v)
{
	return vec3.copy( this._center, v );
}

//in global coordinates (when inside a node)
Camera.prototype.getGlobalFront = function(dest)
{
	dest = dest || vec3.create();
	vec3.subtract( dest, this._center, this._eye);
	vec3.normalize(dest, dest);
	if(this._root.transform)
		this._root.transform.transformVector(dest, dest);
	return dest;
}

Camera.prototype.getGlobalTop = function(dest)
{
	dest = dest || vec3.create();
	vec3.subtract( dest, this._center, this._eye);
	vec3.normalize(dest, dest);
	var right = vec3.cross( vec3.create(), dest, this._up );
	vec3.cross( dest, dest, right );
	vec3.scale( dest, dest, -1.0 );

	if(this._root.transform)
		this._root.transform.transformVector(dest, dest);
	return dest;
}

Camera.prototype.move = function(v)
{
	vec3.add(this._center, this._center, v);
	vec3.add(this._eye, this._eye, v);
	this._dirty_matrices = true;
}


Camera.prototype.rotate = function(angle_in_deg, axis)
{
	var R = quat.setAxisAngle( quat.create(), axis, angle_in_deg * 0.0174532925 );
	var front = vec3.subtract( vec3.create(), this._center, this._eye );
	vec3.transformQuat(front, front, R );
	vec3.add(this._center, this._eye, front);
	this._dirty_matrices = true;
}

Camera.prototype.orbit = function(angle_in_deg, axis, center)
{
	center = center || this._center;
	var R = quat.setAxisAngle( quat.create(), axis, angle_in_deg * 0.0174532925 );
	var front = vec3.subtract( vec3.create(), this._eye, center );
	vec3.transformQuat(front, front, R );
	vec3.add(this._eye, center, front);
	this._dirty_matrices = true;
}

Camera.prototype.orbitDistanceFactor = function(f, center)
{
	center = center || this._center;
	var front = vec3.subtract( vec3.create(), this._eye, center );
	vec3.scale(front, front, f);
	vec3.add(this._eye, center, front);
	this._dirty_matrices = true;
}


/**
* Applies the camera transformation (from eye,center,up) to the node.
* @method updateNodeTransform
*/

/* DEPRECATED
Camera.prototype.updateNodeTransform = function()
{
	if(!this._root) return;
	this._root.transform.fromMatrix( this.getModel() );
}
*/

/**
* Converts from 3D to 2D
* @method project
* @param {vec3} vec 3D position we want to proyect to 2D
* @param {Array[4]} viewport viewport coordinates (if omited full viewport is used)
* @param {vec3} result where to store the result, if omited it is created
* @return {vec3} the coordinates in 2D
*/

Camera.prototype.project = function( vec, viewport, result )
{
	viewport = viewport ||  gl.getParameter(gl.VIEWPORT);
	if( this._dirty_matrices )
		this.updateMatrices();
	var result = mat4.multiplyVec3(result || vec3.create(), this._viewprojection_matrix, vec );
	result[0] /= result[2];
	result[1] /= result[2];
	vec3.set(result, (result[0]+1) * (viewport[2]*0.5) + viewport[0], (result[1]+1) * (viewport[3]*0.5) + viewport[1], result[2] );
	return result;
}

/**
* Converts from 2D to 3D
* @method unproject
* @param {vec3} vec 2D position we want to proyect to 3D
* @param {Array[4]} viewport viewport coordinates (if omited full viewport is used)
* @param {vec3} result where to store the result, if omited it is created
* @return {vec3} the coordinates in 2D
*/

Camera.prototype.unproject = function( vec, viewport, result )
{
	viewport = viewport ||  gl.getParameter(gl.VIEWPORT);
	if( this._dirty_matrices )
		this.updateMatrices();
	return gl.unproject(result || vec3.create(), vec, this._view_matrix, this._projection_matrix, viewport );
}

Camera.prototype.getRayInPixel = function(x,y, viewport)
{
	viewport = viewport ||  gl.getParameter(gl.VIEWPORT);
	if( this._dirty_matrices )
		this.updateMatrices();
	var eye = this.getEye();
	var pos = vec3.unproject(vec3.create(), [x,y,1], this._view_matrix, this._projection_matrix, viewport );
	var dir = vec3.subtract( vec3.create(), pos, eye );
	vec3.normalize(dir, dir);
	return { start: eye, direction: dir };
}

Camera.prototype.configure = function(o)
{
	//jQuery.extend(true, this, o);
	LS.cloneObject(o,this);
	this.updateMatrices();
}

Camera.prototype.serialize = function()
{
	//clone
	return cloneObject(this);
}

LS.registerComponent(Camera);
LS.Camera = Camera;