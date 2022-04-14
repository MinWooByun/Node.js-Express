// router를 쓰는 이유는 서로 연관되어 있는 route들을 별도의 파일로 빼서 코드를 훨씬 보기 좋기 하기 위해서이다.
const express = require("express");
const router = express.Router();
const fs = require("fs");
const sanitizeHtml = require("sanitize-html");
const template = require("../lib/template.js");
const db = require("../lib/db");

router.get("/create", (request, response) => {
  const title = "WEB - create";
  const list = template.list(request.list);
  const html = template.HTML(
    title,
    list,
    `
    <form action="/topic/create_process" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
        <textarea name="description" placeholder="description"></textarea>
        </p>
        <p>
        <input type="submit">
        </p>
    </form>
      `,
    ""
  );
  response.send(html);
});

// create_process 말고 create form에서 주소를 create만 주고 post 방식이기 때문에 create만 적어줘도 된다.
// 이러면 get 방식이면 위에 코드가 실행되고 post 방식이면 아래의 코드가 실행된다.
router.post("/create_process", (request, response) => {
  const post = request.body;
  const title = post.title;
  const description = post.description;
  db.query("INSERT INTO topic(title, description, created) VALUES(?, ?, now())", [title, description], (err, result) => {
    response.redirect(`/topic/${title}`);
  });
});

router.get("/update/:pageId", (request, response) => {
  const filteredId = request.params.pageId;
  db.query("SELECT * FROM topic WHERE title=?", [filteredId], (err, topic) => {
    if (err) throw err;
    const title = filteredId;
    const list = template.list(request.list);
    const html = template.HTML(
      title,
      list,
      `
        <form action="/topic/update_process" method="post">
        <input type="hidden" name="oldId" value="${title}">
        <p><input type="text" name="title" placeholder="title" value="${title}"></p>
        <p>
            <textarea name="description" placeholder="description">${topic[0].description}</textarea>
        </p>
        <p>
            <input type="submit">
        </p>
        </form>
        `,
      `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`
    );
    response.send(html);
  });
});

router.post("/update_process", (request, response) => {
  const post = request.body;
  const oldId = post.oldId;
  const title = post.title;
  const description = post.description;
  db.query("UPDATE topic SET title=?, description=? WHERE title=?", [title, description, oldId], (err, result) => {
    response.redirect(`/topic/${title}`);
  });
});

router.post("/delete_process", (request, response) => {
  const post = request.body;
  const oldId = post.oldId;
  db.query("DELETE FROM topic WHERE title=?", [oldId], (err, result) => {
    response.redirect("/");
  });
});

router.get("/:pageId", (request, response) => {
  db.query("SELECT * FROM topic WHERE title=?", [request.params.pageId], (err, topic) => {
    if (err) throw err;
    const title = topic[0].title;
    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedDescription = sanitizeHtml(topic[0].description, {
      allowedTags: ["h1"],
    });
    const list = template.list(request.list);
    const html = template.HTML(
      sanitizedTitle,
      list,
      `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
      `
        <a href="/topic/create">create</a>
        <a href="/topic/update/${sanitizedTitle}">update</a>
        <form action="/topic/delete_process" method="post">
            <input type="hidden" name="oldId" value="${sanitizedTitle}">
            <input type="submit" value="delete">
        </form>
        `
    );
    response.send(html);
  });
});

module.exports = router;
