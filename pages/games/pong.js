let lastTime = 0;
const fps = 60;
const interval = 1000 / fps; // Interval in milliseconds

export function gameLoop(currentTime){
	// Calculate the time elapsed since the last frame
	const deltaTime = currentTime - lastTime;
	
	// Check if enough time has passed to trigger the event
	if(deltaTime >= interval){
		update();
		
		
		// Update the last time
		lastTime = currentTime - (deltaTime % interval);
	}
	
	requestAnimationFrame(gameLoop);
}

const canvas = document.getElementById("Display");
const ctx = canvas.getContext("2d");
let ballVec={ x: 1.5, y: 1.5 };
let currentKey=' ';
let score = 0;
let gameover = 1;
export function init(){
	const randomNumber = Math.floor(Math.random() * 4);
	switch(randomNumber){
		case 0:break;
		case 1: ballVec.x*=-1; break;
		case 2: ballVec.y*=-1; break;
		case 3: ballVec.x*=-1; ballVec.y*=-1; break;
	}
	ctx.font = '10px Arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.fillStyle = 'yellow';
	
	document.addEventListener('keyup', (event) => {
		const key = event.key;
		switch (key) {
			case 'w': if(currentKey=='W'){ currentKey=' '; } break;
			case 'W': if(currentKey=='W'){ currentKey=' '; } break;
			case 's': if(currentKey=='S'){ currentKey=' '; } break;
			case 'S': if(currentKey=='S'){ currentKey=' '; } break;
			case 'ArrowUp': if(currentKey=='W'){ currentKey=' '; } break;
			case 'ArrowDown': if(currentKey=='S'){ currentKey=' '; } break;
		}
	});
	document.addEventListener('keydown', (event) => {
		const key = event.key;
		switch (key) {
			case 'w':
			case 'W': currentKey='W'; break;
			case 's':
			case 'S': currentKey='S'; break;
			case 'ArrowUp': currentKey='W'; break;
			case 'ArrowDown': currentKey='S'; break;
			case 'r': if(gameover==0){ break; } gameover=0; break;
			case 'R': if(gameover==0){ break; } gameover=0; break;
		}
	});
	canvas.addEventListener('touchstart', (event) => {
		event.preventDefault();
		const touch = event.changedTouches[0];
		const rect = canvas.getBoundingClientRect();
		
		const x = touch.clientX - rect.left;
		const y = touch.clientY - rect.top;
		
		if(gameover>0){ gameover=0; }
		if(y*0.5<paddle){ currentKey='W'; }
		if(y*0.5>paddle){ currentKey='S'; }
	});
	canvas.addEventListener('touchend', (event) => {
		event.preventDefault();
		currentKey=' ';
	});
	
	
}



let ballX=80;
let ballY=60;
let paddle=ballY;
let hit=0;
let highScore=0;
function update(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "rgb(255 255 255)";
	ctx.fillRect(0, paddle-10, 5, 20);
	ctx.fillRect(155, ballY-10, 5, 20);
	const circle = new Path2D();
	circle.arc(ballX, ballY, 3, 0, 2 * Math.PI);
	ctx.fill(circle);
	
	if(gameover>0){
		if(gameover==1){
			const raw = localStorage.getItem("pong");
			if(raw){
				const localUser = JSON.parse(raw);
				highScore = localUser.highScore;
			}else{ highScore=0; }
			if(score>highScore){
				localStorage.setItem("pong", JSON.stringify({ highScore: score, }));
				highScore = score;
			}
			gameover=2;
			score=0;
		}
		
		ballX = 80;
		ballY = 60;
		paddle = ballY;
		const text = "Press R to reset";
		ctx.fillText(text, canvas.width / 2, 10);
		let sc = 'High Score<'+highScore+'>';
		ctx.fillText(sc, canvas.width / 2, 30);
		
	}else{
		let sc = 'Score<'+score+'>';
		ctx.fillText(sc, canvas.width / 2, 5);
		
		if(currentKey=='W'&&paddle>10){
			paddle-=2;
		}else if(currentKey=='S'&&paddle<110){
			paddle+=2;
		}
		
		ballX+=ballVec.x;
		ballY+=ballVec.y;
		if(ballY>=120-1.5||ballY<1.5){ ballVec.y=-ballVec.y; }
		if(ballX>155-1.5){ ballVec.x=-ballVec.x; hit=0; }
		
		
		if(ballX<5+1.5&&ballY>paddle-11.5&&ballY<paddle+11.5&&ballX>=4.5&&hit==0){
			if(ballY-paddle<=5.0&&ballY-paddle>=-5.0){ ballVec.x=1.5;if(ballVec.y>0){ ballVec.y=1.5; }else{ ballVec.y=-1.5; } }
			if(ballY-paddle>4){
				ballVec.x=1.2;
				ballVec.y=1.8;
			}
			if(ballY-paddle<-5){
				ballVec.x=1.2;
				ballVec.y=-1.8;
			}
			hit=1;
			score+=1;
		}
		if(ballX<-5){ gameover = 1; }
	}
}





