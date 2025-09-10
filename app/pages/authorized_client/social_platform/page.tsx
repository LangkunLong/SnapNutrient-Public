"use client"

/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Card, CardHeader, CardImage, CardActions, CardCaption, CardDate} from '@/components/ui/instagram_card'; 
import SocialHeader from "@/components/ui/social_header"
import Footer from "@/components/ui/social_footer";
import { Camera } from 'lucide-react';
import { useState, useRef, useEffect} from "react";
import {useSession} from "next-auth/react"
import InstagramUploadModal from '@/components/ui/social_upload_modal';
import { dietAPI_helper } from "@/app/lib/dietAPIHelper/helperFunctions";

// display post on front end ui
interface Post {
  id: string; // user email
  user: string; // from user profile - currently not displayed
  profile_pic: string; //from user profile - currently using default
  caption: string;
  photo_id: string;
  picture: string; // s3 url
  likes: number;
  liked_by: string[];
  comments: { user: string; text: string }[];
  posted_time: string
  // future optimization: include the posted date on the posts
}


interface UserData {
  id: string; // email
  name: string;
  profileImage?: string;
  profileImageUrl?: string;
}

const default_profile_pic = '/images/deault profile pic.jpg';
const default_social_pic =  '/images/hero-meal.jpg';

// Mock social post data
    // can add date 
    // const mock_posts = [
    //     {
    //     id: 1,
    //     user: 'David Wang',
    //     profile_pic: '',
    //     content: 'Just tracked my lunch! Down 5 pounds this week! 💪',
    //     picture: '/images/david cooking.jpg',
    //     likes: 24,
    //     comments: [
    //       { user: 'Larry Long', text: 'Good Job David!'}, 
    //       { user: 'Shuli Ji', text: 'Amazing!'}, 
    //       { user: 'Yuye Huang', text: 'Wwwow!'}
    //     ],
    //     share: 2
    //     },
    //     {
    //     id: 2,
    //     user: 'Larry Long',
    //     profile_pic: '',
    //     content: 'Check out my healthy meal prep for the week! #SnapNutrient',
    //     picture: '/images/larry cooking.jpg',
    //     likes: 18,
    //     comments: [
    //       { user: 'David Wang', text: 'Looks good'}, 
    //       { user: 'Shuli Ji', text: 'Delicious'}, 
    //       { user: 'Yuye Huang', text: 'Yummy!'}
    //     ],
    //     share: 3
    //     }
    // ];

export default function SocialPlatform_tab() {

    const [posts, setPosts] = useState<Post[]>([]);
    const [activePost, setActivePost] = useState<Post | null>(null); //track the active post for viewing comments
    const commentPopupRef = useRef<HTMLDivElement | null>(null); //reference modal container
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const {data: session} = useSession();
    const [userDataMap, setUserDataMap] = useState<Record<string, UserData>>({});
    const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});

    const [hasMore, setHasMore] = useState(true);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement | null>(null);

    //Intersection Observer to detect when user scrolls to the bottom
    useEffect(() => {
      // Initial fetch of posts
      fetchPosts();
    }, []);

    // Set up the Intersection Observer for infinite scrolling
    useEffect(() => {
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
            fetchPosts(10, true);
          }
        },
        { threshold: 1.0 } // Trigger when 100% of the target is visible
      );
    
      const currentObserverTarget = observerTarget.current;
      
      if (currentObserverTarget) {
        observer.observe(currentObserverTarget);
      }
    
      return () => {
        if (currentObserverTarget) {
          observer.unobserve(currentObserverTarget);
        }
      };
    }, [hasMore, isLoadingMore, loading, lastEvaluatedKey]);

    // handle uploading a new post
    const renderUploadModal = () => {

      // upload social post and create record
      // in both s3 and dynamo db ** ! IMPORTANT ! ***
      // Update handlePostSubmit to use current user's data
      const handlePostSubmit = async (image: string, caption: string) => {
        if (!session?.user?.email) {
          alert("You must be logged in to post.");
          return;
        }
        try {
          // Fetch current user data
          const userData = await fetchUserData(session.user.email);
          
          // Convert base64 image to file
          const file = dietAPI_helper.base64ToFile(
            image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
            `post_${Date.now()}.jpg`
          );
          
          const fileExt = file.type.split('/')[1]; // Extracts 'jpeg' from 'image/jpeg'
      
          // Get presigned URL
          const presignedUrlResponse = await fetch('/api/s3_generateURL', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileType: fileExt,
              folder: 'social-posts'
            }),
          });
      
          if (!presignedUrlResponse.ok) {
            throw new Error('Failed to get presigned URL');
          }
          
          // Obtain s3 key 
          const { url, key } = await presignedUrlResponse.json();
          console.log("S3 key:", key);
          
          // Upload to s3
          const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
            mode: 'cors'
          });
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file to S3');
          }
          
          // Create social record with S3 key in dynamoDB
          const response = await fetch('api/social_media', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userID: session.user.email,
              photoID: key,
              caption: caption,
              comments: [],
              likes: "0",
            }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }
          
          // Get the new post data
          const newPost = await response.json();
          
          // Get the presigned URL for the newly uploaded image
          const imageUrlResponse = await fetch('/api/get-batch-image-urls', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keys: [key]
            }),
          });
          
          if (!imageUrlResponse.ok) {
            throw new Error('Failed to get image URL');
          }
          
          const imageUrlData = await imageUrlResponse.json();
          const imageUrl = imageUrlData.urls[0]?.url || default_social_pic;
      
          // Get user profile info
          let profilePicUrl = default_profile_pic;
          let userName = session.user.name || 'User';
          
          if (userData) {
            userName = userData.name || userName;
            if (userData.profileImageUrl) {
              profilePicUrl = userData.profileImageUrl;
            } else if (userData.profileImage) {
              // Try to get profile image URL
              try {
                const profileResponse = await fetch('/api/get-batch-image-urls', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    keys: [userData.profileImage]
                  }),
                });
                
                if (profileResponse.ok) {
                  const profileData = await profileResponse.json();
                  if (profileData.urls && profileData.urls.length > 0) {
                    profilePicUrl = profileData.urls[0].url;
                  }
                }
              } catch (error) {
                console.error('Error fetching profile image:', error);
              }
            }
          }
      
          // Add the new post with the resolved image URL and user data
          const completeNewPost = {
            ...newPost.data,
            picture: imageUrl,
            profile_pic: profilePicUrl,
            user: userName,
            posted_time: newPost.data.posted_time && newPost.data.posted_time.S
            ? newPost.data.posted_time.S
            : new Date().toISOString(),
            caption: caption,
            // Ensure these fields are properly initialized for the new post
            comments: [],
            likes: 0,
            id: session.user.email,
            photo_id: key
          };
          
          // update the React component status
          setPosts([completeNewPost, ...posts]);
          
          // Close the upload modal
          setShowUploadModal(false);
          
          // Refresh the posts to ensure everything is up to date
          // This will refetch all posts and ensure likes and comments work
          fetchPosts();
          
        } catch (error: any) {
          console.error("Error posting:", error);
          alert(error.message || "Failed to create post. Please try again.");
        }
      };
    
      return showUploadModal ? (
        <InstagramUploadModal
          onClose={() => setShowUploadModal(false)}
          onPost={handlePostSubmit}
        />
      ) : null;
    };

    // Function to fetch user data for a single user
    // use async b/c we are waiting for fetching the user data
    // return Promise that will resolve to either UserData (interface) or null 
    const fetchUserData = async (userId: string): Promise<UserData | null> => {
      try {
        const response = await fetch(`/api/social_media/get-by-id?userId=${userId}`);
        if (!response.ok) {
          console.error(`Failed to fetch user data for ${userId}`);
          return null;
        }
        
        const userData = await response.json();
        if (!userData || !userData[0]) {
          return null;
        }
        
        return {
          id: userData[0].id?.S || userId,
          name: userData[0].name?.S || 'User',
          profileImage: userData[0].profileImage?.S,
          profileImageUrl: userData[0].profileImageUrl?.S
        };
      } catch (error) {
        console.error(`Error fetching user data for ${userId}:`, error);
        return null;
      }
    };

    // calls GET in route.ts, gets the latest 10 posts
    // gets the image keys from dynamoDB, then gets the images from s3 bucket
    // obtaining all the imagekeys in batch and send 1 request
    // Improved fetchPosts function to better handle image URLs
    // Modify fetchPosts function to include user data
    const fetchPosts = async (limit: number = 10, loadMore: boolean = false) => {
      if (loadMore) {
        if (isLoadingMore || !hasMore) return; // Prevent multiple simultaneous requests
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
    
      try {
        // Add lastEvaluatedKey to the request if we're loading more posts
        let url = `/api/social_media?limit=${limit}`;
        if (loadMore && lastEvaluatedKey) {
          url += `&lastKey=${encodeURIComponent(lastEvaluatedKey)}`;
        }
    
        // First get the posts data from DynamoDB
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const postsData = await response.json();
        console.log("Posts data from DynamoDB:", postsData);
        
        // Update the lastEvaluatedKey for next pagination request
        setLastEvaluatedKey(postsData.lastEvaluatedKey || null);
        
        // If no more posts or no lastEvaluatedKey, we've reached the end
        setHasMore(!!postsData.lastEvaluatedKey && postsData.data && postsData.data.length === limit);
    
        if (!postsData.data || !Array.isArray(postsData.data) || postsData.data.length === 0) {
          if (!loadMore) {
            setPosts([]);
          }
          setLoading(false);
          setIsLoadingMore(false);
          return;
        }
    
        // Batch all image keys into a single request
        const imageKeys: string[] = postsData.data
          .map((post: Post) => post.photo_id)
          .filter((key: string | undefined): key is string => !!key);
        console.log("Image Keys Sent to API:", imageKeys);
        
        // Get all presigned URLs in a single request
        const imageUrlMap: Record<string, string> = {};
        
        if (imageKeys.length > 0) {
          try {
            const presignedUrlResponse = await fetch('/api/get-batch-image-urls', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                keys: imageKeys
              }),
            });
            
            if (presignedUrlResponse.ok) {
              const responseData = await presignedUrlResponse.json();
              
              if (responseData.urls && Array.isArray(responseData.urls)) {
                responseData.urls.forEach((urlItem: { key: string; url: string }) => {
                  if (urlItem && urlItem.key && urlItem.url) {
                  imageUrlMap[urlItem.key] = urlItem.url;
                  }
                });
              }
            }
          } catch (error) {
            console.error('Error fetching image URLs:', error);
          }
        }
        
        // Collect all unique user IDs from posts
        const userIds: string[] = [...new Set((postsData.data as Post[]).map((post) => post.id))];
        
        // Fetch user data for all posts
        const userDataPromises = userIds
          .filter((userId): userId is string => typeof userId === 'string')
          .map(userId => fetchUserData(userId));
        const userDataResults = await Promise.all(userDataPromises);
        
        // Create a map of user IDs to user data
        const newUserDataMap: Record<string, UserData> = {};
        userDataResults.forEach(userData => {
          if (userData) {
            newUserDataMap[userData.id] = userData;
          }
        });
        
        // Update our userDataMap with new user data
        setUserDataMap(prevMap => ({...prevMap, ...newUserDataMap}));
        
        // Map posts with user data and image URLs
        interface PostWithData extends Post {
          user: string;
          profile_pic: string;
          picture: string;
          likes: number;
        }

        const postsWithData: PostWithData[] = await Promise.all(postsData.data.map(async (post: Post): Promise<PostWithData> => {
          // Get user data from map or use defaults
          const userData: UserData = newUserDataMap[post.id] || { id: post.id, name: 'User' };
          
          // Get profile image URL
          let profilePicUrl: string = default_profile_pic;
          if (userData.profileImageUrl) {
            profilePicUrl = userData.profileImageUrl;
          } else if (userData.profileImage) {
            try {
              // Fetch profile image URL if not already in user data
              const profileResponse = await fetch('/api/get-batch-image-urls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keys: [userData.profileImage]
          }),
              });
              
              if (profileResponse.ok) {
          const profileData: { urls: { url: string }[] } = await profileResponse.json();
          if (profileData.urls && profileData.urls.length > 0) {
            profilePicUrl = profileData.urls[0].url;
          }
              }
            } catch (error) {
              console.error('Error fetching profile image:', error);
            }
          }
          
          // Ensure likes is always a number
          let likesCount: number = 0;
          if (post.likes !== undefined) {
            if (typeof post.likes === 'number') {
              likesCount = post.likes;
            } else if (typeof post.likes === 'string') {
              likesCount = parseInt(post.likes, 10) || 0;
            } else if (post.likes && typeof post.likes === 'object' && 'N' in post.likes) {
              likesCount = typeof post.likes === 'object' && post.likes !== null && 'N' in post.likes ? parseInt((post.likes as { N: string }).N, 10) || 0 : 0;
            }
          }
          
          return {
            ...post,
            user: userData.name || 'User',
            profile_pic: profilePicUrl,
            picture: post.photo_id && imageUrlMap[post.photo_id]
              ? imageUrlMap[post.photo_id]
              : default_social_pic,
            likes: likesCount,
            liked_by: post.liked_by || []
          };
        }));
    
        // The key change: if loading more, append to existing posts instead of replacing
        if (loadMore) {
          setPosts(currentPosts => [...currentPosts, ...postsWithData]);
        } else {
          setPosts(postsWithData);
        }
      } catch (error: any) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    };

    // Add a function to get user display name
    const getUserDisplayName = (userId: string): string => {
      // Check if we have this user's data
      if (userDataMap[userId]) {
        return userDataMap[userId].name || userId;
      }
      // If not in the map, return the ID as fallback
      return userId;
    };
    

    const isPostLiked = (post: Post): boolean => {
      if (!session?.user?.email) return false;
      const userEmail = session.user.email!;
      return post.liked_by?.includes(userEmail);
    };


    //handler for liking a post
    // Update the handleLike function in SocialPlatform_tab.tsx
    const handleLike = async (post: Post) => {
      if (!session?.user?.email) {
        alert("You must be logged in to like posts.");
        return;
      }
      const userEmail = session.user.email!;

      const hasLiked = isPostLiked(post);
      const postKey = `${post.id}-${post.photo_id}`;
      if (likeLoading[postKey]) return;
      setLikeLoading(prev => ({ ...prev, [postKey]: true }));

      try {
        console.log("Toggling like for post:", post.id, "photo:", post.photo_id);

        // Optimistically update UI
        setPosts(currentPosts =>
          currentPosts.map(p =>
            (p.id === post.id && p.photo_id === post.photo_id) ? {
              ...p,
              likes: hasLiked ? p.likes - 1 : p.likes + 1,
              liked_by: hasLiked
              ? p.liked_by.filter(u => u !== userEmail)
                : [...p.liked_by, userEmail]
            } : p
          )
        );

        if (activePost && activePost.id === post.id && activePost.photo_id === post.photo_id) {
          setActivePost({
            ...activePost,
            likes: hasLiked ? activePost.likes - 1 : activePost.likes + 1,
            liked_by: hasLiked
              ? activePost.liked_by.filter(u => u !== userEmail)
              : [...activePost.liked_by, userEmail]
          });
        }

        // Make the API call to update the like in the database
        const response = await fetch('/api/social_media/like', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: post.id,
            photo_id: post.photo_id,
          }),
        });

        if (!response.ok) {
          // If the API call fails, revert the optimistic update
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Like response:", result);

        if (result.data && result.data.Attributes) {
          const attrs = result.data.Attributes;
          const serverLikeCount = attrs.likes && attrs.likes.N ? parseInt(attrs.likes.N, 10) : 0;
          const serverLikedBy = attrs.liked_by && attrs.liked_by.SS ? attrs.liked_by.SS : [];

          setPosts(currentPosts =>
            currentPosts.map(p =>
              (p.id === post.id && p.photo_id === post.photo_id) ? {
                ...p,
                likes: serverLikeCount,
                liked_by: serverLikedBy
              } : p
            )
          );

          if (activePost && activePost.id === post.id && activePost.photo_id === post.photo_id) {
            setActivePost({
              ...activePost,
              likes: serverLikeCount,
              liked_by: serverLikedBy
            });
          }
        }
      } catch (error: any) {
        console.error("Error liking post:", error);

        // Revert the optimistic update if there was an error
        setPosts(currentPosts =>
          currentPosts.map(p =>
            (p.id === post.id && p.photo_id === post.photo_id) ? {
              ...p,
              likes: hasLiked ? p.likes + 1 : p.likes - 1,
              liked_by: hasLiked
                ? [...p.liked_by, userEmail]
                : p.liked_by.filter(u => u !== userEmail)
            } : p
          )
        );

        if (activePost && activePost.id === post.id && activePost.photo_id === post.photo_id) {
          setActivePost({
            ...activePost,
            likes: hasLiked ? activePost.likes + 1 : activePost.likes - 1,
            liked_by: hasLiked
              ? [...activePost.liked_by, session.user!.email]
              : activePost.liked_by.filter(u => u !== session.user!.email)
          });
        }

        // Show error to user
        alert("Failed to like post. Please try again.");
        } finally {
        setLikeLoading(prev => ({ ...prev, [postKey]: false }));
      }
    };

    const handleAddComment = async (postId: string, s3_key: string, comment: string) => {
      if (!session?.user?.email) {
        return; // Or a better UI message "You must be logged in to comment."
      }
      
      try {
        console.log("Adding comment to post:", postId);
        
        // Get current user data for the comment
        const userData = await fetchUserData(session.user.email);
        const userName = userData?.name || session.user.email;
        
        // Create a new comment object with the current user's info
        const newComment = {
          user: userName,
          text: comment
        };
        
        // Optimistically update the UI first
        // 1. Update ONLY the specific post in the posts array
        setPosts(currentPosts => {
          return currentPosts.map(post => {
            if (post.id === postId && post.photo_id === s3_key) {
              // Create a new array with the existing comments and the new one
              const updatedComments = [...(post.comments || []), newComment];
              return {
                ...post,
                comments: updatedComments
              };
            }
            return post;
          });
        });
        
        // 2. Update the active post if it's the one being commented on
        if (activePost && activePost.id === postId && activePost.photo_id === s3_key) {
          setActivePost({
            ...activePost,
            comments: [...(activePost.comments || []), newComment]
          });
        }
        
        // Now make the API call
        const response = await fetch('/api/social_media/comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            postId: postId, 
            photo_id: s3_key,
            text: comment
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log("Comment added successfully:", responseData);
        
        // The server should return the comment with the email as user
        // We need to convert this to display names for UI
        if (responseData.data && responseData.data.comments) {
          // Fetch user data for all commenters
          const commentUserIds: string[] = [...new Set((responseData.data.comments as { user: string; text: string }[]).map((c) => c.user))];
          const userDataPromises = commentUserIds
            .filter((userId): userId is string => typeof userId === 'string')
            .map(userId => fetchUserData(userId));
          const commentUserData = await Promise.all(userDataPromises);
          
          // Create user data map
          const userMap: Record<string, string> = {};
          commentUserData.forEach(userData => {
            if (userData) {
              userMap[userData.id] = userData.name || userData.id;
            }
          });
          
          // Transform comments to use display names
          const formattedComments: { user: string; text: string }[] = responseData.data.comments.map((comment: { user: string; text: string }) => ({
            user: userMap[comment.user] || comment.user,
            text: comment.text
          }));
          
          // Update ONLY the specific post with formatted comments
          setPosts(currentPosts => {
            return currentPosts.map(post => {
              if (post.id === postId && post.photo_id === s3_key) {
                return {
                  ...post,
                  comments: formattedComments
                };
              }
              return post;
            });
          });
          
          // Update active post with formatted comments if needed
          if (activePost && activePost.id === postId && activePost.photo_id === s3_key) {
            setActivePost({
              ...activePost,
              comments: formattedComments
            });
          }
        }
      } catch (error: any) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment. Please try again.");
        
        // Revert the optimistic update by refreshing posts
        fetchPosts();
      }
    };

    const handleViewComments = async (post: Post) => {
      // Collect all user IDs from comments that we don't already have data for
      const commentUserIds = post.comments
        .map(comment => comment.user)
        .filter(userId => !userDataMap[userId]);
      
      // If we have missing user data, fetch it
      if (commentUserIds.length > 0) {
        const uniqueUserIds = [...new Set(commentUserIds)];
        console.log("Fetching data for comment users:", uniqueUserIds);
        
        // Create a copy of the current map to update
        const updatedUserDataMap = { ...userDataMap };
        
        // Fetch data for each missing user
        for (const userId of uniqueUserIds) {
          try {
            const userData = await fetchUserData(userId);
            if (userData) {
              updatedUserDataMap[userId] = userData;
            }
          } catch (error) {
            console.error(`Error fetching data for comment user ${userId}:`, error);
          }
        }
        
        // Update the map with any new user data
        setUserDataMap(updatedUserDataMap);
      }
      
      // Set the active post
      setActivePost(post);
    };

    //function to close comment pop-up when clicked outside
    const closeCommentPopup = (e: MouseEvent) => {
      if (commentPopupRef.current && !commentPopupRef.current.contains(e.target as Node)) {
        setActivePost(null); //Close popeu
      }
    }

    //set up event listener when modal is created and removes listener when popup is closed
    //also fetch post from database
    useEffect(() => {
      fetchPosts();
    }, []);

    // 🔹 Handle clicking outside of the comment modal
    useEffect(() => {
      if (activePost) {
        document.addEventListener("mousedown", closeCommentPopup);
      } else {
        document.removeEventListener("mousedown", closeCommentPopup);
      }

      return () => {
        document.removeEventListener("mousedown", closeCommentPopup);
      };
    }, [activePost]);

    console.log(posts)
    return (
      <div className="min-h-screen flex flex-col">
        <SocialHeader /> {/* Header at the top */}
        
        <div className="space-y-4 pb-16 text-black">
          {posts.map((post) => (
            <Card key={`${post.id} + ${post.posted_time}`} className="max-w-md mx-auto">
              {/* Using CardHeader component properly */}
              <CardHeader
                user={post.user}
                profilePic= {post.profile_pic || default_profile_pic} // Make sure to replace with actual user profile picture paths
                className="flex items-center space-x-3 p-4"
              />
      
              {/* Using CardImage component */}
              <CardImage
                src={post.picture}
                alt="Post image"
                className="w-full h-64 object-cover"
              />
      
              {/* Using CardActions component */}
              <CardActions
                likes={typeof post.likes === 'string' ? parseInt(post.likes, 10) : post.likes}
                commentsCount={post.comments ? post.comments.length : 0}
                onLike={() => handleLike(post)}
                onComment={() => handleViewComments(post)}  // Use the new function instead
                isLiked={isPostLiked(post)}
                likeDisabled={!!likeLoading[`${post.id}-${post.photo_id}`]}
              />
      
              {/* Using CardCaption component */}
              <CardCaption
                user={post.user}
                content={post.caption}
              />
              <button
                className="px-4 py-2 text-xs text-gray-500 font-light"
                onClick={() => handleViewComments(post)}  // Use the new function
              >
                {(post.comments?.length || 0) > 0
                  ? (post.comments.length > 3
                      ? `View all ${post.comments.length} comments...`
                      : "View comments")
                  : "Be the first to comment!"}
              </button>

              {/* using timestamp component*/ }
              <CardDate timestamp={post.posted_time} />

            </Card>

          ))}
        
          {/* Loading indicator and observer target */}
          <div className="flex justify-center py-4">
            {isLoadingMore && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>}
          </div>
          
          {/* This invisible div acts as our observer target - when it becomes visible, we load more posts */}
          <div ref={observerTarget} className="h-10"></div>

          {/* Modal for Comments View */}
          {activePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              ref={commentPopupRef}
              className="bg-white rounded-lg shadow-lg w-full max-w-[90%] md:max-w-6xl h-[80vh] flex flex-col md:flex-row overflow-hidden"
            >
              {/* Image Section - Full width on mobile, half width on desktop */}
              <div className="w-full md:w-1/2 h-[50vh] md:h-full flex-shrink-0 border border-gray-300 shadow-sm p-2 md:p-4">
                <img 
                  src={activePost.picture} 
                  alt="Post image" 
                  className="w-full h-full object-contain rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                />
              </div>

              {/* Comments Section - Takes remaining space */}
              <div className="w-full md:w-1/2 p-4 flex flex-col h-[50vh] md:h-full overflow-hidden">
                {/* User Info */}
                <div className="flex items-center mb-2">
                  <img
                    src={activePost.profile_pic || default_profile_pic}
                    alt="Profile picture"
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-2"
                  />
                  <span className="font-semibold text-black text-sm md:text-base">{activePost.user}</span>
                </div>

                {/* Post Caption */}
                <p className="text-xs md:text-sm text-gray-700 mb-2">
                  <span className="font-semibold">{activePost.user}</span> {activePost.caption}
                </p>

                {/* Comments Display - Scrollable area */}
                <div className="flex-grow overflow-y-auto space-y-2 px-1 mb-2">
                  {Array.isArray(activePost.comments) && activePost.comments.length > 0 ? (
                    activePost.comments.map((comment, index) => (
                      <div key={index} className="text-xs md:text-sm text-gray-700 bg-gray-100 p-2 rounded-lg">
                        <span className="font-semibold text-black">
                          {getUserDisplayName(comment.user)}
                        </span>{' '}
                        {comment.text}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-xs md:text-sm font-light">No comments yet. Be the first to comment!</p>
                  )}
                </div>

                {/* Comment Input - Fixed at bottom */}
                <div className="border-t pt-2 flex items-center gap-2 bg-white">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    id="commentInput"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          handleAddComment(activePost.id, activePost.photo_id, input.value);
                          input.value = ''; // Clear input
                        }
                      }
                    }}
                    />
                    <button
                    onClick={() => {
                      const input = document.getElementById('commentInput') as HTMLInputElement;
                      if (input.value.trim()) {
                        handleAddComment(activePost.id, activePost.photo_id, input.value);
                        input.value = ''; // Clear input
                      }
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* display a modal for uploading new posts*/}
        {renderUploadModal()}

        {/* Floating Post Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="fixed bottom-16 right-6 bg-blue-500 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
        >
        <Camera size={20} />
        </button>
        </div>
        <Footer />
      </div>
  );
}