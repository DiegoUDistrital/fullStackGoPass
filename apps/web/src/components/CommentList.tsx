import { Avatar, Stack, Typography } from "@mui/material"
import type { Comment } from "../services/comments.service"

interface CommentListProps {
  comments: Comment[]
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return <Typography color="text.secondary">Sin comentarios todavía.</Typography>
  }

  return (
    <Stack spacing={2}>
      {comments.map((comment) => (
        <Stack key={comment.id} direction="row" spacing={1.5}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, mt: 0.25 }}>
            {getInitials(comment.authorName ?? "Usuario")}
          </Avatar>
          <Stack spacing={0.25} sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {comment.authorName ?? "Usuario"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(comment.createdAt).toLocaleString()}
              </Typography>
            </Stack>
            <Typography variant="body2">{comment.content}</Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
