const { randomUUID } = require("crypto");
const { signToken, verifyToken } = require("./jwt");
const { createHash } = require("crypto");

let tokenRegister = {
    pkceToken: [],
    restictedAccessToken: [],
};

module.exports = {
    getPKCEToken: async (req, res) => {
        try {
            const { nonce } = req.query;
            if (!nonce) return res.status(400).send({ message: "Nonce parameters is required." });
            let body = { uuid: randomUUID(), nonce};
            let token = signToken(body, process.env.PKCE_SECRET_KEY, 60 * 60);
            tokenRegister.pkceToken.push(body);
            return res.send({token});
        } catch(e) {
            console.error(e);
            return res.sendStatus(500);
        }
    },
    verifyPKCEToken: async (req, res, next) => {
        try {
            const { nonce } = req.body;
            let pkce = verifyToken(req.headers.authorization, process.env.PKCE_SECRET_KEY);
            let isValid = tokenRegister.pkceToken.find((v) => v.uuid === pkce.uuid);
            if (!pkce || !isValid) return res.status(401).send({success: false, message: "Bad token."});
            else if (!nonce || createHash("sha256").update(String(nonce)).digest("hex") !== pkce.nonce)
                return res.status(400).send({success: false, message: "Bad nonce."});
            else tokenRegister.pkceToken = tokenRegister.pkceToken.filter((v) => v.uuid !== pkce.uuid);
        } catch(e) {
            console.error(e);
            return res.status(401).send({success: false, message: "Bad token."});
        }
        next();
    },
}