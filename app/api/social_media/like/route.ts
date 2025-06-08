// Update app/api/social_media/like/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { likePost, getPostById } from "@/lib/socialPostFunctions";

// liking a post (POST /api/social_media/like)
export async function POST(req: Request) {
    try {
        console.log("Like API route called");
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse request body
        const data = await req.json();
        const { postId, photo_id} = data;

        if (!postId) {
            return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
        }

        console.log("Processing like for post:", postId);

        // Call the likePost function to update the like count
        const result = await likePost(postId, photo_id);
        console.log("Like operation result:", result);

        // If successful, return the updated post data
        // This helps the frontend know the exact state after the update
        if (result && result.Attributes) {
            return NextResponse.json({ 
                success: true, 
                data: { 
                    Attributes: result.Attributes 
                }
            });
        }

        // Fallback if Attributes aren't returned - try to get the post
        try {
            const updatedPost = await getPostById(postId);
            return NextResponse.json({ 
                success: true, 
                data: updatedPost
            });
        } catch (getError) {
            console.error("Error fetching updated post:", getError);
            // If we can't get the updated post, at least return success
            return NextResponse.json({ 
                success: true, 
                message: "Like processed but updated data not available"
            });
        }
    } catch (error) {
        console.error('Error in POST /api/social_media/like:', error);
        
        if (error instanceof Error) {
            return NextResponse.json({ 
                error: 'Failed to like post', 
                details: error.message 
            }, { status: 500 });
        }
        
        return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
    }
}