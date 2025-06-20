import { useState, useEffect } from "react";
import { Link, Form, useNavigate, useNavigation, redirect, useActionData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Label } from "~/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/common/components/ui/select";
import { createCommunityPost } from "~/features/community/queries";
import type { CommunityPostInsert } from "~/features/community/queries";
import { makeSSRClient } from "~/supa-client";
import { useTranslation } from "react-i18next";
import { POST_CATEGORIES } from "../constants";
import { getRequiredProfileId } from "~/features/users/utils";

export const meta: MetaFunction = () => {
  return [
    { title: "New Community Post - StartBeyond" },
    { name: "description", content: "Create a new post in the community." },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { headers } = makeSSRClient(request);
  await getRequiredProfileId(request);
  // loader는 데이터를 반환하거나, 리디렉션하거나, 헤더와 함께 null을 반환할 수 있습니다.
  // getRequiredProfileId가 오류를 발생시키지 않으면, 페이지 렌더링을 허용합니다.
  return new Response(null, { headers });
}

interface ActionResponse {
  ok: boolean;
  errorKey?: string; // Return a key instead of a hardcoded string
}

export async function action({ request }: ActionFunctionArgs): Promise<Response | ActionResponse> {
  const { client, headers } = makeSSRClient(request);
  const profileId = await getRequiredProfileId(request);
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;

  if (!title || title.trim() === "") {
    return { ok: false, errorKey: "community.new_post_page.error_title_required" };
  }
  if (!content || content.trim() === "") {
    return { ok: false, errorKey: "community.new_post_page.error_content_required" };
  }
  if (!category) {
    return { ok: false, errorKey: "community.new_post_page.error_category_required" };
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
      return redirect(`/community/${newPost.id}`, { headers });
    }
    return { ok: false, errorKey: "community.new_post_page.error_creation_failed" };
  } catch (error: any) {
    console.error("Error creating post:", error);
    return { ok: false, errorKey: error.message || "An unexpected error occurred." };
  }
}

export default function NewCommunityPostPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const actionData = useActionData<ActionResponse>();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (actionData && !actionData.ok && actionData.errorKey) {
      setError(t(actionData.errorKey));
    }
  }, [actionData, t]);

  const isSubmitting = navigation.state === "submitting";

  if (!i18n.isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <Button variant="outline" asChild>
          <Link to="/community">{t('community.new_post_page.back_to_community')}</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('community.new_post_page.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6" onSubmit={() => setError(null)}>
            <div>
              <Label htmlFor="title">{t('community.new_post_page.form_title_label')}</Label>
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
              <Label htmlFor="category">{t('community.new_post_page.form_category_label')}</Label>
              <Select name="category" value={category} onValueChange={setCategory} required disabled={isSubmitting}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={t('community.new_post_page.form_category_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {POST_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{t(cat.tKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">{t('community.new_post_page.form_content_label')}</Label>
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
                {isSubmitting ? t('community.new_post_page.form_submitting_button') : t('community.new_post_page.form_submit_button')}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 