import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addPost, getLatestPosts} from "@/lib/socialPostFunctions"

interface SocialMediaTable{
    id: string; 
    photo_id: string; 
    caption: string; 
    comments: { user: string; text: string }[];
    likes: number;
    posted_time: string;  
}

//validate if social post follows format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateSocialPost(data: any): {isValid: boolean; error?: string} {
    
    if (!data.userID || !data.photoID || !data.caption) {
        return { isValid: false, error: "Missing required fields" };
    }
    return { isValid: true };
}

// for adding a new table
export async function POST(req: Request) {
    try{
        // get user connection
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // check if social post includes all required components
        const post = await req.json();
        const validation = validateSocialPost(post);
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const timestamp = new Date().toISOString();
        const postId = `${session.user.email}`;

        // format the data:
        const formattedSocialPost: SocialMediaTable = {
            id: postId,
            photo_id: post.photoID,
            caption: post.caption,
            comments: post.comments || [],
            likes: post.likes ? parseInt(post.likes, 10) : 0,
            posted_time: timestamp
        };
        
        //save to database
        const savedSocialPost = await addPost({
            ...formattedSocialPost,
        });
        return NextResponse.json({
            success: true,
            data: savedSocialPost
        })
        
    } catch (error) {
        console.error('Error in POST /api/social-media:', error);
    
        // Handle specific errors
        if (error instanceof Error) {
            if (error.message.includes('duplicate')) {
                return NextResponse.json(
                { error: 'This Post has already been saved' },
                { status: 409 }
                );
            }
            if (error.message.includes('validation')) {
                return NextResponse.json(
                { error: error.message },
                { status: 400 }
                );
            }
        }
        // Generic error
        return NextResponse.json(
        { error: 'Failed to save meal' },
        { status: 500 }
        );
    }
}

// // edit existing post
// export async function EDIT(req: Request) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session?.user?.email) {
//             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }

//         const { id, caption, photo_id } = await req.json();

//         if (!id) {
//             return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
//         }

//         const updates: { caption?: string; photo_id?: string } = {};
//         if (caption) updates.caption = caption;
//         if (photo_id) updates.photo_id = photo_id;

//         if (!updates.caption && !updates.photo_id) {
//             return NextResponse.json({ error: "No updates provided" }, { status: 400 });
//         }

//         const updatedPost = await editPost(id, updates);
//         return NextResponse.json({ success: true, data: updatedPost });
//     } catch (error) {
//         console.error('Error in PUT /api/social-media:', error);
//         return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
//     }
// }

// get the latest 10 posts
// calls getLatestPosts in socialPostFunction.ts
// Modify your api/social_media/route.ts file
// Update the GET function to handle the lastKey parameter

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const lastKey = searchParams.get('lastKey'); // Get lastEvaluatedKey from query params
    const limit = limitParam ? parseInt(limitParam, 10) : 10; // Default to 10
    
    try {
      console.log("Fetching latest posts with limit:", limit, "lastKey:", lastKey || "none");
      
      // Call getLatestPosts with both limit and lastKey
      const result = await getLatestPosts(limit, lastKey);
      
      // Return both posts and lastEvaluatedKey for pagination
      return NextResponse.json({
        success: true,
        data: result.items,
        lastEvaluatedKey: result.lastEvaluatedKey
      });
    } catch (error: unknown) {
      console.error("Error in GET:", error);
      return NextResponse.json({
        success: false,
        error: (error instanceof Error ? error.message : "An error occurred"),
      }, {status: 500});
    }
}


// getting all posts by the same userID:


// // for getting a single post by ID
// export async function GET_BY_ID(req: Request) {
//     const { searchParams } = new URL(req.url);
//     const postId = searchParams.get('id');
//     const photoId = searchParams.get('photo_id');

//     if (!postId || !photoId) {
//         return NextResponse.json({ error: 'Post ID and photo_id are required' }, { status: 400 });
//     }

//     try {
//         const post = await getPostById(postId, photoId);
//         if (!post) {
//             return NextResponse.json({ error: 'Post not found' }, { status: 404 });
//         }
//         return NextResponse.json({ success: true, data: post });
//     } catch (error) {
//         console.error('Error in GET_BY_ID /api/social-media:', error);
//         return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
//     }
// }

// // for deleting a post by ID
// export async function DELETE(req: Request) {
//     const { searchParams } = new URL(req.url);
//     const postId = searchParams.get('id');
//     const photoId = searchParams.get('photo_id');

//     if (!postId || !photoId) {
//         return NextResponse.json({ error: 'Post ID and photo_id are required' }, { status: 400 });
//     }

//     try {
//         await deletePost(postId, photoId);
//         return NextResponse.json({ success: true, message: 'Post deleted successfully' });
//     } catch (error) {
//         console.error('Error in DELETE /api/social-media:', error);
//         return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
//     }
// }