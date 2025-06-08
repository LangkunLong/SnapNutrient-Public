import * as React from "react";
import { cn } from "@/lib/utils";

// Format the timestamp into a readable date
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    month: "short", // 3-letter month abbreviation
    day: "numeric", // Display the day
  };
  return date.toLocaleString("en-US", options); // Format the date
};

// Main Card styled like an Instagram post
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative rounded-lg border bg-white shadow-sm", className)} // Instagram-like styling
    {...props}
  />
));
Card.displayName = "Card";

// Header for profile info
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {user: string; profilePic: string}
>(({ className, user, profilePic, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 text-black", className)} // Flex layout for profile pic and username
    {...props}
  >
    {/* Profile Picture */}
    <img
      src= {profilePic}
      alt="Profile"
      className="w-10 h-10 rounded-full mr-3" // Round profile picture
    />
    {/* Username */}
    <span className="font-semibold text-black">{user}</span>
  </div>
));
CardHeader.displayName = "CardHeader";

// Image content of the post
const CardImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("w-full object-cover", className)} // Full width image
    {...props}
  />
));
CardImage.displayName = "CardImage";

// Actions (like, comment, share)
// accept likes, comments, share as props and display the counts
const CardActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    likes: number; 
    commentsCount: number; 
    //</HTMLDivElement>share: number;
    onLike: () => void; //handlers for like and comment, possibly share
    onComment: () => void;
    isLiked?: boolean;
    //onShare: () => void; 
  }
>(({ className, likes, commentsCount, onLike, onComment,isLiked, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center space-x-4 p-4", className)} // Action icons layout
    {...props}
  >
    {/* Like button */}
    <button 
      className="text-gray-600 flex items-center hover:text-red-600 transition-colors"
      onClick={onLike} 
      >
      {isLiked ? '❤️' : '🤍'} <span className="ml-1">{likes}</span>
    </button> 

    {/* Comment button */}
    <button 
      className="text-gray-600 flex items-center hover:text-blue-600 transition-colors"
      onClick={onComment}
    >
      💬 <span className="ml-1">{commentsCount}</span>
      </button> {/* Comment Icon */}

    {/* Share Button
    <button
      className="text-gray-600 hover:text-green-600 transition-colors"
      onClick={onShare} // Call the onShare function when clicked
    >
      🔗 <span className="ml-1">{share}</span>
    </button> */}
  </div>
  )
);
CardActions.displayName = "CardActions";

// Caption section
const CardCaption = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {user: string; content: string}
>(({ className, user, content, ...props }, ref) => (
  <p ref={ref} className={cn("px-4 py-2 text-sm text-black", className)} {...props}>
    <span className="font-semibold">{user}</span> {content}
  </p>
));
CardCaption.displayName = "CardCaption";

// Date section for posted time
const CardDate = React.forwardRef<HTMLDivElement, { timestamp: string }>(
  ({ timestamp, ...props }, ref) => (
    <div
      ref={ref}
      className="absolute top-7 right-5 text-xs text-white bg-gray-800 bg-opacity-50 px-2 py-1 rounded"
      {...props}
    >
      {formatDate(timestamp)}
    </div>
  )
);
CardDate.displayName = "CardDate";

export { Card, CardHeader, CardImage, CardActions, CardCaption, CardDate};