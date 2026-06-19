from schemas.evaluation_schemas import (
    EvaluationCommentWs,
    LikesUpdatedWs
)


"""
{
  "type": "new_comment",   // или "update_comment", "delete_comment"
  "comment": 
      {
        "id": "string",
        "evaluation_form_id": "string",
        "user_id": "string",
        "user_email": "string",
        "comment_text": "string",
        "created_at": "2026-06-13T11:19:14.324Z",
        "updated_at": "2026-06-13T11:19:14.324Z"
      }
}
"""
class CommentCreatedEvent:
    def __init__(self, comment: EvaluationCommentWs):
        self.comment: EvaluationCommentWs = comment

class LikesUpdatedEvent:
    def __init__(self, likes: LikesUpdatedWs):
        self.likes: LikesUpdatedWs = likes