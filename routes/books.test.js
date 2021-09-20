process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
  let result = await AbortController.query(`
        INSERT INTO
        books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('123', 'https://amazon.com/book', 'testAuth', 'Enlgish', '1500', 'testPublisher', 'testTitle', 2020)
        RETURNING isbn`);

  book_isbn = result.rows[0].isbn;
});

afterEach(async () => {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async () => {
  await db.end();
});
