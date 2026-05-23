import { useState } from 'react';

interface UseReactionProps {
  initialLikes?: number;
  initialDislikes?: number;
}

interface UseReactionReturn {
  likes: number;
  dislikes: number;
  liked: boolean;
  disliked: boolean;
  handleLike: () => void;
  handleDislike: () => void;
}

export const useReaction = ({ initialLikes = 2, initialDislikes = 2 }: UseReactionProps = {}): UseReactionReturn => {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1);
      setLiked(false);
    } else {
      setLikes(likes + 1);
      setLiked(true);
      if (disliked) {
        setDislikes(dislikes - 1);
        setDisliked(false);
      }
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDislikes(dislikes - 1);
      setDisliked(false);
    } else {
      setDislikes(dislikes + 1);
      setDisliked(true);
      if (liked) {
        setLikes(likes - 1);
        setLiked(false);
      }
    }
  };

  return {
    likes,
    dislikes,
    liked,
    disliked,
    handleLike,
    handleDislike,
  };
};