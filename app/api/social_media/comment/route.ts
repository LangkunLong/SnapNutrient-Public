// Updated fix for the comment endpoint in route.ts for social_media/comment
// This should be updated in app/api/social_media/comment/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addComment, getPostById } from "@/lib/socialPostFunctions";

// adding a comment to a post
export async function POST(req: Request) {
    try {
        console.log("Comment API route called");
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { postId, photo_id, text } = await req.json();
        console.log("Received comment data:", {
            postId,
            photo_id,
            text
        });

        if (!postId || !text) {
            return NextResponse.json({ error: "Post ID and text are required" }, { status: 400 });
        }

        const user = session.user.email;
        
        try {
            // Add the comment using just the postId
            const updatedPost = await addComment(postId, photo_id, user, text);
            console.log("Comment added successfully");
            
            // Get the full updated post to return
            try {
                const fullPost = await getPostById(postId);
                if (fullPost) {
                    return NextResponse.json({ 
                        success: true, 
                        data: fullPost
                    });
                }
            } catch (getError) {
                console.error("Error fetching updated post:", getError);
                // Continue with the original result if getPostById fails
            }
            
            // If fetching the full post fails, return what we have
            return NextResponse.json({ 
                success: true, 
                data: {
                    id: postId,
                    comments: updatedPost.Attributes?.comments?.L?.map(comment => ({
                        user: comment.M?.user?.S ?? null,
                        text: comment.M?.text?.S ?? null
                    })) || []
                }
            });
            
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error;
        }
    } catch (error) {
        console.error('Error in POST /api/social-media/comment:', error);
        return NextResponse.json({ 
            error: 'Failed to add comment',
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}