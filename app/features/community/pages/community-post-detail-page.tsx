import { Link, Form, useParams, useNavigate, redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { Textarea } from "~/common/components/ui/textarea";
import { Label } from "~/common/components/ui/label";
import { getCommunityPostById, createCommunityComment, getCommentsByPostId, deleteCommunityPost, deleteCommunityComment } from "~/features/community/queries";
import type { CommunityPostWithAuthor, CommunityCommentWithAuthor, CommunityCommentInsert } from "~/features/community/queries";
import { DateTime } from "luxon";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

export interface CommunityPostDetailPageLoaderData {
  post: CommunityPostWithAuthor | null;
  comments: CommunityCommentWithAuthor[];
  profileId: string; // Current user's profile ID
}

interface ActionResponse {
  ok: boolean;
  error?: string;
  commentId?: string;
  intent?: string;
}

async function getProfileId(_request: Request): Promise<string> {
  return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a"; // Replace with actual profile ID
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as CommunityPostDetailPageLoaderData | undefined;
  const postTitle = pageData?.post?.title || "Post";
  return [
    { title: `${postTitle} - Community - StartBeyond` },
    { name: "description", content: pageData?.post?.content.substring(0, 150) || "View community post details." },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs): Promise<CommunityPostDetailPageLoaderData> {
  const profileId = await getProfileId(request);
  const postId = params.postId;
  if (!postId) {
    throw new Response("Post not found", { status: 404 });
  }
  const post = await getCommunityPostById({ postId });
  const comments = await getCommentsByPostId({ postId });
  
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }
  return { post, comments, profileId };
}

export async function action({ request, params }: ActionFunctionArgs): Promise<Response | ActionResponse> {
  const profileId = await getProfileId(request);
  const postId = params.postId;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (!postId) return { ok: false, error: "Post ID is missing." };

  try {
    if (intent === "addComment") {
      const content = formData.get("commentContent") as string;
      if (!content || content.trim() === "") {
        return { ok: false, error: "Comment content cannot be empty.", intent };
      }
      const commentData: CommunityCommentInsert = {
        post_id: postId,
        profile_id: profileId,
        content,
      };
      const newComment = await createCommunityComment(commentData);
      if (!newComment || !newComment.id) {
        return { ok: false, error: "Failed to create comment.", intent };
      }
      return { ok: true, commentId: newComment.id, intent };
    } else if (intent === "deleteComment") {
      const commentId = formData.get("commentId") as string;
      if (!commentId) return { ok: false, error: "Comment ID is missing for deletion.", intent };
      await deleteCommunityComment({ commentId, profileId });
      return { ok: true, commentId, intent };
    } else if (intent === "deletePost") {
      const post = await getCommunityPostById({ postId });
      if (post?.profile_id !== profileId) {
        return { ok: false, error: "You are not authorized to delete this post.", intent };
      }
      await deleteCommunityPost({ postId, profileId });
      return redirect("/community");
    }
    return { ok: false, error: "Unknown intent.", intent };
  } catch (error: any) {
    console.error("Action error:", error);
    return { ok: false, error: error.message || "An unexpected error occurred.", intent };
  }
}


export default function CommunityPostDetailPage({ loaderData }: { loaderData: CommunityPostDetailPageLoaderData }) {
  const { post, comments: initialComments, profileId } = loaderData;
  const navigate = useNavigate();
  // const actionData = useActionData<ActionData>(); // For handling form responses
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);
  
  // This useEffect handles navigation after post deletion
  // It needs to access actionData from the Form component for this to work correctly with Remix v2 actions.
  // A more robust way might be to use fetcher for deletions if not navigating away.

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 pt-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-6">The post you are looking for does not exist or has been removed.</p>
        <Button asChild>
          <Link to="/community">← Back to Community</Link>
        </Button>
      </div>
    );
  }
  
  const isOwner = post.profile_id === profileId;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 pt-16">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/community">← Back to Community</Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author_avatar_url || undefined} alt={post.author_name || "User"} />
              <AvatarFallback>{post.author_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{post.author_name || "Anonymous"}</p>
              <p className="text-sm text-muted-foreground">
                {DateTime.fromISO(post.created_at).toLocaleString(DateTime.DATETIME_MED) || ""}
              </p>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-1">{post.title}</CardTitle>
          {post.category && <CardDescription className="text-md text-primary font-medium">{post.category}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none whitespace-pre-line">
            {post.content}
          </div>
        </CardContent>
        {isOwner && (
          <CardFooter className="flex justify-end gap-2">
            {/* <Button variant="outline" asChild>
              <Link to={`/community/${post.id}/edit`}>Edit</Link> 
            </Button> */}
            <Form method="post" onChange={(e) => {
                const formData = new FormData(e.currentTarget);
                // actionData cannot be reliably read this way in Remix v2 form patterns.
                // const actionData = JSON.parse(formData.get("actionData") as string) as ActionData;
                // if (actionData?.ok && actionData.intent === "deletePost") {
                //     navigate("/community");
                // }
                // For navigation on delete, it's better to handle in useEffect based on actionData from useActionData or navigate from action itself if appropriate.
            }}>
              <input type="hidden" name="intent" value="deletePost" />
              <Button variant="destructive" type="submit" onClick={(event) => !confirm("Are you sure you want to delete this post?") && event.preventDefault() } >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Post
              </Button>
            </Form>
          </CardFooter>
        )}
      </Card>

      <h2 className="text-2xl font-semibold mb-4 mt-10">Comments ({comments.length})</h2>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Form method="post" className="space-y-3" onSubmit={() => setFormError(null)}
           onChange={(e) => {
            const formData = new FormData(e.currentTarget);
            const actionData = JSON.parse(formData.get("actionData") as string) as ActionResponse;
            if(actionData?.ok && actionData.intent === "addComment"){
                setCommentContent("");
                // Optimistically add comment or refetch
                // For now, relying on page reload or manual re-fetch via loader
                // Ideally, update comments state here.
            } else if (actionData?.error) {
                setFormError(actionData.error)
            }
           }}
          >
            <input type="hidden" name="intent" value="addComment" />
            <div>
              <Label htmlFor="commentContent" className="sr-only">Your Comment</Label>
              <Textarea 
                id="commentContent" 
                name="commentContent" 
                rows={3} 
                placeholder="Write a comment..." 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                required
              />
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex justify-end">
              <Button type="submit">Post Comment</Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {comments.length > 0 ? comments.map(comment => (
          <Card key={comment.id} className="bg-muted/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author_avatar_url || undefined} alt={comment.author_name || "User"} />
                    <AvatarFallback className="text-xs">{comment.author_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm">{comment.author_name || "Anonymous"}</p>
                </div>
                <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">
                    {DateTime.fromISO(comment.created_at).toRelative() || ""}
                    </p>
                    {comment.profile_id === profileId && (
                         <Form method="post" onChange={(e) => {
                            const formData = new FormData(e.currentTarget);
                            // Similar to above, actionData is not reliably read here.
                            // const actionData = JSON.parse(formData.get("actionData") as string) as ActionData;
                            // if (actionData?.ok && actionData.intent === "deleteComment") {
                            //     setComments(prev => prev.filter(c => c.id !== actionData.commentId));
                            // }
                         }}>
                            <input type="hidden" name="intent" value="deleteComment" />
                            <input type="hidden" name="commentId" value={comment.id} />
                            <Button variant="ghost" size="icon" type="submit" className="h-7 w-7" onClick={(event) => !confirm("Delete this comment?") && event.preventDefault() }>
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </Form>
                    )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-sm whitespace-pre-line">{comment.content}</p>
            </CardContent>
          </Card>
        )) : (
          <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
} 