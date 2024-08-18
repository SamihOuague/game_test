import { io } from "socket.io-client";

const socket = io("ws://localhost:3000");

let loadingPage = document.getElementById("loading");
let authPage = document.getElementById("auth");
let game = document.getElementById("game");
let startContainer = document.getElementById("start");

let start = document.getElementById("start-button");
let result = document.getElementById("result");
let playBtn = document.createElement("button");
let cylinder = document.getElementById("cylinder");
let myId = -1;
let room = null;
playBtn.textContent = "Shoot";

socket.on("connect", (data) => {
	console.log(data);
});

socket.on("matched", (data) => {
	console.log(data);
	room = data;
	result.textContent = "Your turn";
	if (room.players[0].uid != myId)
	{
		playBtn.disabled = true;
		playBtn.style.backgroundColor = "grey";
		result.textContent = "Player 2's turn";
	}
	start.remove();
	game.appendChild(playBtn);
	game.style.display = "block";
	startContainer.style.display = "none";
	cylinder.children[0].classList.add("bullet");
});

socket.on("endgame", (data) => {
	playBtn.disabled = true;
	playBtn.style.backgroundColor = "grey";
	if (data.win) {
		result.style.color = "green";
		result.textContent = "You Win !!";
	}
	else
		result.textContent = "You Loose..";
});

socket.on("room", (data) => {
	room = data;
	cylinder.children[room.counter].classList.add("bullet");
	let id = room.players[room.counter % 2].uid;
	if (id == myId) {
		playBtn.disabled = false;
		playBtn.style.backgroundColor = "#e74c3c";
		result.textContent = "Your turn";
	} else {
		playBtn.disabled = true;
		playBtn.style.backgroundColor = "grey";
		result.textContent = "Player 2's turn";
	}
});

playBtn.addEventListener("click", () => {
	if (myId == -1 || !room)
		return ;
	socket.emit("play", { room_id: room.uid, myId });
});

socket.on("myid", (id) => {
	console.log(id);
	myId = id;
});

start.addEventListener("click", async (e) => {
	socket.emit("matchmaking", null);
	start.disabled = true;
	start.style.backgroundColor = "grey";
	start.textContent = "Loading...";
});