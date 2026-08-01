import { Divider, Stack, Typography } from "@mui/material"
import type { Comment } from "../services/comments.service"

interface CommentListProps {
  comments: Comment[]
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return <Typography color="text.secondary">Sin comentarios todavía.</Typography>
  }

  return (
    <Stack spacing={1.5} divider={<Divider />}>
      {comments.map((comment) => (
        <Stack key={comment.id} spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            {comment.authorName ?? "Usuario"} · {new Date(comment.createdAt).toLocaleString()}
          </Typography>
          <Typography>{comment.content}</Typography>
        </Stack>
      ))}
    </Stack>
  )
}
