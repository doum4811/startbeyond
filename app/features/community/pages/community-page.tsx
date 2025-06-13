import { Link, useSearchParams, redirect, Form } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/common/components/ui/avatar";
import { getCommunityPosts, type CommunityPostWithAuthor, POSTS_PER_PAGE } from "~/features/community/queries";
import { DateTime } from "luxon";
import { Plus, MessageSquare } from "lucide-react";
import { makeSSRClient } from "~/supa-client";
import { useTranslation } from "react-i18next";
import { CommunityPagination } from "../components/community-pagination";
import { POST_CATEGORIES } from "../constants";
import { cn } from "~/lib/utils";
import { Input } from "~/common/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/common/components/ui/select";

export interface CommunityPageLoaderData {
  posts: CommunityPostWithAuthor[];
  totalPages: number;
  category: string | null;
  isLoggedIn: boolean;
  searchQuery: string | null;
}

async function getIsLoggedIn(request: Request): Promise<boolean> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  return user !== null;
}

export const meta: MetaFunction = ({ data }) => {
  // Note: t function is not available in meta function directly
  return [
    { title: "Community - StartBeyond" },
    { name: "description", content: "Share your goals and tips with the community." },
  ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response | CommunityPageLoaderData> {
  const { client } = makeSSRClient(request);
  const isLoggedIn = await getIsLoggedIn(request);
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const categorySlug = url.searchParams.get("category");
  const searchQuery = url.searchParams.get("q");

  if (categorySlug) {
    const categoryInfo = POST_CATEGORIES.find(c => c.value === categorySlug);
    if (categoryInfo?.isPrivate && !isLoggedIn) {
      return redirect("/auth/login");
    }
  }
  
  const { posts, count } = await getCommunityPosts(client, { 
    page, 
    category: categorySlug ?? undefined, 
    searchQuery: searchQuery ?? undefined,
  });
  const totalPages = Math.ceil(count / POSTS_PER_PAGE);
  return { posts, totalPages, category: categorySlug, isLoggedIn, searchQuery };
}

function PostCard({ post }: { post: CommunityPostWithAuthor }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl hover:text-primary mb-2">
          <Link to={`/community/${post.id}`}>{post.title}</Link>
        </CardTitle>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Link to={`/users/${post.author_username}`} className="flex items-center gap-2 group">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.author_avatar_url || undefined} alt={post.author_name || t('community.anonymous')} />
              <AvatarFallback>{post.author_name?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
            <p className="font-medium group-hover:underline">{post.author_name || t('community.anonymous')}</p>
            <p>·</p>
            <p>{DateTime.fromISO(post.created_at).toRelative() || ""}</p>
          </Link>
          {post.category && <div className="hidden sm:block"><span className="font-semibold text-primary">{t(POST_CATEGORIES.find(c => c.value === post.category)?.tKey ?? post.category)}</span></div>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-muted-foreground">{post.content}</p>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground gap-4">
        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>{post.comment_count}</span>
        </div>
        <Button variant="link" asChild className="p-0 h-auto text-sm">
          <Link to={`/community/${post.id}`}>{t('community.read_more')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function CategoryTabs({ currentCategory, isLoggedIn }: { currentCategory: string | null, isLoggedIn: boolean }) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const createCategoryURL = (category: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    params.set("page", "1"); // Reset to page 1 when category changes
    return { search: params.toString() };
  };

  const availableCategories = isLoggedIn ? POST_CATEGORIES : POST_CATEGORIES.filter(c => !c.isPrivate);

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      <Link to={createCategoryURL(null)}>
        <Button variant={!currentCategory ? "default" : "outline"}>{t('community.all_posts')}</Button>
      </Link>
      {availableCategories.map((cat) => (
        <Link key={cat.value} to={createCategoryURL(cat.value)}>
          <Button variant={currentCategory === cat.value ? "default" : "outline"}>
            {t(cat.tKey)}
          </Button>
        </Link>
      ))}
    </div>
  );
}

function SearchForm() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  return (
    <div className="mb-6">
      <Form className="flex-grow">
        <Input 
          type="search" 
          name="q"
          placeholder={t('community.search_placeholder')} 
          defaultValue={searchParams.get('q') || ''}
        />
      </Form>
    </div>
  );
}

export default function CommunityPage({ loaderData }: { loaderData: CommunityPageLoaderData }) {
  const { posts, totalPages, category, isLoggedIn } = loaderData;
  const { t, i18n } = useTranslation();

  if (!i18n.isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="font-bold text-2xl sm:text-3xl">{t('community.title')}</h1>
        {isLoggedIn && (
          <Button asChild size="icon" className="sm:w-auto sm:px-4">
            <Link to="/community/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">{t('community.new_post')}</span>
            </Link>
          </Button>
        )}
      </div>
      
      <CategoryTabs currentCategory={category} isLoggedIn={isLoggedIn} />
      <SearchForm />

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">{t('community.no_posts_in_category')}</p>
          <p className="text-muted-foreground">{t('community.try_another_category')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <div className="mt-8">
            <CommunityPagination totalPages={totalPages} />
          </div>
        </>
      )}
    </div>
  );
} 