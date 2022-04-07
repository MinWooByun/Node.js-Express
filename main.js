const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs");
const template = require("./lib/template.js");
const sanitizeHtml = require("sanitize-html");
const bodyParser = require("body-parser");
const compression = require("compression");

// public 디렉터리 안에서 static 파일을 찾겠다는 뜻이다.
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());
// 미들웨어 만들기 get 방식중에 모두에 해당됨.
app.get("*", (request, response, next) => {
  fs.readdir("./data", function (error, filelist) {
    request.list = filelist;
    next();
  });
});

app.get("/", (request, response) => {
  const title = "Welcome";
  const description = "Hello, Node.js";
  const list = template.list(request.list);
  const html = template.HTML(
    title,
    list,
    `<h2>${title}</h2>${description}<img src="/images/hello.jpg" style="width:300px; display:block; margin-top:10px">`,
    `<a href="/create">create</a>`
  );
  response.send(html);
});

app.get("/page/:pageId", (request, response) => {
  fs.readFile(`data/${request.params.pageId}`, "utf8", function (err, description) {
    const title = request.params.pageId;
    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedDescription = sanitizeHtml(description, {
      allowedTags: ["h1"],
    });
    const list = template.list(request.list);
    const html = template.HTML(
      sanitizedTitle,
      list,
      `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
      `
        <a href="/create">create</a>
        <a href="/update/${sanitizedTitle}">update</a>
        <form action="/delete_process" method="post">
          <input type="hidden" name="id" value="${sanitizedTitle}">
          <input type="submit" value="delete">
        </form>
        `
    );
    response.send(html);
  });
});

app.get("/create", (request, response) => {
  const title = "WEB - create";
  const list = template.list(request.list);
  const html = template.HTML(
    title,
    list,
    `
      <form action="/create_process" method="post">
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
app.post("/create_process", (request, response) => {
  const post = request.body;
  const title = post.title;
  const description = post.description;
  fs.writeFile(`data/${title}`, description, "utf8", function (err) {
    response.redirect(`/page/${title}`);
  });
});

app.get("/update/:pageId", (request, response) => {
  const filteredId = request.params.pageId;
  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
    const title = filteredId;
    const list = template.list(request.list);
    const html = template.HTML(
      title,
      list,
      `
        <form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
      `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
    );
    response.send(html);
  });
});

app.post("/update_process", (request, response) => {
  const post = request.body;
  const id = post.id;
  const title = post.title;
  const description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, "utf8", function (err) {
      response.redirect(`/page/${title}`);
    });
  });
});

app.post("/delete_process", (request, response) => {
  const post = request.body;
  const id = post.id;
  fs.unlink(`data/${id}`, function (error) {
    response.redirect(`/`);
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
