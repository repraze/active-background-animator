/*!
* jQuery Active Background Animator
* https://github.com/repraze/active-background-animator
*
* Copyright 2015, - Thomas Dubosc (http://repraze.com)
* Released under the MIT license
*/
(function( $ ) {
	
	$.fn.activeBackgroundAnimator = function(data,options) {
		// options
		var settings = $.extend({
			test: "yay"
		}, options );
		
		//check if element is in view
		function isScrolledIntoView(elem){
			var docViewTop = $(window).scrollTop();
			var docViewBottom = docViewTop + $(window).height();

			var elemTop = $(elem).offset().top;
			var elemBottom = elemTop + $(elem).height();

			return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
		}
		
		function Canvas(canvas){
			this.canvas = canvas[0];
			this.context = this.canvas.getContext("2d");
			this.ratio = this.canvas.width/this.canvas.height;
			//surface is nb of 100px (100*100=10000)
			this.surface = this.canvas.width*this.canvas.height/10000;
			
			this.width = function(w){
				if(!w){
					return this.canvas.width;
				}
				if(w!=this.canvas.width){
					this.canvas.width = w;
					this.ratio = this.canvas.width/this.canvas.height;
					this.surface = this.canvas.width*this.canvas.height/10000;
				}
				return this;
			}
			
			this.height = function(h){
				if(!h){
					return this.canvas.height;
				}
				if(h!=this.canvas.height){
					this.canvas.height = h;
					this.ratio = this.canvas.width/this.canvas.height;
					this.surface = this.canvas.width*this.canvas.height/10000;
				}
				return this;
			}
			
			this.clear = function(bounds){
				if(!bounds){
					this.context.clearRect(0, 0, this.width(), this.height());
				}
				else{
					var x = bounds.x || 0;
					var y = bounds.y || 0;
					var width = bounds.width || this.width();
					var height = bounds.height || this.height();
					
					this.context.clearRect(x, y, width, height);
				}
			}
		}

		function Animator(container,layers,settings){
			this.init = function(){
				//create the canvas for the background and a div to sit on top of it
				var canvas = $('<canvas/>',{'class':'aba-canvas','style':'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;'});
				var overlay = $('<div/>',{'class':'aba-overlay','style':'position:relative;z-index:1;'});
				
				//create object selectors
				this.container = container;
				this.canvas = new Canvas(canvas);
				
				//move everything from the container to the overlay
				overlay.html(this.container.html());
				this.container.html("");
				
				//add the new elements to container
				this.container.append(canvas);
				this.container.append(overlay);
				
				//a little styling
				this.container.css( "position", "relative" );
				
				this.canvas.width(this.container.outerWidth());
				this.canvas.height(this.container.outerHeight());
				
				//set and init animations
				this.animations = layers;
				this.initLayers();
				
				var self = this;
				requestAnimationFrame(function(date){self.run(date)});
			}
			
			this.initLayers = function(){
				for(var i=0; i < this.animations.length; i++) {
					this.animations[i].init(this.canvas);
				}
			}
			
			this.run = function(date){
				var self = this;
				if(!this.lastFrameDate){
					this.lastFrameDate = date;
				}
				else{
					if(this.canvas.width()!=this.container.outerWidth()||this.canvas.height()!=this.container.outerHeight()){
						//update canvas dim
						this.canvas.width(this.container.outerWidth());
						this.canvas.height(this.container.outerHeight());
					
						//reinit?
						this.initLayers();
					}
					
					//check if should render, for speed of page
					if(isScrolledIntoView(this.container)){
						var dt = Math.min(0.05,(date-this.lastFrameDate)/1000);
						
						this.update(dt); 
						this.render(this.canvas.context);
					}
					this.lastFrameDate = date;
				}
				requestAnimationFrame(function(date){self.run(date)});
			}
			
			this.update = function(t){
				for(var i=0; i < this.animations.length; i++) {
					this.animations[i].update(t);
				}
			}
			
			this.render = function(ctx){
				ctx.save;
				//ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());
				this.canvas.clear();
				
				for(var i=0; i < this.animations.length; i++) {
					this.animations[i].render(ctx);
				}
				
				ctx.restore();
			}
		}
		
		//create the background
		if(data){
			//put in array if single object
			if(Object.prototype.toString.call( data ) !== '[object Array]'){
				data = [data];
			}
			//check if data exist
			if(data.length>0){
				//parse data
				for(var i=0;i<data.length;i++){
					//just the name of an animation
					if(typeof data[i]==='string'){
						var anim = aba.getAnimation(data[i]);
						if(anim){
							data[i] = new anim();
						}
						else{
							data.splice(i, 1);
						}
					}
					//object definition with names and options
					else if(typeof data[i]!=='function'){
						if(data[i].name){
							var anim = aba.getAnimation(data[i].name);
							if(anim){
								data[i] = new anim(data[i].options);
							}
							else{
								data.splice(i, 1);
							}
						}
					}
				}
			}
			
			this.each(function() {
				new Animator($(this),data,settings).init();
			});
		}
		
		return this;
	};
	
}( jQuery ));

//tree for objects with positions
function QuadTree(bounds,capacity,parent){
	//tree bounds
	this.bounds = bounds;
	//bucket capacity
	this.capacity = capacity;
	//parent tree used in searches
	this.parent = parent;
	
	//no subtrees
	this.leaf = true;
	//objects in tree
	this.objects = [];
	//sub trees
	this.quadtrees = [];
	
	this.inBounds = function(point){
		return !(point.x<this.bounds.x || point.y<this.bounds.y ||
				 point.x>this.bounds.x+this.bounds.w || point.y>this.bounds.y+this.bounds.h);
	}
	
	this.insert = function(object){
		if(this.inBounds(object.getPosition())){
			this._insert(object);
		}
		return false;
	},
	
	this._insert = function(object){
		var inserted = false;
		//if subtrees
		if(this.leaf){
			//if it is not full
			if(this.objects.length < this.capacity){
				this.objects.push(object);
				object.qtNode = this;
				inserted = true;
			}
			else{
				//subdivide this tree
				this._divide();
				//insert newly added object
				inserted = this._insert(object);
			}
		}
		else{
			for(var i = 0 ; i<4; i++){
				if(this.quadtrees[i].insert(object)){
					inserted = true;
					break;
				}
			}
			if(inserted=== false)
			{
				this.objects.push(object);
				object.qtNode=this;
				inserted=true;
			}
		}
		return inserted;
	}
	
	this._divide = function(){
		this.leaf = false;
		this.quadtrees = [];
		var b = this.bounds;
		var half = {w:b.w/2.0,h:b.h/2.0}
		//create sub quadtrees
		for(var row = 0 ; row<2 ; row++){
			for(var col = 0 ; col<2 ; col++){
				var B = {x: b.x+col*half.w, w: half.w, y: b.y+row*half.h, h: half.h}
				this.quadtrees.push(new QuadTree(B,this.capacity,this));
			}
		}
		// We populate subtrees with current node's objects
		for(var i = this.objects.length - 1 ; i >=0 ; --i){
			for(var tId = 0 ; tId<4; tId++){
				if(this.quadtrees[tId].insert(this.objects[i])){

					this.objects.splice(i,1);
					break;
				}
			}
		}
	}
	
	this._merge = function(){
		for(var i = 0; i< 4; i++){
			if(!this.quadtrees[i].leaf || this.quadtrees[i].objects.length>0)
				return false;// Merging is not possible
		}
		//do Merge :
		this.quadtrees = [];
		this.leaf = true;
		return true;
	}
	
	this.getNeighbors = function(pt,objs){
		objs = typeof objs !== 'undefined' ? objs : [];
		if(this.inBounds(pt)){
			for(var objId = 0 ; objId < this.objects.length; objId++)
				objs.push(this.objects[objId]);
			if(!this.leaf){
				for(var treeId = 0; treeId <4 ; treeId++){
					this.quadtrees[treeId].getNeighbors(pt,objs);
				}
			}
		}
		return objs;
	}
	
	this.remove = function(object){
		var objIdx = object.qtNode.objects.indexOf(object);
		if(objIdx!==-1){
			object.qtNode.objects.splice(objIdx,1);
			if(object.qtNode.leaf && object.qtNode.parent!==null)
				object.qtNode.parent._merge();
			return true;
		}
		else
			return false;
	},
	
	this.move = function(object){
		var baseNode = object.qtNode;
		if(baseNode.inBounds(object.getPosition())){
			if(baseNode.leaf)//nothing to do
				return true;
			else{ //look if the object is contained in a child
				var subNode = null;
				for(var i=0; i<4; i++){
					if(baseNode.quadtrees[i].inBounds(object.getPosition())){
						subNode = baseNode.quadtrees[i];
						break;
					}
				}
				if(subNode !== null){
					object.qtNode.remove(object);
					subNode._insert(object);

				}
			}

		}
		else if(this.inBounds(object.getPosition()))
		{
			baseNode.remove(object);
			var inserted = false;
			for(node = baseNode; !inserted && node!==null; node = node.parent){
				inserted=node.insert(object);
			}
		}

	}
}

//useful methods for animation creation
var aba = {
	Position : function(x,y){
		this.x = x||0;
		this.y = y||0;
		
		this.set = function(vec){
			this.x = vec.x;
			this.y = vec.y;
			return this;
		}
		this.clone = function(){
			return new aba.Position(this.x,this.y);
		}
		this.add = function(p){
			this.x += p.x;
			this.y += p.y;
			return this;
		}
		this.sub = function(p){
			this.x -= p.x;
			this.y -= p.y;
			return this;
		}
		this.mul = function(f){
			this.x *= f;
			this.y *= f;
			return this;
		}
		this.div = function(f){
			this.x /= f;
			this.y /= f;
			return this;
		}
		this.equals = function(p){
			if(this.x==p.x && this.y==p.y){
				return true;
			}
			return false;
		}
		this.between = function(p,f){
			return this.clone().add(p.clone().sub(this).mul(f));
		}
		this.distanceTo = function(p){
			return this.clone().sub(p).length();
		}
		this.distanceTo = function(p){
			var x = this.x-p.x;
			var y = this.y-p.y;
			return Math.sqrt(x*x+y*y);
		}
		this.sqDistanceTo = function(p){
			var x = this.x-p.x;
			var y = this.y-p.y;
			return x*x+y*y;
		}
		this.length = function(){
			return Math.sqrt(this.y*this.y+this.x*this.x);
		}
		this.sqLength = function(){
			return this.y*this.y+this.x*this.x;
		}
		this.angle = function(){
			return Math.atan2(this.y,this.x);
		}
	},

	Vector : function(vel,ang){
		this.velocity = vel;
		this.angle = ang;
		this.getPosition = function(){
			return new aba.Position(Math.cos(this.angle)*this.velocity,Math.sin(this.angle)*this.velocity);
		}
		this.clone = function(){
			return new aba.Vector(this.velocity,this.angle);
		}
		this.add = function(v){
			var np = this.getPosition();
			np.add(v.getPosition());
			this.velocity = np.length();
			this.angle = np.angle();
			return this;
		}
		this.sub = function(v){
			var np = this.getPosition();
			np.sub(v.getPosition());
			this.velocity = np.length();
			this.angle = np.angle();
			return this;
		}
		this.getProjectionVelocity = function(a){
			var vc = this.clone();
			
			vc.angle -= a;
			return Math.cos(vc.angle)*vc.velocity;
		}
	},
	
	randomIntFromInterval : function(min,max){
		return Math.floor(Math.random()*(max-min+1)+min);
	},
	
	_animations : [],
	
	getAnimation(name){
		if(!aba._animations[name]){
			console.error("animation "+name+" not defined");
			return false;
		}
		return aba._animations[name];
	},
	
	registerAnimation : function(name,anim,overwrite=false){
		if(typeof name != 'string' || typeof anim != "function"){
			console.error("incorrect registration");
			return;
		}
		if(!aba._animations[name] || overwrite){
			aba._animations[name] = anim;
		}
		else{
			console.error("animation already defined");
			return;
		}
	},
};