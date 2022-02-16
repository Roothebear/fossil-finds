const commentsRouter = require("express").Router();
const { removeCommentById } = require("../controllers/comments.controllers.js");

commentsRouter.route("/:comment_id").delete(removeCommentById);

module.exports = commentsRouter;