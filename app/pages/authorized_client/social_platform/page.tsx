import SocialPlatformClient, { type Post } from "./SocialPlatformClient";
import {headers} from "next/headers"
export const dynamic = "force-dynamic";


async function getInitialPosts(): Promise<{ posts: Post[]; lastKey: string | null }> {
  try {
    const headerList = await headers();
    const protocol = headerList.get("x-forwarded-proto") || "https";
    const host = headerList.get("host");
    const envUrl = process.env.NEXTAUTH_URL
      ? new URL(process.env.NEXTAUTH_URL).origin
      : null;
    const baseUrl = envUrl || (host ? `${protocol}://${host}` : "http://localhost:3000");
    const res = await fetch(
      `${baseUrl}/api/social_media/hydrated?limit=10`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      throw new Error('Failed to fetch posts');
    }
    const data = await res.json();
    return { posts: data.data ?? [], lastKey: data.lastEvaluatedKey ?? null };
  } catch (error) {
    console.error('Error fetching initial posts:', error);
    return { posts: [], lastKey: null };
  }
}

export default async function SocialPlatformPage() {
  const { posts, lastKey } = await getInitialPosts();
  return <SocialPlatformClient initialPosts={posts} initialLastKey={lastKey} />;
}