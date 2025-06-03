import { useState, useEffect } from "react";
import { Link, Form, useNavigate, useNavigation, redirect } from "react-router";
import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Label } from "~/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/common/components/ui/select"; // Assuming select is available
import { createCommunityPost } from "~/features/community/queries";
import type { CommunityPostInsert } from "~/features/community/queries";
import { makeSSRClient } from "~/supa-client";

// Dummy profile ID for now
// async function getProfileId(_request: Request): Promise<string> {
//   return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a"; 
// }
async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  return user.id;
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Community Post - StartBeyond" },
    { name: "description", content: "Create a new post in the community." },
  ];
};

interface ActionResponse {
  ok: boolean;
  error?: string;
}

export async function action({ request }: ActionFunctionArgs): Promise<Response | ActionResponse> {
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;

  if (!title || title.trim() === "") {
    return { ok: false, error: "Title is required." };
  }
  if (!content || content.trim() === "") {
    return { ok: false, error: "Content is required." };
  }
  if (!category) {
    return { ok: false, error: "Category is required." };
  }

  try {
    const postData: CommunityPostInsert = {
      profile_id: profileId,
      title,
      content,
      category,
    };
    const newPost = await createCommunityPost(client, postData);
    if (newPost && newPost.id) {
      return redirect(`/community/${newPost.id}`);
    }
    return { ok: false, error: "Failed to create post." };
  } catch (error: any) {
    console.error("Error creating post:", error);
    return { ok: false, error: error.message || "An unexpected error occurred." };
  }
}

const POST_CATEGORIES = [
  { value: "goal-sharing", label: "Goal Sharing" },
  { value: "tips", label: "Tips & Know-how" },
  { value: "free-talk", label: "Free Talk" },
  { value: "qna", label: "Q&A" },
];

export default function NewCommunityPostPage() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  // const actionData = useActionData<ActionData>(); // Kept for potential future use

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = navigation.state === "submitting";

  // Handle successful submission and navigation from action data if Form onChange is removed
  // This requires actionData to be correctly passed from the action or using fetcher.data
  // For now, action redirects, so this useEffect might not be strictly needed for navigation
  // but can be used for setting errors from actionData.

  // The onChange logic on Form is not standard for Remix v2 and won't receive actionData directly.
  // Action data should be consumed using useActionData() hook.
  // For navigation after successful post, the action function should return a redirect.
  // Let's adjust the action function to return a redirect.

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 pt-16">
      <div className="mb-8">
        <Button variant="outline" asChild>
          <Link to="/community">← Back to Community</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6" onSubmit={() => setError(null)}>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                name="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select name="category" value={category} onValueChange={setCategory} required disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {POST_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content" 
                name="content" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                required 
                className="mt-1 min-h-[200px]"
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Post"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 