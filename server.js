const { clusterApiUrl,
		Connection,
		PublicKey,
		LAMPORTS_PER_SOL } = require("@solana/web3.js");
const express = require("express");
const cors = require("cors");
const app = express();
const server = require("http").createServer(app);
const path = require("path");
const io = require("socket.io")(server);

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

function get_load()
{
	let load = [0, 0, 0, 0, 0, 0];
	let index = Math.floor(Math.random() * 100) % 6;
	load[index] = 1;
	return (load);
}

let rooms = [{ uid: 0, players: [], load: get_load(), counter: 0 }];
let uid = 0;
let ruid = 0;

app.use(cors());

app.get("/dist/bundle.js", (req, res) => {
	res.sendFile(path.join(__dirname, "/dist/bundle.js"));
});

app.get("/styles.css", (req, res) => {
	res.sendFile(path.join(__dirname, "/styles.css"));
});

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "/index.html"));
});

io.on("connection", async (socket) => {
	uid = uid + 1;
	let myId = uid;
	console.log(`New connection : ${ myId }`);
	socket.emit("myid", myId);
	socket.on("matchmaking", () => {
		let room = rooms[rooms.length - 1];
		let user = rooms.find((data) => ((data.players.length > 0 && data.players[0].uid == myId) || (data.players.length > 1 && data.players[1].uid == myId)));
		if (user) {
			console.log(`User ${myId} already in game.`);
			return ;
		}
		if (room.players.length == 1)
		{
			room.players.push({ uid: myId, balance: 1, first: 0 });
			socket.join(`room${room.uid}`);
			socket.broadcast.to(`room${room.uid}`).emit("matched", room);
			socket.emit("matched", room);
		}
		else if (room.players.length == 2)
		{
			room = { uid: room.uid + 1, players: [{ uid: myId, balance: 1, first: 1 }], load: get_load(), counter: 0 };
			rooms = [...rooms, room];
			socket.join(`room${room.uid}`);
		}
		else
		{
			room.players.push({ uid: myId, balance: 1, first: 1 });
			socket.join(`room${room.uid}`);
		}
	});

	socket.on("play", (data) => {
		let room = rooms.find((d) => d.uid == data.room_id);
		if (!room || room.counter >= 6)
			return ;
		if (!room.load[room.counter])
		{
			room.counter = room.counter + 1;
			socket.broadcast.to(`room${room.uid}`).emit("room", room);
			socket.emit("room", room);
		} 
		else
		{
			socket.broadcast.to(`room${room.uid}`).emit("endgame", { ...room, win: 1 });
			socket.emit("endgame", { ...room, win: 0 });
		}
	});

	socket.on("disconnect", () => {
		console.log("Connection closed : ", myId);
	});
});

server.listen("3000", () => {
	console.log("http://localhost:3000/");
});