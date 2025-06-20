import { Link, Form, useNavigate, redirect, useFetcher } from "react-router";
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
import { makeSSRClient } from "~/supa-client";
import { useTranslation } from "react-i18next";
import { cn } from "~/lib/utils";
import { POST_CATEGORIES } from "../constants";

export interface CommunityPostDetailPageLoaderData {
  post: CommunityPostWithAuthor | null;
  comments: CommunityCommentWithAuthor[];
  profileId: string; // Current user's profile ID
}

interface ActionResponse {
  ok: boolean;
  errorKey?: string;
  commentId?: string;
  intent?: string;
}

// async function getProfileId(_request: Request): Promise<string> {
//   return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a"; // Replace with actual profile ID
// }
async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  return user.id;
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
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const postId = params.postId;
  if (!postId) {
    throw new Response("Post not found", { status: 404 });
  }
  const post = await getCommunityPostById(client, { postId });
  const comments = await getCommentsByPostId(client, { postId });
  
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }
  return { post, comments, profileId };
}

export async function action({ request, params }: ActionFunctionArgs): Promise<Response | ActionResponse> {
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const postId = params.postId;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (!postId) return { ok: false, errorKey: "Post ID is missing." }; // This error is internal

  try {
    if (intent === "addComment") {
      const content = formData.get("commentContent") as string;
      if (!content || content.trim() === "") {
        return { ok: false, errorKey: "community.post_detail_page.error_comment_empty", intent };
      }
      const commentData: CommunityCommentInsert = {
        post_id: postId,
        profile_id: profileId,
        content,
      };
      const newComment = await createCommunityComment(client, commentData);
      if (!newComment || !newComment.id) {
        return { ok: false, errorKey: "community.post_detail_page.error_comment_failed", intent };
      }
      return { ok: true, commentId: newComment.id, intent };
    } else if (intent === "deleteComment") {
      const commentId = formData.get("commentId") as string;
      if (!commentId) return { ok: false, errorKey: "Comment ID is missing for deletion.", intent };
      await deleteCommunityComment(client, { commentId, profileId });
      return { ok: true, commentId, intent };
    } else if (intent === "deletePost") {
      const post = await getCommunityPostById(client, { postId });
      if (post?.profile_id !== profileId) {
        return { ok: false, errorKey: "community.post_detail_page.error_unauthorized_delete", intent };
      }
      await deleteCommunityPost(client, { postId, profileId });
      return redirect("/community");
    }
    return { ok: false, errorKey: "Unknown intent.", intent };
  } catch (error: any) {
    console.error("Action error:", error);
    return { ok: false, errorKey: error.message || "An unexpected error occurred.", intent };
  }
}


export default function CommunityPostDetailPage({ loaderData }: { loaderData: CommunityPostDetailPageLoaderData }) {
  const { post, comments: initialComments, profileId } = loaderData;
  const { t, i18n } = useTranslation();
  const fetcher = useFetcher<ActionResponse>();
  const navigate = useNavigate();
  
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState(initialComments);
  
  console.log("DEBUG: Post Author Data for Link ->", post?.author);
  
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      if (fetcher.data.ok) {
        if (fetcher.data.intent === 'addComment') {
          setCommentContent('');
          // Re-fetch data to get new comment
          navigate('.', { replace: true }); 
        } else if (fetcher.data.intent === 'deleteComment') {
          setComments(prev => prev.filter(c => c.id !== fetcher.data?.commentId));
        }
      }
    }
  }, [fetcher.data, fetcher.state, navigate]);
  
  if (!i18n.isInitialized) {
    return null; // Or a loading spinner
  }

  const actionError = fetcher.data?.errorKey ? t(fetcher.data.errorKey) : null;

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 pt-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">{t('community.post_detail_page.post_not_found_title')}</h1>
        <p className="text-muted-foreground mb-6">{t('community.post_detail_page.post_not_found_description')}</p>
        <Button asChild>
          <Link to="/community">{t('community.new_post_page.back_to_community')}</Link>
        </Button>
      </div>
    );
  }
  
  const isOwner = post.profile_id === profileId;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/community">{t('community.new_post_page.back_to_community')}</Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold mb-2">{post.title}</CardTitle>
          {post.category && <CardDescription className="text-md text-primary font-medium mb-4">{t(POST_CATEGORIES.find(c => c.value === post.category)?.tKey ?? post.category)}</CardDescription>}

          <div className="flex items-center justify-between w-full text-sm">
            <Link
              to={post.author?.username ? `/users/${post.author.username}` : '#'}
              className={cn(
                "flex items-center gap-2 group",
                !post.author?.username && "pointer-events-none"
              )}
            >
              <Avatar className="h-8 w-8">
              <AvatarImage src={post.author?.avatar_url || undefined} alt={post.author?.full_name || t('community.anonymous')} />
              <AvatarFallback>{post.author?.full_name?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
              <p className="font-semibold group-hover:underline">{post.author?.full_name || t('community.anonymous')}</p>
            </Link>
            <p className="text-muted-foreground">
                {DateTime.fromISO(post.created_at).toLocaleString(DateTime.DATETIME_MED) || ""}
              </p>
            </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="prose dark:prose-invert max-w-none whitespace-pre-line">
            {post.content}
          </div>
        </CardContent>
        {isOwner && (
          <CardFooter className="flex justify-end gap-2">
            <Form method="post">
              <input type="hidden" name="intent" value="deletePost" />
              <Button variant="destructive" type="submit" onClick={(event) => !confirm(t('community.post_detail_page.delete_post_confirm')) && event.preventDefault() } >
                <Trash2 className="mr-2 h-4 w-4" /> {t('community.post_detail_page.delete_post_button')}
              </Button>
            </Form>
          </CardFooter>
        )}
      </Card>

      <h2 className="text-2xl font-semibold mb-4 mt-10">{t('community.post_detail_page.comments_count', { count: comments.length })}</h2>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <fetcher.Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="addComment" />
            <div>
              <Label htmlFor="commentContent" className="sr-only">{t('community.post_detail_page.comments_title')}</Label>
              <Textarea 
                id="commentContent" 
                name="commentContent" 
                rows={3} 
                placeholder={t('community.post_detail_page.comment_form_placeholder')} 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                required
                disabled={fetcher.state !== 'idle'}
              />
            </div>
            {fetcher.data && !fetcher.data.ok && fetcher.data.errorKey && (
              <p className="text-sm text-red-500">{t(fetcher.data.errorKey)}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={fetcher.state !== 'idle'}>{t('community.post_detail_page.comment_form_submit')}</Button>
            </div>
          </fetcher.Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {comments.length > 0 ? comments.map(comment => (
          <Card key={comment.id} className="bg-muted/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <Link
                  to={comment.author?.username ? `/users/${comment.author.username}` : '#'}
                  className={cn(
                    "flex items-center gap-2 group",
                    !comment.author?.username && "pointer-events-none"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author?.avatar_url || undefined} alt={comment.author?.full_name || t('community.anonymous')} />
                    <AvatarFallback className="text-xs">{comment.author?.full_name?.charAt(0) || "A"}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm group-hover:underline">{comment.author?.full_name || t('community.anonymous')}</p>
                </Link>
                <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground">
                    {DateTime.fromISO(comment.created_at).toRelative() || ""}
                    </p>
                    {comment.profile_id === profileId && (
                      <fetcher.Form method="post">
                        <input type="hidden" name="intent" value="deleteComment" />
                        <input type="hidden" name="commentId" value={comment.id} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          type="submit"
                          onClick={(event) => !confirm(t('community.post_detail_page.delete_comment_confirm')) && event.preventDefault()}
                          disabled={fetcher.state !== 'idle'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </fetcher.Form>
                    )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-sm whitespace-pre-line">{comment.content}</p>
            </CardContent>
          </Card>
        )) : (
          <p className="text-center text-muted-foreground py-4">{t('community.post_detail_page.no_comments_yet')}</p>
        )}
      </div>
    </div>
  );
} 