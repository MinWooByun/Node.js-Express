const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs");
const template = require("./lib/template.js");
const bodyParser = require("body-parser");
const compression = require("compression");
const indexRouter = require("./routes/index");
const topicRouter = require("./routes/topic");

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
// /topic으로 시작하는 주소들에게 topicRouter라는 이름의 미들웨어를 적용하겠다는 뜻이다.
// /topic으로 인해 topic.js 파일에서 /topic 경로를 설정해줄 필요가 없다.
app.use("/", indexRouter);
app.use("/topic", topicRouter);

app.use((request, response, next) => {
  response.status(404).send("Sorry can't find that!");
});

app.use((err, request, response, next) => {
  console.error(err.stack);
  response.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
