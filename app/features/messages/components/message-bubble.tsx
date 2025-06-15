import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { cn } from "~/lib/utils";
import type { Profile } from "~/features/users/queries";

type SimpleProfile = Pick<Profile, 'profile_id' | 'username' | 'full_name' | 'avatar_url'>;

interface MessageBubbleProps {
  message: string;
  isCurrentUser: boolean;
  author: SimpleProfile;
}

export function MessageBubble({
  message,
  isCurrentUser,
  author,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-3",
        isCurrentUser ? "flex-row-reverse" : ""
      )}
    >
      <Avatar className="size-8">
        <AvatarImage src={author.avatar_url ?? undefined} />
        <AvatarFallback>{author.username?.[0]}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-md rounded-lg p-3 text-sm",
          isCurrentUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <p>{message}</p>
      </div>
    </div>
  );
} 