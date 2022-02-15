const request = require("supertest");
const { toBeSorted } = require("jest-sorted");
const app = require("../app.js");
const db = require("../db/connection.js");

// set up database with test data
const seed = require("../db/seeds/seed.js");
const testData = require("../db/data/test-data");
beforeEach(() => seed(testData));

// to close db connection once testing finished
afterAll(() => {
  if (db.end) db.end();
});

describe("/api", () => {
  // GET testing
  describe("GET /api", () => {
    test("status: 200 - responds with all ok message", () => {
      return request(app)
        .get("/api")
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual({ msg: "all ok" });
        });
    });
  });
});

// TOPICS

describe("/api/topics", () => {
  // GET testing
  describe("GET /api/topics", () => {
    test("status: 200 - responds with topic object", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then((response) => {
          // check that response object has a single key of topics
          expect(Object.keys(response.body)).toHaveLength(1);
          expect(Object.keys(response.body)[0]).toEqual("topics");
          // check that array of topic objects is the expected length
          expect(response.body.topics).toHaveLength(3);
          response.body.topics.forEach((topics) => {
            expect(topics).toEqual(
              expect.objectContaining({
                description: expect.any(String),
                slug: expect.any(String),
              })
            );
          });
        });
    });
  });
});

// ARTICLES

describe("/api/articles", () => {
  // GET testing
  describe("GET /api/articles", () => {
    test("status: 200 - responds with article object", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then((response) => {
          // check that response object has a single key of articles
          expect(Object.keys(response.body)).toHaveLength(1);
          expect(Object.keys(response.body)[0]).toEqual("articles");
          // check that array of article objects is the expected length
          expect(response.body.articles).toHaveLength(12);
          response.body.articles.forEach((article) => {
            expect(article).toEqual(
              expect.objectContaining({
                article_id: expect.any(Number),
                title: expect.any(String),
                topic: expect.any(String),
                author: expect.any(String),
                body: expect.any(String),
                created_at: expect.any(String),
                votes: expect.any(Number),
              })
            );
          });
        });
    });
    test("status: 200 - responds with article object ordered by date created descending", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then((response) => {
          // check that array of treasure objects is in descending order by age
          let dateCreated = response.body.articles.map((article) => {
            return article["created_at"];
          });
          expect(dateCreated).toBeSorted({ descending: true });
        });
    });
    test("status: 200 - articles include comment_count", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then((response) => {
          // make reference object for article comment counts
          let commentCountArray = {};
          response.body.articles.forEach((article) => {
            commentCountArray[article["article_id"]] = article["comment_count"];
          });
          expect(commentCountArray).toEqual({
            1: 11,
            2: 0,
            3: 2,
            4: 0,
            5: 2,
            6: 1,
            7: 0,
            8: 0,
            9: 2,
            10: 0,
            11: 0,
            12: 0,
          });
        });
    });
  });

  describe("GET /api/articles/:article_id", () => {
    test("status: 200 - responds with article", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then((response) => {
          // check that response object has a single key of articles/1
          expect(Object.keys(response.body)).toHaveLength(1);
          expect(Object.keys(response.body)[0]).toEqual("article");
          expect(response.body.article).toEqual(
            expect.objectContaining({
              article_id: expect.any(Number),
              title: expect.any(String),
              topic: expect.any(String),
              author: expect.any(String),
              body: expect.any(String),
              created_at: expect.any(String),
              votes: expect.any(Number),
            })
          );
        });
    });
    test("status: 200 - responds with article including comment_count", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then((response) => {
          // check that response object has a single key of articles/1
          expect(Object.keys(response.body)).toHaveLength(1);
          expect(Object.keys(response.body)[0]).toEqual("article");
          expect(response.body.article).toEqual({
            article_id: 1,
            title: "Living in the shadow of a great man",
            topic: "mitch",
            author: "butter_bridge",
            body: "I find this existence challenging",
            created_at: "2020-07-09T20:11:00.000Z",
            votes: 100,
            comment_count: 11,
          });
        });
    });
    test("status: 404 - responds with err msg for valid but non-existent article_id", () => {
      return request(app)
        .get("/api/articles/99")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("no article with this id exists");
        });
    });
  });

  describe("GET /api/articles/:article_id/comments", () => {
    test("status: 200 - responds with comments object", () => {
      return request(app)
        .get("/api/articles/1/comments")
        .expect(200)
        .then((response) => {
          // check that response object has a single key of comments
          expect(Object.keys(response.body)).toHaveLength(1);
          expect(Object.keys(response.body)[0]).toEqual("comments");
          // check that array of comment objects is the expected length
          expect(response.body.comments).toHaveLength(11);
          response.body.comments.forEach((comment) => {
            expect(comment).toEqual(
              expect.objectContaining({
                comment_id: expect.any(Number),
                votes: expect.any(Number),
                author: expect.any(String),
                body: expect.any(String),
                created_at: expect.any(String),
              })
            );
          });
        });
    });
    test("status: 200 - responds with empty array when no comments exist for article", () => {
      return request(app)
        .get("/api/articles/2/comments")
        .expect(200)
        .then((response) => {
          expect(response.body.comments).toEqual([]);
        });
    });
  });

  // PATCH testing
  describe("PATCH /api/articles/:article:_id", () => {
    test("status:200, responds with the updated article while ignoring any keys other than inc_votes", () => {
      const articleUpdate = {
        inc_votes: 12,
        irrelevant_key: "something irrelevant",
      };
      return request(app)
        .patch("/api/articles/1")
        .send(articleUpdate)
        .expect(200)
        .then((response) => {
          expect(response.body.article).toEqual({
            article_id: 1,
            title: "Living in the shadow of a great man",
            topic: "mitch",
            author: "butter_bridge",
            body: "I find this existence challenging",
            created_at: "2020-07-09T20:11:00.000Z",
            votes: 112,
          });
        });
    });
    test("status:400, no inc_votes on request body", () => {
      const articleUpdate = {
        irrelevant_key: "something irrelevant",
      };
      return request(app)
        .patch("/api/articles/2")
        .send(articleUpdate)
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("error - null value given");
        });
    });
    test("status:404 invalid inc_votes provided (string)", () => {
      const articleUpdate = {
        inc_votes: "a string",
      };
      return request(app)
        .patch("/api/articles/3")
        .send(articleUpdate)
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("error - invalid input");
        });
    });
    test("status:404 invalid inc_votes provided (boolean)", () => {
      const articleUpdate = {
        inc_votes: false,
      };
      return request(app)
        .patch("/api/articles/3")
        .send(articleUpdate)
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("error - invalid input");
        });
    });
  });
});

// USERS

describe("/api/users", () => {
  // GET testing
  describe("GET /api/users", () => {
    test("status: 200 - responds with user object", () => {
      return request(app)
        .get("/api/users")
        .expect(200)
        .then((response) => {
          // check that response object has a single key of users
          expect(Object.keys(response.body)).toHaveLength(1);
          expect(Object.keys(response.body)[0]).toEqual("users");
          // check that array of user objects is the expected length
          expect(response.body.users).toHaveLength(4);
          response.body.users.forEach((users) => {
            expect(users).toEqual(
              expect.objectContaining({
                username: expect.any(String),
                name: expect.any(String),
                avatar_url: expect.any(String),
              })
            );
          });
        });
    });
  });
});

// GENERAL

describe("Server - paths not found", () => {
  test("status: 404 - responds with path not found msg for incorrect path", () => {
    return request(app)
      .get("/api/not-an-endpoint")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("path not found");
      });
  });
});
