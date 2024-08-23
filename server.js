const { clusterApiUrl,
		Connection,
		PublicKey,
		LAMPORTS_PER_SOL } = require("@solana/web3.js");
let app = require("./OAuthServer/src/app.js");
require("./OAuthServer/src/db/mongoose");
const cors = require("cors");
const server = require("http").createServer(app);
const path = require("path");
const io = require("socket.io")(server);
const jwt = require("./OAuthServer/src/members/utils/jwt");
const RoomModel = require("./OAuthServer/src/members/RoomModel");
//const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

function get_load()
{
	let load = [0, 0, 0, 0, 0, 0];
	let index = Math.floor(Math.random() * 100) % 6;
	load[index] = 1;
	return (load);
}

let rooms = [];
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
	if (!socket.handshake.auth.token)
		return ;
	let token = jwt.verifyToken(socket.handshake.auth.token);
	if (!token)
		return ;
	let myId = token.uid;
	let myInterval = null;
	console.log(`New connection : ${ myId }`);
	socket.emit("myid", myId);
	socket.on("matchmaking", async () => {
		let r = await RoomModel.find({}).$where('this.players.length < 2');
		let room = null;
		if (r.length == 0)
		{
			room = new RoomModel({
				load: get_load(),
				players: [myId],
				balance: 1,
			});
			await room.save();
			socket.join(`room${room._id.toString()}`); 
		}
		else {
			r[r.length - 1].players.push(myId);
			await r[r.length - 1].save();
			room = r[r.length - 1];
			socket.join(`room${room._id.toString()}`);
			socket.broadcast.to(`room${room._id.toString()}`).emit("matched", room);
			socket.emit("matched", room);
		}
	});

	socket.on("leaveroom", (data) => {
		let { _id } = data;
		socket.leave(`room${_id}`);
	});

	socket.on("play", async (data) => {
		let room = await RoomModel.findOne({_id: data._id});
		if (!room || room.counter >= 6 || room.players[room.counter % 2].uid != data.myId)
			return ;
		if (!room.load[room.counter])
		{
			room.counter = room.counter + 1;
			await room.save();
			socket.broadcast.to(`room${room._id.toString()}`).emit("room", room);
			socket.emit("room", room);
		} 
		else
		{
			socket.broadcast.to(`room${room._id}`).emit("endgame", { ...room._doc, win: 1 });
			socket.emit("endgame", { ...room._doc, win: 0 });
		}
	});

	socket.on("disconnect", () => {
		console.log("Connection closed : ", myId);
	});
});

server.listen("3000", () => {
	console.log("http://localhost:3000/");
});