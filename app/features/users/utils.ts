import { redirect } from "react-router";
import { makeSSRClient } from "~/supa-client";
import * as userQueries from '~/features/users/queries';

export async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  return user.id;
}

export async function getRequiredProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    throw redirect("/auth/login");
  }
  return user.id;
} 