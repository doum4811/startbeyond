import { Link } from "react-router";
import type { Post } from "../queries";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { Badge } from "~/common/components/ui/badge";
import { DateTime } from "luxon";

interface PostListProps {
  posts: Post[];
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">작성한 게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Link to={`/community/${post.id}`} key={post.id}>
          <Card className="hover:bg-accent/50 transition-colors">
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-2">
                {post.content}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {post.category && <Badge variant="outline">{post.category}</Badge>}
              </div>
              <span className="text-sm text-muted-foreground">
                {DateTime.fromISO(post.created_at).toRelative()}
              </span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
} 