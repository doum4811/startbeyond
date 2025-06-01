import { Link } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { getCommunityPosts, type CommunityPostWithAuthor } from "~/features/community/queries";
import { DateTime } from "luxon";
import { Plus } from "lucide-react";

export interface CommunityPageLoaderData {
  posts: CommunityPostWithAuthor[];
  profileId: string; // Assuming we get this similarly to other pages
}

async function getProfileId(_request: Request): Promise<string> {
  // Replace with actual profile ID fetching logic
  return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a";
}

export const meta: MetaFunction = () => {
  return [
    { title: "Community - StartBeyond" },
    { name: "description", content: "Share your goals and tips with the community." },
  ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<CommunityPageLoaderData> {
  const profileId = await getProfileId(request);
  // TODO: Add pagination later if needed
  const posts = await getCommunityPosts({});
  return { posts, profileId };
}

function PostCard({ post }: { post: CommunityPostWithAuthor }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author_avatar_url || undefined} alt={post.author_name || "User"} />
            <AvatarFallback>{post.author_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.author_name || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground">
              {DateTime.fromISO(post.created_at).toRelative() || ""}
            </p>
          </div>
        </div>
        <CardTitle className="text-xl hover:text-primary">
          <Link to={`/community/${post.id}`}>{post.title}</Link>
        </CardTitle>
        {post.category && <CardDescription className="text-sm">{post.category}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-muted-foreground">{post.content}</p>
      </CardContent>
      <CardFooter>
        <Button variant="link" asChild className="p-0 h-auto">
          <Link to={`/community/${post.id}`}>Read more</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function CommunityPage({ loaderData }: { loaderData: CommunityPageLoaderData }) {
  const { posts } = loaderData;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pt-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-3xl">Community</h1>
        <Button asChild>
          <Link to="/community/new">
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No posts yet.</p>
          <p className="text-muted-foreground">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
} 