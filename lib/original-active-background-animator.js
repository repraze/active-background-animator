function randomIntFromInterval(min,max){
	return Math.floor(Math.random()*(max-min+1)+min);
}

function Canvas(canvas){
	this.canvas = canvas;
	this.context = this.canvas.getContext("2d");
	
	this.getWidth = function(){
		return this.canvas.width;
	}
	this.getHeight = function(){
		return this.canvas.height;
	}
	
	this.setWidth = function(w){
		if(w==this.canvas.width)
			return;
		this.canvas.width = w;
	}
	this.setHeight = function(h){
		if(h==this.canvas.height)
			return;
		this.canvas.height = h;
	}
}

function Position(x,y){
	this.x = x;
	this.y = y;
	
	this.getCopy = function(){
		return new Position(this.x,this.y);
	}
	this.add = function(p){
		this.x += p.x;
		this.y += p.y;
		return this;
	}
	this.remove = function(p){
		this.x -= p.x;
		this.y -= p.y;
		return this;
	}
	this.equals = function(p){
		if(this.x==p.x && this.y==p.y){
			return true;
		}
		return false;
	}
	this.factor = function(f){
		this.x *= f;
		this.y *= f;
		return this;
	}
	this.between = function(p,f){
		return this.getCopy().add(p.getCopy().remove(this).factor(f));
	}
	this.sqDistanceTo = function(p){
		var x = this.x-p.x;
		var y = this.y-p.y;
		return x*x+y*y;
	}
	this.getLength = function(){
		return Math.sqrt(this.y*this.y+this.x*this.x);
	}
	this.getAngle = function(){
		return Math.atan2(this.y,this.x);
	}
}

function Vector(vel,ang){
	this.velocity = vel;
	this.angle = ang;
	this.getPosition = function(){
		return new Position(Math.cos(this.angle)*this.velocity,Math.sin(this.angle)*this.velocity);
	}
	this.getCopy = function(){
		return new Vector(this.velocity,this.angle);
	}
	this.add = function(v){
		var np = this.getPosition();
		np.add(v.getPosition());
		this.velocity = np.getLength();
		this.angle = np.getAngle();
		return this;
	}
	this.remove = function(v){
		var np = this.getPosition();
		np.remove(v.getPosition());
		this.velocity = np.getLength();
		this.angle = np.getAngle();
		return this;
	}
	this.getProjectionVelocity = function(a){
		var vc = this.getCopy();
		
		vc.angle -= a;
		return Math.cos(vc.angle)*vc.velocity;
	}
}

function HeaderAnimation(container){
	//create the canvas for the background and a div to sit on top of it
	var canvas = document.createElement('canvas');
	var overlay = document.createElement('div');
	
	//create object selectors
	this.container = document.getElementById(container);
	this.canvas = new Canvas(canvas);
	
	//move everything from the container to the overlay
	overlay.innerHTML = this.container.innerHTML;
	this.container.innerHTML = "";
	
	//add the new elements to container
	this.container.appendChild(canvas);
	this.container.appendChild(overlay);
	
	//a little styling
	this.container.style.position = "relative";
	
	canvas.className += "aba-canvas";
	overlay.className += "aba-overlay";
	
	canvas.style.position = "absolute";
	overlay.style.position = "relative";
	canvas.style.top = "0";
	canvas.style.left = "0";
	canvas.style.width = "100%";
	canvas.style.height = "100%";
	
	canvas.style.zIndex = "0";
	overlay.style.zIndex = "1";
	
	this.canvas.setWidth(this.container.offsetWidth);
	this.canvas.setHeight(this.container.offsetHeight);
	
	this.animation = new ActiveGraph(this.canvas);
	
	var self = this;
	requestAnimationFrame(function(date){self.run(date)});
	
	this.run = function(date){
		var self = this;
		if(!this.lastFrameDate){
			this.lastFrameDate = date;
		}
		else{
			if(this.canvas.getWidth()!=this.container.offsetWidth||this.canvas.getHeight()!=this.container.offsetHeight){
				//update canvas dim
				this.canvas.setWidth(this.container.offsetWidth);
				this.canvas.setHeight(this.container.offsetHeight);
			
				this.animation = new ActiveGraph(this.canvas);
			}
			
			//check if should render, for speed of page
			if(document.body.scrollTop<this.container.offsetHeight+this.container.offsetTop){
				var dt = Math.min(0.05,(date-this.lastFrameDate)/1000);
			
				this.update(dt); 
				this.render(this.canvas.context);
			}
			this.lastFrameDate = date;
		}
		requestAnimationFrame(function(date){self.run(date)});
	}
	
	this.update = function(t){
		this.animation.update(t);
	}
	
	this.render = function(ctx){
		ctx.save;
		ctx.clearRect(0, 0, this.canvas.getWidth(), this.canvas.getHeight());
		
		this.animation.render(ctx);
		
		ctx.restore();
	}
}

function ActiveGraph(canvas){
	this.nodes = new Array();
	this.edges = new Array();
	
	this.canvas = canvas;
	this.width = this.canvas.getWidth();
	this.height = this.canvas.getHeight();
	
	//proportional to screen size
	this.nb = Math.min(this.canvas.getWidth()/10,140);
	this.near = 2;
	
	for (var i = 0; i < this.nb; i++){
		this.nodes.push(new Node(this,new Position(randomIntFromInterval(0,this.canvas.getWidth()),
												randomIntFromInterval(0,this.canvas.getHeight()))));
	}
	
	this.hasEdge = function(e){
		for(var i=0; i < this.edges.length; i++) {
			if(e.equals(this.edges[i])) return true; 
		}
		return false; 
	}
	
	this.addEdge = function(e){
		if(!this.hasEdge(e)){
			this.edges.push(e);
		}
	}
	
	this.update = function(t){
		this.width = this.canvas.getWidth();
		this.height = this.canvas.getHeight();
		
		//node update
		for (var i = 0; i < this.nodes.length; i++){		
			this.nodes[i].update(t);
		}
		
		//edge search
		this.edges = new Array();
		var nears = this.nodes.slice(); //copy
		for (var i = 0; i < this.nodes.length; i++){
			var thisPos = this.nodes[i].position;
			nears.sort(function(a,b){
				return a.position.sqDistanceTo(thisPos) - b.position.sqDistanceTo(thisPos)
			});
			
			//first is itself
			for(var j=1;j < this.near+1; j++){
				this.addEdge(new Edge(this,this.nodes[i],nears[j]));
			}
			
			//nears = nears.slice(0, 3);
		}
		
		//edge update
		/*
		for (var i = 0; i < this.edges.length; i++){		
			this.edges[i].update(t);
		}
		*/
	}
	
	this.render = function(ctx){
		for (var i = 0; i < this.edges.length; i++){
			this.edges[i].render(ctx);
		}
		for (var i = 0; i < this.nodes.length; i++){
			this.nodes[i].render(ctx);
		}
	}
}

function Node(graph,position){
	this.graph = graph;
	this.position = position || new Position(0,0);
	this.speed = randomIntFromInterval(0.1,15);
	this.direction = randomIntFromInterval(0,2*Math.PI);
	
	this.vector = new Vector(randomIntFromInterval(0.1,15),randomIntFromInterval(0,2*Math.PI));
	
	this.equals = function(n){
		return this.position.equals(n.position);
	}
	
	this.update = function(t){
		//var velocity = new Position(t*this.speed*Math.cos(this.direction),t*this.speed*Math.sin(this.direction));
		this.position.add(this.vector.getPosition().factor(t));
		
		if(this.position.x<0){this.position.x += this.graph.width;}
		else if(this.position.x>this.graph.width){this.position.x -= this.graph.width;}
		if(this.position.y<0){this.position.y += this.graph.height;}
		else if(this.position.y>this.graph.height){this.position.y -= this.graph.height;}
	}
	
	this.render = function(ctx){
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, 4, 0, 2 * Math.PI, false);
		ctx.lineWidth = 2;
		ctx.fillStyle = '#0490d3';
		ctx.strokeStyle = '#ffffff';
		ctx.fill();
		ctx.stroke();
	}
}

function Edge(graph,nodeA,nodeB){
	this.graph = graph;
	this.nodeA = nodeA;
	this.nodeB = nodeB;
	
	this.equals = function(e){
		return (this.nodeA.position.equals(e.nodeA.position) && this.nodeB.position.equals(e.nodeB.position)) ||
			   (this.nodeA.position.equals(e.nodeB.position) && this.nodeB.position.equals(e.nodeA.position));
	}
	
	this.update = function(t){
		/*
		var vect = new Vector(t*10/(this.length()^2),this.angle());
		
		this.nodeB.vector.add(vect);
		vect.angle+=Math.PI;
		this.nodeA.vector.add(vect);
		*/
	}
	
	this.length = function(){
		return this.nodeA.position.sqDistanceTo(this.nodeB.position);
	}
	
	this.angle = function(){
		return Math.atan2(this.nodeA.position.y-this.nodeB.position.y,this.nodeA.position.x-this.nodeB.position.x);
	}
	
	this.render = function(ctx){
		var alpha = (1-(this.length()/10000));
		if(alpha<0.1){
			alpha=0.1;
		}
		ctx.strokeStyle = 'rgba(255,255,255,'+alpha+')';
		ctx.beginPath();
		ctx.moveTo(this.nodeA.position.x, this.nodeA.position.y);
		ctx.lineTo(this.nodeB.position.x, this.nodeB.position.y);
		ctx.stroke();
	}
}