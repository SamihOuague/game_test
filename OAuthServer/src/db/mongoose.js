let mongoose = require("mongoose");

(async () => {
	mongoose.set('strictQuery', false);
	await mongoose.connect(process.env.MONGODB_URL);
})();