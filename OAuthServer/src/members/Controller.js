const Model = require("./Model");
const jwt = require("./utils/jwt");

module.exports = {
    ping: async (req, res) => {
        try {
            const authorization = req.headers.authorization;
            const token = jwt.verifyToken(authorization.split(" ")[1], process.env.SECRET_KEY);
            if (!token) return res.status(401).send({success: false, message: "Invalid token."});
            else if (token.exp < Date.now()) return res.status(401).send({success: false, message: "Expired token."});
            return res.send({ success: true, token });
        } catch {
            return res.status(401).send({ success: false });
        }
    },
    register: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) return res.status(400).send({ success: false, message: "Malformed body." });
            else if (password.length < 8) return res.status(400).send({ success: false, message: "Password too short." });
            let model = new Model({
                username,
                password,
            });
            let user = await model.save();
            if (!user) return res.status(500).send({success: false, message: "User not created."});
            return res.status(201).send({ success: true, token: jwt.signToken({ uid: user._id }, process.env.SECRET_KEY, 60*60*60), uid: user._id });
        } catch(e) {
            if (e && e.code == 11000) return res.status(401).send({success: false, message: "Email already used."});
            console.error(e);
            return res.status(500).send(e);
        }
    },
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) return res.status(400).send({success: false, message: "Malformed body."});
            let user = await Model.findOne({ username });
            if (!user) return res.status(404).send({success: false, message: "User does not exists."});
            if (!user.comparePwd(password)) return res.send({success: false, message: "Wrong password."});
            return res.send({ success: true, token: jwt.signToken({ uid: user._id }, process.env.SECRET_KEY, 60*60*60), uid: user._id });
        } catch(e) {
            return res.status(500).send({success: false, message: "Something wrong."});
        }
    }
}