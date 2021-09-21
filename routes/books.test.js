process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
  let result = await db.query(`
        INSERT INTO
        books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('123', 'https://amazon.com/book', 'testAuth', 'Enlgish', '1500', 'testPublisher', 'testTitle', 2020)
        RETURNING isbn`);

  book_isbn = result.rows[0].isbn;
});

afterEach(async () => {
  await db.query("DELETE FROM BOOKS");
});

describe("GET /books", () => {
  test("Gets list of books", async () => {
    const response = await request(app).get("/books");
    const { books } = response.body;

    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("author");
    expect(books[0].isbn).toEqual("123");
  });
});

describe("GET /books/:id", () => {
  test("Gets one book based on id(isbn)", async () => {
    const response = await request(app).get(`/books/${book_isbn}`);
    const { book } = response.body;

    expect(book).toHaveProperty("isbn");
    expect(book).toHaveProperty("author");
    expect(book.isbn).toEqual("123");
  });

  test("Errors if book isn't in db", async () => {
    const response = await request(app).get(`/books/999`);
    expect(response.statusCode).toBe(404);
  });
});

describe("POST /books", () => {
  test("Creates a new book", async () => {
    const response = await request(app).post(`/books`).send({
      isbn: "54321",
      amazon_url: "https://amazon.com/test",
      author: "testAuth2",
      language: "Spanish",
      pages: 2000,
      publisher: "testPub2",
      title: "testTitle2",
      year: 2021,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book).toHaveProperty("author");
    expect(response.body.book.isbn).toEqual("54321");
  });

  test("Errors if trying to add book without required field", async () => {
    const response = await request(app).post("/books").send({ pages: 200 });

    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /books/:isbn", () => {
  test("Updates a book", async () => {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      amazon_url: "https://amazon.com/test",
      author: "testAuth2",
      language: "Spanish",
      pages: 2000,
      publisher: "testPub2",
      title: "testTitle2",
      year: 2021,
    });

    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.year).toBe(2021);
    expect(response.body.book.language).toBe("Spanish");
  });

  test("Errors if data contains an isbn", async function () {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      isbn: "77777",
      amazon_url: "https://amazon.com/test",
      author: "testAuth2",
      language: "Spanish",
      pages: 2000,
      publisher: "testPub2",
      title: "testTitle2",
      year: 2021,
    });
    expect(response.statusCode).toBe(400);
  });

  test("Errors if book isn't in db", async () => {
    const response = await request(app).put(`/books/999`).send({
      amazon_url: "https://amazon.com/test",
      author: "testAuth2",
      language: "Spanish",
      pages: 2000,
      publisher: "testPub2",
      title: "testTitle2",
      year: 2021,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /books/:isbn", () => {
  test("Deletes a book from db", async () => {
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});

afterAll(async () => {
  await db.end();
});
