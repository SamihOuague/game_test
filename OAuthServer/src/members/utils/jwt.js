let jwt = require("jsonwebtoken");

module.exports = {
    signToken: (body = {}, secret = process.env.SECRET_KEY, expiresIn = (60*60)) => {
        let token = jwt.sign({ ...body, iat: Date.now() }, secret, {expiresIn,});
        return token;
    },
    verifyToken: (token, secret = process.env.SECRET_KEY) => {
        try {
            let decoded = jwt.verify(token, secret);
            return decoded;
        } catch {
            return false;
        }
    }
}