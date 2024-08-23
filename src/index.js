import { io } from "socket.io-client";
import { sha256 } from "js-sha256";

let loadingPage = document.getElementById("loading");
let authPage = document.getElementById("auth");
let game = document.getElementById("game");
let startContainer = document.getElementById("start");
let pkceInput = document.getElementById("login-pkce");
let loginNonce = document.getElementById("login-nonce");
let registerNonce = document.getElementById("register-nonce");
let result = document.getElementById("result");
let playBtn = document.getElementById("play-btn");
let backBtn = document.getElementById("back-btn")
let cylinder = document.getElementById("cylinder");
let loginElt = document.getElementById("login-container");
let registerElt = document.getElementById("register-container");
let myId = -1;
let room = null;

let loadingFn = (elt) => {
	loadingPage.style.display = "block";
	elt.style.display = "none";
};

let endLoading = (elt) => {
	loadingPage.style.display = "none";
	elt.style.display = "block";
};

function init_game_socket()
{
	const socket = io("ws://localhost:3000", {
		auth: {
			token: localStorage.getItem("token"),
		}
	});

	socket.on("connect", () => {
		console.log("Connected to the server.");
	});

	socket.on("matched", (data) => {
		console.log(data);
		room = data;
		result.textContent = "Your turn";
		playBtn.style.backgroundColor = "#e74c3c";
		result.style.color = "#e74c3c";
		if (room.players[0] != myId) {
			playBtn.disabled = true;
			playBtn.style.backgroundColor = "grey";
			result.textContent = "Player 2's turn";
		}
		start.style.display = "none";
		playBtn.disabled = false;
		playBtn.style.display = "block";
		backBtn.style.display = "none";
		startContainer.style.display = "none";
		cylinder.children[0].classList.add("bullet");
		for (let i = 1; i < cylinder.children.length; i++) {
			cylinder.children[i].classList.remove("bullet");
		}
		endLoading(game);
	});

	socket.on("endgame", (data) => {
		playBtn.disabled = true;
		playBtn.style.display = "none";
		backBtn.style.display = "block";
		if (data.win) {
			result.style.color = "green";
			result.textContent = "You Win !!";
		}
		else
			result.textContent = "You Loose..";
		socket.emit("leaveroom", data);
		console.log(data);
	});

	socket.on("room", (data) => {
		console.log(data);
		room = data;
		let i = room.counter;
		if (i == 3)
			i = 5;
		else if (i == 4)
			i = 3;
		else if (i == 5)
			i = 4;
		cylinder.children[i].classList.add("bullet");
		let id = room.players[room.counter % 2];
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
		socket.emit("play", room);
	});

	socket.on("myid", (id) => {
		myId = id;
	});

	let channelList = document.getElementById("channel-list");
	for (let i = 0; i < channelList.children.length; i++) {
		channelList.children[i].addEventListener("click", (e) => {
			loadingFn(startContainer);
			socket.emit("matchmaking", null);
		});
	}
}

(async () => {
	let token = window.localStorage.getItem("token");
	let response = await (await fetch("http://localhost:3000/ping", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Barear ${token}`
		}
	})).json();
	if (response.success) {
		init_game_socket();
		endLoading(startContainer);
		return ;
	} else {
		endLoading(authPage);
	}
	let pkce = await get_pkce();
	if (!pkce.token)
		return ;
	pkceInput.value = pkce.token;
	loginNonce.value = pkce.nonce;
})();

let get_pkce = async () => {
	let nonce = String(Math.floor(Math.random() * (Math.pow(10, 10))));
	let pkce = await (await fetch(`http://localhost:3000/get-pkce?nonce=${sha256(nonce)}`)).json();
	return ({...pkce, nonce});
}

let authLink = document.getElementsByClassName("auth-link");

for (let i = 0; i < authLink.length; i++) {
	authLink[i].addEventListener("click", async (e) => {
		e.preventDefault();
		loadingFn(authPage);
		let pkce = await get_pkce();
		endLoading(authPage);
		if (loginElt.style.display == "none") {
			pkceInput = document.getElementById("login-pkce");
			loginElt.style.display = "block";
			registerElt.style.display = "none";
			pkceInput.value = pkce.token;
			loginNonce.value = pkce.nonce;
		} else {
			pkceInput = document.getElementById("register-pkce");
			loginElt.style.display = "none";
			registerElt.style.display = "block";
			pkceInput.value = pkce.token;
			registerNonce.value = pkce.nonce;
		}
	});
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
	e.preventDefault();
	let { username, password, pkce, nonce } = e.target;
	loadingFn(authPage);
	let response = await (await fetch("http://localhost:3000/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `${pkce.value}`
		},
		body: JSON.stringify({
			username: username.value,
			password: password.value,
			nonce: nonce.value,
		}),
	})).json();
	if (response.success) {
		localStorage.setItem("token", response.token);
		init_game_socket();
		endLoading(startContainer);
	} else {
		endLoading(authPage);
	}
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
	e.preventDefault();
	let { username, password, pkce, nonce } = e.target;
	loadingFn(authPage);
	let response = await (await fetch("http://localhost:3000/register", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `${pkce.value}`,
		},
		body: JSON.stringify({
			username: username.value,
			password: password.value,
			nonce: nonce.value,
		})
	})).json();
	if (response.success) {
		localStorage.setItem("token", response.token);
		init_game_socket();
		endLoading(startContainer);
	} else {
		endLoading(authPage);
	}
});

backBtn.addEventListener("click", () => {
	game.style.display = "none";
	start.style.display = "block";
	startContainer.style.display = "block";
});