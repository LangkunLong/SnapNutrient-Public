import { NextResponse } from "next/server";
import { getLatestPosts } from "@/lib/socialPostFunctions";

interface Post {
  id: string;
  photo_id?: string;
  caption?: string;
  likes?: unknown;
  liked_by?: string[];
  comments?: { user: string; text: string }[];
  posted_time?: string;
}

interface PostWithData extends Post {
  picture: string;
  profile_pic: string;
  user: string;
  likes: number;
}

const DEFAULT_PROFILE_PIC = "/images/deault profile pic.jpg";
const DEFAULT_SOCIAL_PIC = "/images/hero-meal.jpg";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const limitParam = url.searchParams.get("limit");
  const lastKey = url.searchParams.get("lastKey");
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  try {
    const result = await getLatestPosts(limit, lastKey || undefined);
    const posts: Post[] = result.items || [];

    const photoIds = posts
      .map((p) => p.photo_id)
      .filter((id): id is string => !!id);
    const userIds = Array.from(new Set(posts.map((p) => p.id).filter(Boolean)));

    const imageUrlsPromise = fetch(`${origin}/api/get-batch-image-urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: photoIds }),
    }).then((res) => res.json());

    const userProfilePromises = userIds.map((id) =>
      fetch(`${origin}/api/social_media/get-by-id?userId=${encodeURIComponent(id)}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
    );

    const [imageUrlsResult, userResults] = await Promise.allSettled([
      imageUrlsPromise,
      Promise.allSettled(userProfilePromises),
    ]);

    const imageUrlMap: Record<string, string> = {};
    if (
      imageUrlsResult.status === "fulfilled" &&
      imageUrlsResult.value?.urls &&
      Array.isArray(imageUrlsResult.value.urls)
    ) {
      imageUrlsResult.value.urls.forEach((item: { key: string; url: string }) => {
        if (item.key && item.url) {
          imageUrlMap[item.key] = item.url;
        }
      });
    }

    const userDataMap: Record<string, { name: string; profileImageUrl?: string }> = {};
    if (userResults.status === "fulfilled") {
      userResults.value.forEach((res, idx) => {
        const userId = userIds[idx];
        if (res.status === "fulfilled" && Array.isArray(res.value) && res.value[0]) {
          const data = res.value[0];
          userDataMap[userId] = {
            name: data.name?.S || "User",
            profileImageUrl: data.profileImageUrl?.S,
          };
        }
      });
    }

    const hydrated: PostWithData[] = posts.map((post) => {
      let likesCount = 0;
      const likes = post.likes as unknown;
      if (typeof likes === "number") likesCount = likes;
      else if (typeof likes === "string") likesCount = parseInt(likes, 10) || 0;
      else if (likes && typeof likes === "object" && "N" in (likes as Record<string, string>)) {
        likesCount = parseInt((likes as { N: string }).N, 10) || 0;
      }

      const userInfo = userDataMap[post.id] || { name: "User" };

      return {
        ...post,
        caption: post.caption || "",
        picture: post.photo_id && imageUrlMap[post.photo_id]
          ? imageUrlMap[post.photo_id]
          : DEFAULT_SOCIAL_PIC,
        profile_pic: userInfo.profileImageUrl || DEFAULT_PROFILE_PIC,
        user: userInfo.name,
        likes: likesCount,
        liked_by: post.liked_by || [],
        comments: post.comments || [],
        posted_time: post.posted_time || "",
      };
    });

    return NextResponse.json({
      data: hydrated,
      lastEvaluatedKey: result.lastEvaluatedKey || null,
    });
  } catch (error) {
    console.error("Error in hydrated GET:", error);
    return NextResponse.json({ data: [], lastEvaluatedKey: null }, { status: 500 });
  }
}