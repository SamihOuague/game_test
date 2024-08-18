const app = require("./app");
const request = require("supertest");
const Model = require("./members/Model");
require("./db/mongoose");

let user1 = {
    email: "test@test.com",
    password: "test1234",
}

let user2 = {
    email: "hello@test.com",
    password: "test1234",
}

beforeEach(async () => {
    await Model.findOneAndDelete(user2);
});

describe("GET /", () => {
    it("Should respond with 200 status code", async () => {
        let response = await request(app).get("/");
        expect(response.statusCode).toBe(200);
    });
});

describe("POST /register", () => {
    it("Should respond with 201 status code", async () => {
        let response = await request(app).post("/register").send(user2);
        expect(response.statusCode).toBe(201);
    });

    it("Should respond with 401 status code", async () => {
        let response = await request(app).post("/register").send(user1);
        expect(response.statusCode).toBe(401);
    });

    it("Should respond with message properties", async () => {
        let response = await request(app).post("/register").send(user1);
        expect(response.body.message).toBeDefined();
    });
});

describe("POST /login", () => {
    it("Should repond with 200 status code", async () => {
        let response = await request(app).post("/login").send(user1);
        expect(response.statusCode).toBe(200);
    });
});