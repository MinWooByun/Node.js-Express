const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs");
const template = require("./lib/template.js");
const sanitizeHtml = require("sanitize-html");

app.get("/", (request, response) => {
  fs.readdir("./data", function (error, filelist) {
    const title = "Welcome";
    const description = "Hello, Node.js";
    const list = template.list(filelist);
    const html = template.HTML(title, list, `<h2>${title}</h2>${description}`, `<a href="/create">create</a>`);
    response.send(html);
  });
});

app.get("/page/:pageId", (request, response) => {
  fs.readdir("./data", function (error, filelist) {
    fs.readFile(`data/${request.params.pageId}`, "utf8", function (err, description) {
      const title = request.params.pageId;
      const sanitizedTitle = sanitizeHtml(title);
      const sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ["h1"],
      });
      const list = template.list(filelist);
      const html = template.HTML(
        sanitizedTitle,
        list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        `
        <a href="/create">create</a>
        <a href="/update/${sanitizedTitle}">update</a>
        <form action="delete_process" method="post">
          <input type="hidden" name="id" value="${sanitizedTitle}">
          <input type="submit" value="delete">
        </form>
        `
      );
      response.send(html);
    });
  });
});

app.get("/create", (request, response) => {
  fs.readdir("./data", function (error, filelist) {
    const title = "WEB - create";
    const list = template.list(filelist);
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
});

// create_process 말고 create form에서 주소를 create만 주고 post 방식이기 때문에 create만 적어줘도 된다.
// 이러면 get 방식이면 위에 코드가 실행되고 post 방식이면 아래의 코드가 실행된다.
app.post("/create_process", (request, response) => {
  let body = "";
  request.on("data", function (data) {
    body = body + data;
  });
  request.on("end", function () {
    const title = new URLSearchParams(body).get("title");
    const description = new URLSearchParams(body).get("description");
    fs.writeFile(`data/${title}`, description, "utf8", function (err) {
      response.redirect(302, `/page/${title}`);
    });
  });
});

app.get("/update/:pageId", (request, response) => {
  fs.readdir("./data", function (error, filelist) {
    const filteredId = request.params.pageId;
    fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
      const title = filteredId;
      const list = template.list(filelist);
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
      response.writeHead(200);
      response.end(html);
    });
  });
});

app.post("/update_process", (request, response) => {
  let body = "";
  request.on("data", function (data) {
    body = body + data;
  });
  request.on("end", function () {
    const id = new URLSearchParams(body).get("id");
    const title = new URLSearchParams(body).get("title");
    const description = new URLSearchParams(body).get("description");
    fs.rename(`data/${id}`, `data/${title}`, function (error) {
      fs.writeFile(`data/${title}`, description, "utf8", function (err) {
        response.writeHead(302, { Location: `/page/${title}` });
        response.end();
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// var http = require("http");
// var fs = require("fs");
// var url = require("url");
// var qs = require("querystring");
// var template = require("./lib/template.js");
// var path = require("path");
// var sanitizeHtml = require("sanitize-html");

// var app = http.createServer(function (request, response) {
//   var _url = request.url;
//   var queryData = url.parse(_url, true).query;
//   var pathname = url.parse(_url, true).pathname;
//   if (pathname === "/") {
//     } else {
//   } else if (pathname === "/create") {
//   } else if (pathname === "/create_process") {
//   } else if (pathname === "/update") {
//   } else if (pathname === "/update_process") {
//   } else if (pathname === "/delete_process") {
//     var body = "";
//     request.on("data", function (data) {
//       body = body + data;
//     });
//     request.on("end", function () {
//       var post = qs.parse(body);
//       var id = post.id;
//       var filteredId = path.parse(id).base;
//       fs.unlink(`data/${filteredId}`, function (error) {
//         response.writeHead(302, { Location: `/` });
//         response.end();
//       });
//     });
//   } else {
//     response.writeHead(404);
//     response.end("Not found");
//   }
// });
// app.listen(3000);
