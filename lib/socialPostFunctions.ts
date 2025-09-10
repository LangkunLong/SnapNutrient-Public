/* eslint-disable @typescript-eslint/no-explicit-any */
// Backend solutions for handling social post interactions, such as 
// saving a post, likeing a post, commenting, deleting
import { client } from './aws_client';
import { PutItemCommand, UpdateItemCommand, QueryCommand, DeleteItemCommand, ReturnValue, GetItemCommand } from '@aws-sdk/client-dynamodb';

export interface SocialMediaPost {
  id: string;
  photo_id: string;
  caption: string;
  comments: { user: string; text: string }[];
  likes: number;
  liked_by?: string[];
  posted_time: string;
}

const SOCIAL_MEDIA_TABLE = "SnapNutrient_posts";

export async function addPost(post: SocialMediaPost) {
  const now = new Date().toISOString();

  if (!post.id || !post.photo_id || !post.caption) {
    throw new Error("Missing required fields");
  }

  const params = {
    TableName: SOCIAL_MEDIA_TABLE,
    Item: {
      id: { S: post.id },
      photo_id: { S: post.photo_id},
      caption: { S: post.caption },
      likes: { N: post.likes.toString() },
      ...(post.liked_by?.length ? { liked_by: { SS: post.liked_by } } : {}),
      comments: { L: post.comments.map(comment => ({
        M: { user: { S: comment.user }, text: { S: comment.text } }
      })) },
      posted_time: { S: post.posted_time || now },
      feed_type: { S: "GLOBAL" }
    },
  };

  try {
    console.log("Saving post:", params);
    const command = new PutItemCommand(params);
    const result = await client.send(command);
    console.log("Post saved successfully:", result);
    return result;
  } catch (error) {
    console.error("Error saving post:", error);
    throw error;
  }
}

// SCAN:
// gets the latest 10 posts at a time 
// implemented Global secondary index in dynamoDB
// Get latest posts from all users, sorted by date
export async function getLatestPosts(limit: number = 10, lastEvaluatedKeyJson: string | null = null) {
  const params: any = {
    TableName: SOCIAL_MEDIA_TABLE,
    IndexName: "feed_type-posted_time-index", // Your new GSI
    KeyConditionExpression: "feed_type = :feedType",
    ExpressionAttributeValues: {
      ":feedType": { S: "GLOBAL" }
    },
    ScanIndexForward: false, // This will work with QueryCommand - newest first
    Limit: limit
  };

  // Add ExclusiveStartKey if provided
  if (lastEvaluatedKeyJson) {
    try {
      const lastEvaluatedKey = JSON.parse(lastEvaluatedKeyJson);
      params.ExclusiveStartKey = lastEvaluatedKey;
    } catch (error) {
      console.error("Error parsing lastEvaluatedKey:", error);
    }
  }

  try {
    console.log("Querying DynamoDB with params:", JSON.stringify(params, null, 2));
    
    const command = new QueryCommand(params);
    const result = await client.send(command);
    
    console.log("DynamoDB Query Result - Items count:", result.Items?.length || 0);
    
    // Get the last evaluated key for pagination
    const lastEvaluatedKey = result.LastEvaluatedKey 
      ? JSON.stringify(result.LastEvaluatedKey) 
      : null;
    
    // Convert items to application format
    const items = result.Items
      ? result.Items.map(convertDynamoDBToPost)
      : [];
    
    return {
      items,
      lastEvaluatedKey
    };
  } catch (error) {
    console.error("DynamoDB Error:", error);
    throw error;
  }
}

// later optimize
// query: optimize later to add a global feed field for all posts "globalFeed": { "S": "ALL" }
// export async function getLatestPosts(limit: number = 10) {
//   const params = {
//     TableName: "SnapNutrient_posts",
//     IndexName: "GlobalFeedIndex",
//     KeyConditionExpression: "globalFeed = :global AND posted_time BETWEEN :start AND :end",
//     ExpressionAttributeValues: {
//       ":global": { S: "ALL" },
//       ":start": { S: "2025-01-01T00:00:00Z" },  // or another start time
//       ":end": { S: new Date().toISOString() }
//     },
//     ScanIndexForward: false, // This sorts by posted_time descending (latest first)
//     Limit: 10,
//   };
  

//   try {
//     console.log("Querying DynamoDB with params:", JSON.stringify(params, null, 2));

//     const command = new QueryCommand(params);
//     const result = await client.send(command);

//     console.log("DynamoDB Query Result:", JSON.stringify(result, null, 2));
//     if (!result.Items || result.Items.length === 0) {
//       console.warn("⚠️ No items found in DynamoDB. Check if your GSI and PK are correct.");
//     }
//     return result.Items ? result.Items.map(convertDynamoDBToPost) : [];
//   } catch (error) {
//     console.error("DynamoDB Error:", error);
//     throw error;
//   }
// }

// Get All posts: retrieve all posts from the table, could be used for social media home page
export async function getAllPosts() {
    const params = {
      TableName: SOCIAL_MEDIA_TABLE,
    };
  
    try {
      const command = new QueryCommand(params);
      const result = await client.send(command);
      return result.Items ? result.Items.map(convertDynamoDBToPost) : [];
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
}

// Get a single post by post_id and photo_id
export async function getPostById(postId: string, photoId: string) {
    const params = {
      TableName: SOCIAL_MEDIA_TABLE,
      Key: {
        id: { S: postId },
        photo_id: { S: photoId }
      },
    };

    try {
      console.log("Fetching post by id and photo_id:", postId, photoId);
      const command = new GetItemCommand(params);
      const result = await client.send(command);

      if (!result.Item) {
        console.log("Post not found.");
        return null;
      }

      return convertDynamoDBToPost(result.Item);
    } catch (error) {
      console.error("Error fetching post by id and photo_id:", error);
      throw error;
    }
}

//get all posts from a specifc User, sort using creation time: perhaps in user profile dashboard
// slow to use the scan() function, faster to use Global Secondary Index
// ********************** TO-DO: Implement GSI in DynamoDB with user_id and creation_time
export async function getPostsByUser(userId: string) {
    const params = {
      TableName: SOCIAL_MEDIA_TABLE,
      IndexName: "posted-time-index", // Replace with your actual GSI name
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": { S: userId },
      },
      ScanIndexForward: false, // To get the latest posts first
    };
  
    try {
      console.log("Fetching posts by user id:", userId);
      const command = new QueryCommand(params);
      const result = await client.send(command);
  
      if (!result.Items || result.Items.length === 0) {
        console.log("No posts found for user:", userId);
        return [];
      }
  
      return result.Items.map(convertDynamoDBToPost);
    } catch (error) {
      console.error("Error fetching posts by user id:", error);
      throw error;
    }
  }

  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDynamoDBToPost(item: any): SocialMediaPost {
    return {
    id: item.id.S,
    photo_id: item.photo_id.S,
    caption: item.caption.S,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments: item.comments.L.map((comment: any) => ({
        user: comment.M.user.S,
        text: comment.M.text.S,
    })),
    likes: item.likes && item.likes.N ? parseInt(item.likes.N, 10) || 0 : 0,
    liked_by: item.liked_by?.SS ?? [],
    posted_time: item.posted_time.S
    };
}

export async function likePost(postId: string, photoId: string, userId: string) {
  if (!postId || !photoId || !userId) {
    console.error("Missing required parameters for likePost:", { postId, photoId, userId });
    throw new Error("Post ID, Photo ID and User ID are required");
  }

  try {
    console.log(`Toggling like for post: ${postId} with photo: ${photoId} by user: ${userId}`);

    const post = await getPostById(postId, photoId);
    const hasLiked = post?.liked_by?.includes(userId);

    const params: any = {
      TableName: SOCIAL_MEDIA_TABLE,
      Key: {
        id: { S: postId },
        photo_id: { S: photoId }
      },
      ReturnValues: 'ALL_NEW' as const,
    };

    if (hasLiked) {
      params.UpdateExpression = 'SET likes = if_not_exists(likes, :zero) - :one DELETE liked_by :user';
      params.ExpressionAttributeValues = {
        ':one': { N: '1' },
        ':zero': { N: '0' },
        ':user': { SS: [userId] }
      };
    } else {
      params.UpdateExpression = 'SET likes = if_not_exists(likes, :zero) + :one ADD liked_by :user';
      params.ExpressionAttributeValues = {
        ':one': { N: '1' },
        ':zero': { N: '0' },
        ':user': { SS: [userId] }
      };
    }

    console.log("Like parameters:", JSON.stringify(params, null, 2));
    const command = new UpdateItemCommand(params);
    const result = await client.send(command);
    console.log("DynamoDB result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Error in likePost:", error);
    throw error;
  }
}

  // adding a comment: 
// Update the addComment function in lib/socialPostFunctions.ts

// Update the addComment function in lib/socialPostFunctions.ts

export async function addComment(postId: string, photo_id: string, user: string, text: string) {
  const newComment = {
    M: {
      user: { S: user },
      text: { S: text },
    },
  };

  console.log("Adding comment to post ID:", postId, "photo_id:", photo_id);

  // Create update parameters - include both partition and sort keys
  const params = {
    TableName: SOCIAL_MEDIA_TABLE,
    Key: {
      id: { S: postId },
      photo_id: { S: photo_id }
    },
    UpdateExpression:
    'SET comments = list_append(if_not_exists(comments, :emptyList), :newComment)',
    ExpressionAttributeValues: {
      ':emptyList': { L: [] },
      ':newComment': { L: [newComment] },
    },
    ReturnValues: 'ALL_NEW' as const,
  };

  console.log("Updating with params:", JSON.stringify(params, null, 2));

  try {
    const command = new UpdateItemCommand(params);
    const result = await client.send(command);

    console.log("Update result:", result);

    if (result && result.Attributes) {
      console.log("Updated attributes:", result.Attributes);
      return result;
    } else {
      console.error("No attributes returned from update operation");
      throw new Error("Failed to update comments");
    }
  } catch (error) {
    console.error("Error adding comment:", error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    throw error;
  }
}
  
// Delete a post by ID:
// await deletePost("post123");
export async function deletePost(postId: string, photoId: string) {
    const params = {
      TableName: SOCIAL_MEDIA_TABLE,
      Key: {
        id: { S: postId },
        photo_id: { S: photoId }
      },
    };

    try {
      console.log("Deleting post:", postId, photoId);
      const command = new DeleteItemCommand(params);
      const result = await client.send(command);
      console.log("Post deleted successfully:", result);
      return result;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

// edit a post: edit a post modifying with either a new picture or a new caption 
// Usage: 
// Update both content and picture
// await editPost("post123", { 
//     content: "Another update!", 
//     picture: "path/to/another-updated-image.jpg" 
//   });
export async function editPost(postId: string, photoId: string, updates: { caption?: string }) {
    if (!updates.caption) {
      throw new Error("No updates provided.");
    }

    const updateExpressions = [];
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.caption) {
      updateExpressions.push("caption = :caption");
      expressionAttributeValues[":caption"] = { S: updates.caption };
    }

    const params = {
      TableName: SOCIAL_MEDIA_TABLE,
      Key: {
        id: { S: postId },
        photo_id: { S: photoId }
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "UPDATED_NEW" as ReturnValue,
    };

    try {
      console.log("Editing post:", postId, photoId);
      const result = await client.send(new UpdateItemCommand(params));
      console.log("Post edited successfully:", result);
      return result;
    } catch (error) {
      console.error("Error editing post:", error);
      throw error;
    }
  }

// perhaps have to add unlike post, uncomment... can be a design choice, talk with team


