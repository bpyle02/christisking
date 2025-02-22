import request from "supertest";
import server from "../server.js";
import { verifyJWT, formatDatatoSend, generateUsername } from "../server.js";
import jwt from "jsonwebtoken";
import User from "../Schema/User.js";
import bcrypt from 'bcrypt';
import { jest } from '@jest/globals';

let access_token = "";
let user_id = "";

describe('verifyJWT', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should fail if no token is provided', () => {
    verifyJWT(mockReq, mockRes, nextFunction);

    console.log(mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "No access token" });
  });

  it('should fail if token is invalid', () => {
    mockReq.headers['authorization'] = 'Bearer invalid_token';

    verifyJWT(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Access token is invalid" });
  });

  it('should call next() and set user data if token is valid', () => {
    const validToken = jwt.sign(
      { id: '123', admin: true },
      process.env.SECRET_ACCESS_KEY
    );
    mockReq.headers['authorization'] = `Bearer ${validToken}`;

    verifyJWT(mockReq, mockRes, nextFunction);

    expect(mockReq.user).toBe('123');
    expect(mockReq.admin).toBe(true);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

describe("POST /users", () => {
  it("should create a new user", async () => {
    const res = await request(server)
      .post("/users")
      .send({ fullname: "Test User", email: "test8@email.com", password: "Test1234!" });

    access_token = res.body.access_token
    console.log(res.body)
    const decoded = jwt.decode(access_token);
    console.log(decoded)
    user_id = decoded.id

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("access_token");
    expect(res.body).toHaveProperty("profile_img");
    expect(res.body).toHaveProperty("username");
    expect(res.body).toHaveProperty("fullname");
    expect(res.body).toHaveProperty("isAdmin");
  });

  it("should fail if fullname is too short", async () => {
    const res = await request(server)
      .post("/users")
      .send({ fullname: "Te", email: "test9@email.com", password: "Test1234!" });
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty("error", "Fullname must be at least 3 letters long");
  });

  it("should fail if email is missing", async () => {
    const res = await request(server)
      .post("/users")
      .send({ fullname: "Test User", email: "", password: "Test1234!" });
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty("error", "Enter Email");
  });

  it("should fail if email is invalid", async () => {
    const res = await request(server)
      .post("/users")
      .send({ fullname: "Test User", email: "testemail.com", password: "Test1234!" });
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty("error", "Email is invalid");
  });

  it("should fail if password does not meet complexity requirements", async () => {
    const res = await request(server)
      .post("/users")
      .send({ fullname: "Test User", email: "test10@email.com", password: "test" });
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty("error", "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters");
  });

  it("should fail if email is not unique", async () => {
    const res = await request(server)
      .post("/users")
      .send({ fullname: "Test User", email: "test8@email.com", password: "Test1234!" });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty("error", "Email already exists");
  });

//   it('should fail if there is an unexpected server error', async () => {
//     const mockSave = jest.fn().mockRejectedValueOnce(new Error('Some server error'));

//     User.prototype.save = mockSave;

//     jest.mock('bcrypt', () => ({
//       hash: jest.fn((password, saltRounds, callback) => {
//         callback(null, 'hashed_password');
//       }),
//     }));

//     jest.mock('../server.js', () => ({
//       generateUsername: jest.fn(() => 'testuser')
//     }));

//     const userDetails = {
//       fullname: 'Test User',
//       email: 'test10@email.com',
//       password: 'Test1234!'
//     };

//     const response = await request(server)
//       .post('/users')
//       .send(userDetails);

//     expect(response.statusCode).toBe(500);
//     expect(response.body).toHaveProperty("error", "Some server error");
//     expect(mockSave).toHaveBeenCalled();
//   });
});

// describe("POST /users/login", () => {
//   it("should login successfully", async () => {
//     const res = await request(server)
//       .post("/users/login")
//       .send({ email: "test8@email.com", password: "Test1234!" });

//     expect(res.statusCode).toEqual(200);
//     expect(res.body).toHaveProperty("access_token");
//     expect(res.body).toHaveProperty("profile_img");
//     expect(res.body).toHaveProperty("username");
//     expect(res.body).toHaveProperty("fullname");
//     expect(res.body).toHaveProperty("isAdmin");
//   });

//   it("should fail if email is incorrect", async () => {
//     const res = await request(server)
//       .post("/users/login")
//       .send({ email: "wrongemail@email.com", password: "Test1234!" });
//     expect(res.statusCode).toEqual(403);
//     expect(res.body).toHaveProperty("error", "Email not found");
//   });

//   it("should fail if bcrypt returns an error ", async () => {
//     const res = await request(server)
//       .post("/users/login")
//       .send({ email: "test8@email.com", password: null });
//     expect(res.statusCode).toEqual(403);
//     expect(res.body).toHaveProperty("error", "Error occured while logging in. Please try again");
//   });

//   it("should fail if password is incorrect", async () => {
//     const res = await request(server)
//       .post("/users/login")
//       .send({ email: "test8@email.com", password: "WrongPassword123!" });
//     expect(res.statusCode).toEqual(403);
//     expect(res.body).toHaveProperty("error", "Incorrect password");
//   });

//   test('should fail if user account was created with oauth', async () => {
//     const mockUser = {
//       personal_info: {
//         email: 'test@example.com',
//       },
//       google_auth: true,
//       facebook_auth: false
//     };

//     jest.spyOn(User, 'findOne').mockImplementationOnce(() => Promise.resolve(mockUser));

//     jest.spyOn(bcrypt, 'compare').mockImplementationOnce((password, hash, callback) => {
//       callback(null, false);
//     });

//     const response = await request(server)
//       .post('/users/login')
//       .send({
//         email: 'test@example.com',
//         password: 'anypassword'
//       });

//     expect(response.statusCode).toEqual(403);
//     expect(response.body).toHaveProperty("error", "Account was created using an oauth provider. Try logging in with with Facebook or Google.")
//     expect(User.findOne).toHaveBeenCalledWith({ "personal_info.email": "test@example.com" });
//     expect(bcrypt.compare).not.toHaveBeenCalled();

//     jest.restoreAllMocks();
//   });

//   it('should fail if there is an unexpected server error', async () => {
//     const originalFindOne = User.findOne;

//     User.findOne = jest.fn(() => {
//       return Promise.reject(new Error('Simulated server error'));
//     });

//     const response = await request(server)
//       .post('/users/login')
//       .send({
//         email: 'test@example.com',
//         password: 'Test1234!'
//       });

//     expect(response.statusCode).toEqual(500);
//     expect(response.body).toHaveProperty('error', 'Simulated server error');

//     User.findOne = originalFindOne;
//   });
// });

// describe("GET /users/:username", () => {
//   it("should get user data", async () => {
//     const res = await request(server)
//       .get("/users/test8")

//     expect(res.statusCode).toEqual(200);
//     expect(res.body).toHaveProperty("personal_info");
//     expect(res.body).toHaveProperty("social_links");
//     expect(res.body).toHaveProperty("account_info");
//   });

//   it("should fail if user is not found", async () => {
//     const res = await request(server)
//       .get("/users/usernotfound")

//     expect(res.statusCode).toEqual(404);
//     expect(res.body).toHaveProperty("error", "User not found");
//   });
// });

// describe("PUT /users/:id", () => {
//   it("should update user profile", async () => {
//     const res = await request(server)
//       .put(`/users/${user_id}`)
//       .set("Authorization", "Bearer " + access_token)
//       .send({
//         username: "newUsername",
//         bio: "Updated bio",
//         social_links: { twitter: "https://twitter.com/newTwitterHandle" }
//       });

//     expect(res.statusCode).toEqual(200);
//     expect(res.body.updatedUser.personal_info).toHaveProperty("username", "newUsername");
//     expect(res.body.updatedUser.personal_info).toHaveProperty("bio", "Updated bio");
//     expect(res.body.updatedUser.social_links).toHaveProperty("twitter", "https://twitter.com/newTwitterHandle");
//   });

//   it("should fail to update with unauthorized user", async () => {
//     const res = await request(server)
//       .put(`/users/${user_id}altered`)
//       .set("Authorization", "Bearer " + access_token)
//       .send({
//         username: "anotherUsername",
//         bio: "Another bio"
//       });
//     expect(res.statusCode).toEqual(403);
//     expect(res.body).toHaveProperty("error", "Forbidden");
//   });

//   it("should fail to update if new username already exists", async () => {
//     const res = await request(server)
//       .put(`/users/${user_id}`)
//       .set("Authorization", "Bearer " + access_token)
//       .send({
//         username: "testacc",
//         bio: "Another bio"
//       });
//     expect(res.statusCode).toEqual(409);
//     expect(res.body).toHaveProperty("error", "Username already taken");
//   });
// });

// describe("POST /users/:id", () => {
//   it("should update user password with correct credentials", async () => {
//     const res = await request(server)
//       .post(`/users/${user_id}`)
//       .set("Authorization", "Bearer " + access_token)
//       .send({
//         currentPassword: "Test1234!",
//         newPassword: "NewPassword123!"
//       });
//     expect(res.statusCode).toEqual(200);
//     expect(res.body).toHaveProperty("status", "password changed");
//   });

//   it("should fail to update password with invalid new password", async () => {
//     const res = await request(server)
//       .post(`/users/${user_id}`)
//       .set("Authorization", "Bearer " + access_token)
//       .send({
//         currentPassword: "NewPassword123!",
//         newPassword: "NewPassword"
//       });
//     expect(res.statusCode).toEqual(403);
//     expect(res.body).toHaveProperty("error", "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters");
//   });

//   it("should fail to update password with incorrect current password", async () => {
//     const res = await request(server)
//       .post(`/users/${user_id}`)
//       .set("Authorization", "Bearer " + access_token)
//       .send({
//         currentPassword: "WrongPassword123!",
//         newPassword: "NewPassword123!"
//       });
//     expect(res.statusCode).toEqual(403);
//     expect(res.body).toHaveProperty("error", "Incorrect current password");
//   });

//   it('should fail if user account was created with oauth', async () => {
//     const mockUser = {
//       personal_info: {
//         email: 'test@example.com',
//       },
//       google_auth: true,
//       facebook_auth: false
//     };

//     jest.spyOn(User, 'findOne').mockImplementationOnce(() => Promise.resolve(mockUser));

//     jest.spyOn(bcrypt, 'compare').mockImplementationOnce((password, hash, callback) => {
//       callback(null, false);
//     });

//     const response = await request(server)
//       .post(`/users/${user_id}`)
//       .set("Authorization", "Bearer " + access_token)
//       .send({
//         currentPassword: "WrongPassword123!",
//         newPassword: "NewPassword123!"
//       });

//     expect(response.statusCode).toEqual(403);
//     expect(response.body).toHaveProperty("error", "You can't change account's password because you logged in through google");
//     expect(bcrypt.compare).not.toHaveBeenCalled();

//     jest.restoreAllMocks();
//   });

//   it("should fail to update if User ID does not match logged in user", async () => {
//     const res = await request(server)
//       .post(`/users/${user_id}fail`)
//       .set("Authorization", "Bearer " + access_token)
//       .send({
//         currentPassword: "WrongPassword123!",
//         newPassword: "NewPassword123!"
//       });
//     console.log(res.body)
//     expect(res.statusCode).toEqual(403);
//     expect(res.body).toHaveProperty("error", "Incorrect User ID. You can only edit your account");
//   });

//   it('should fail if there is an unexpected server error', async () => {
//     const originalFindOne = User.findOne;

//     User.findOne = jest.fn(() => {
//       return Promise.reject(new Error('Unexpected server error'));
//     });

//     const response = await request(server)
//       .post(`/users/${user_id}`)
//       .set("Authorization", "Bearer " + access_token)
//       .send({
//         currentPassword: "WrongPassword123!",
//         newPassword: "NewPassword123!"
//       });

//     expect(response.statusCode).toEqual(500);
//     expect(response.body).toHaveProperty('error', 'Unexpected server error');

//     User.findOne = originalFindOne;
//   });
// });

describe("DELETE /users/:id", () => {
  it("should delete a user", async () => {
    const res = await request(server)
      .delete("/users/" + user_id)
      .set("Authorization", "Bearer " + access_token);
    expect(res.statusCode).toEqual(200);
  });

  it("should fail if User ID does not match logged in user", async () => {
    const res = await request(server)
      .delete(`/users/${user_id}fail`)
      .set("Authorization", "Bearer " + access_token);
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty("error", "Forbidden");
  });

  it('should fail if there is an unexpected server error', async () => {
    const originalFinByIdAndDelete = User.findByIdAndDelete;

    User.findByIdAndDelete = jest.fn(() => {
      return Promise.reject(new Error('Error deleting user'));
    });

    const response = await request(server)
      .delete(`/users/${user_id}`)
      .set("Authorization", "Bearer " + access_token)

    expect(response.statusCode).toEqual(500);
    expect(response.body).toHaveProperty('error', 'Error deleting user');

    User.findByIdAndDelete = originalFinByIdAndDelete;
  });
});