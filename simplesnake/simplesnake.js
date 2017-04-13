/**********************************************************************
* 
* Simple Snake 
*
* This code is designed to illustrate the non-intuitive approach to an
* implementation, building a snake game as a cellular automaton rather
* than the more intuitive, a set of entities (OOP) or a number of sets 
* of procedures and data structures, directly emulating the "tactile" 
* perception of the game, i.e. independent field, snakes, walls, apples
* and their interactions.
*
* In this approach there are no entities, no snakes, no apples, no 
* walls, just a set of cells in a field and cell behaviours per game 
* step:
* 	- empty cells, apples and walls just sit there
* 	- "snake" cells:
* 		- decrement age
* 		- if age is 0 clear cell
* 		- if cell has direction (i.e. snake head)
* 			- if target cell is red (apple) increment age
* 			- color new cell in direction:
* 				- set age on to current age + 1
* 				- set direction to current
* 			- clear direction
*
* NOTE: that in the above description some details are omitted for 
* 		clarity...
*
*
**********************************************************************/

function makeEvent(handler_attr){
	return function(func){
		if(func === null){
			delete this[handler_attr]

		} else if(func instanceof Function){
			var handlers = this[handler_attr] = this[handler_attr] || []
			handlers.push(func)

		} else {
			var that = this
			var args = [].slice.call(arguments)
			this[handler_attr]
				&& this[handler_attr]
					.forEach(function(handler){ handler.apply(that, args) })
		}
		return this
	}
}

var Snake = {
	config: {
		field_size: 32,
		apple_color: 'red',
		wall_color: 'silver',
		interval: 150,
	},

	_field: null,
	_cells: null,
	players: null,
	field_size: null,

	get random_point(){
		var cells = this._cells
		var l = cells.length
		var w = this.field_size.width

		do {
			var i = Math.floor(Math.random() * l)
		} while(cells[i].style.backgroundColor != '')

		return {
			x: i%w,
			y: Math.floor(i/w),
		}
	},
	get random_direction(){
		return ('nesw')[Math.floor(Math.random() * 4)] },

	// utils...
	normalize_point: function(point){
		point = point || {}

		var w = this.field_size.width
		var x = point.x % w
		x = x < 0 ? (x + w) : x

		var h = this.field_size.height
		var y = point.y % h
		y = y < 0 ? (y + h) : y

		return { x: x, y: y }
	},
	_make_field: function(w){
		var l = []
		l.length = w || this.config.field_size
		l.fill('<td/>')
		this._field.innerHTML = 
			`<table class="field" cellspacing="0">\n${ 
				l.map(function(){ 
					return `  <tr> ${ l.join('') } </tr>` 
				}).join('\n') 
			}\n</table>`
	},
	_step: function(){
		var that = this
		var l = this._cells.length
		var w = this.field_size.width
		var h = this.field_size.height
		var tick = this.__tick = (this.__tick + 1 || 0)
		var directions = 'neswn'

		this._cells.forEach(function(cell, i){
			var color = cell.style.backgroundColor

			// skip cells we touched...
			if(cell.tick == tick){
				return
			}

			// snake...
			if(cell.age != null){
				// handle cell age...
				if(cell.age == 0){
					delete cell.age
					cell.style.backgroundColor = ''

				} else {
					cell.age -= 1
				}

				// head...
				var direction = cell.direction
				if(directions.indexOf(direction) >= 0){
					// turn...
					if(that.players[color] != ''){
						var turn = that.players[color] || ''
						var j = turn == 'left' ? directions.indexOf(direction) - 1
							: directions.indexOf(direction) + 1
						j = j < 0 ? 3 : j
						direction = directions[j]
						that.players[color] = ''
					}

					// next cell index...
					var next = 
						direction == 'n' ? 
							(i < w ? l - w + i : i - w)
						: direction == 's' ? 
							(i > (l-w-1) ? i - (l-w) : i + w)
						: direction == 'e' ? 
							((i+1)%w == 0 ? i - (w-1) : i + 1)
						: (i%w == 0 ? i + (w-1) : i - 1)
					next = that._cells[next]

					var age = cell.age
					var move = false

					// special case: other snake's head -> kill both...
					if(next.direction){
						var other = next.style.backgroundColor
						next.style.backgroundColor = ''
						// NOTE: we are not deleteing .direction here as 
						//		we can have upto 4 snakes colliding...
						next.direction = ''
						delete next.age
						that.snakeKilled(other)
						that.snakeKilled(color)

					// apple -> grow age...
					} else if(next.style.backgroundColor == that.config.apple_color){
						age += 1
						move = true
						that.appleEaten()

					// empty -> just move...
					} else if(next.style.backgroundColor == ''){
						move = true

					// other -> kill...
					// NOTE: anything but an apple or empty will kill the snake...
					} else {
						that.snakeKilled(color)
					}

					// do the move...
					if(move){
						next.tick = tick
						next.style.backgroundColor = color
						next.age = age + 1
						next.direction = direction
					}

					delete cell.direction
				}
			}

			cell.tick = tick
		})
	},

	// constructors...
	snake: function(color, age, point, direction){
		point = this.normalize_point(point || this.random_point)

		var head = this._cells[point.x + point.y * this.field_size.width]
		head.style.backgroundColor = color
		head.direction = direction || this.random_direction
		head.age = (age || 5) - 1
		this.players[color] = ''

		return this
	},
	apple: function(point){
		point = this.normalize_point(point || this.random_point)
		this._cells[point.x + point.y * this.field_size.width]
			.style.backgroundColor = this.config.apple_color
		return this
	},
	wall: function(point, direction, length){
		direction = direction || this.random_direction
		point = this.normalize_point(point || this.random_point)
		var x = point.x
		var y = point.y
		length = length || 1

		while(length > 0){
			this._cells[x + y * this.field_size.width]
				.style.backgroundColor = this.config.wall_color

			x += direction == 'e' ? 1
				: direction == 'w' ? -1
				: 0
			x = x < 0 ? this.field_size.width + x
				: x % this.field_size.width
			y += direction == 'n' ? -1
				: direction == 's' ? 1
				: 0
			y = y < 0 ? this.field_size.height + y
				: y % this.field_size.height
			length -= 1
		}

		return this
	},

	// events...
	appleEaten: makeEvent('__appleEatenHandlers'),
	snakeKilled: makeEvent('__killHandlers'),

	// actions...
	setup: function(field, size){
		this.config.field_size = size || this.config.field_size
		field = field || this._field
		field = this._field = typeof(field) == typeof('str') ? document.querySelector(field)
			: field
		this._make_field()
		this._cells = [].slice.call(field.querySelectorAll('td'))
		this.field_size = {
			width: field.querySelector('tr').querySelectorAll('td').length,
			height: field.querySelectorAll('tr').length,
		}
		this.players = {}
		return this
			.appleEaten(null)
			.snakeKilled(null)
	},
	start: function(t){
		this.__timer = this.__timer 
			|| setInterval(this._step.bind(this), t || this.config.interval || 200)
		return this
	},
	stop: function(){
		clearInterval(this.__timer)
		delete this.__timer
		delete this.__tick
		return this
	},
	pause: function(){
		return this.__timer ? this.stop() : this.start() },
	left: function(color){ 
		this.players[color || Object.keys(this.players)[0]] = 'left' 
		return this
	},
	right: function(color){
		this.players[color || Object.keys(this.players)[0]] = 'right' 
		return this
	},

	// levels...
	basicLevel: function(){
		var a = Math.round(this.field_size.width/8)
		return this
			.wall({x:a*3, y:a*5}, 's', a*6)
			.wall({x:a*3, y:a*3}, 'e', a*2)
			.wall({x:a*5, y:a*3}, 's', a*2)
			.wall({x:a*5, y:a*5}, 'e', a*6) },
	randomLevel: function(){
		var a = Math.round(this.field_size.width/8)
		var b = Math.round(this.field_size.height/8)
		return this
			.wall(null, null, b*6)
			.wall(null, null, b*6)
			.wall(null, null, b*6) },
}



/*********************************************************************/

var HANDLER_SET = false
var KEY_CONFIG = {
	' ': ['pause'],
	ArrowLeft: ['left'],
	ArrowRight: ['right'], 
	// IE compatibility...
	Left: ['left'],
	Right: ['right'],
}

function makeKeyboardHandler(snake){
	return function(event){
		clearHints()
		var action = KEY_CONFIG[event.key]
		action 
			&& action[0] in snake 
			&& snake[action[0]].apply(snake, action.slice(1)) }}
function makeTapHandler(snake){
	return function(event){
		clearHints()
		// top of screen (1/8)...
		;(event.clientY || event.changedTouches[0].pageY) <= (document.body.clientHeight / 8) ? 
			setup()
		// bottom of screen 1/8...
		: (event.clientY || event.changedTouches[0].pageY) >= (document.body.clientHeight / 8)*8 ? 
			Snake.pause()
		// left/right of screen...
		: (event.clientX || event.changedTouches[0].pageX) <= (document.body.clientWidth / 2) ? 
			Snake.left() 
			: Snake.right() }}
function clearHints(){
	document.body.classList.contains('hints')
		&& document.body.classList.remove('hints') }


//---------------------------------------------------------------------

// XXX need to place the snake with some headroom in the direction of 
//		travel...
function setup(snake, timer, size){
	snake = snake || Snake

	// setup kb handler (only once)...
	if(!HANDLER_SET){
		document.addEventListener('keydown', makeKeyboardHandler(snake))
		//document.addEventListener('touchstart', makeTapHandler(snake))
		document.addEventListener('mousedown', makeTapHandler(snake))
		HANDLER_SET = true
	}

	return snake
		.setup('.simplesnake', size)
		.randomLevel()
		.start(timer)
		.pause()

		// stuff...
		.appleEaten(function(){ this.apple() })
		.apple()
		.apple()

		// players...
		.snakeKilled(function(color){ 
			this
				.pause()
				.snake(color, 3) })
		.snake('blue', 3)
}



/**********************************************************************
* vim:set ts=4 sw=4 :                                                */