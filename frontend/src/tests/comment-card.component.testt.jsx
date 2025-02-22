import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommentCard from '../components/comment-card.component'; // Adjust the import path
import { UserContext } from '../App';
import { PostContext } from '../pages/post.page';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useContext, useState } from 'react';

// Mock dependencies
vi.mock('axios');
vi.mock('react-hot-toast');
vi.mock('../common/date', () => ({
  getDay: vi.fn((date) => `Formatted ${date}`),
}));
vi.mock('./comment-field.component', () => ({
  default: ({ action, replyingTo, setReplying }) => (
    <div data-testid="comment-field">
      {action} to {replyingTo}
      <button onClick={() => setReplying(false)}>Close</button>
    </div>
  ),
}));

// Partially mock React to keep original exports while overriding specific ones
vi.mock('react', async () => {
  const actual = await vi.importActual('react'); // Import the real React module
  return {
    ...actual, // Spread the original exports (includes createContext, etc.)
    useContext: vi.fn(), // Override useContext
    useState: vi.fn(), // Override useState
  };
});

// Test wrapper to provide context
const MockWrapper = ({ children, userContextValue, postContextValue }) => (
  <UserContext.Provider value={userContextValue}>
    <PostContext.Provider value={postContextValue}>
      {children}
    </PostContext.Provider>
  </UserContext.Provider>
);

describe('CommentCard', () => {
  let mockSetReplying;

  // Default props and context values
  const defaultCommentData = {
    _id: 'comment1',
    commented_by: {
      personal_info: {
        profile_img: 'https://example.com/img.jpg',
        fullname: 'John Doe',
        username: 'johndoe',
      },
    },
    commentedAt: '2023-01-01',
    comment: 'Test comment',
    children: [],
    childrenLevel: 0,
    isReplyLoaded: false,
  };

  const defaultUserContext = {
    userAuth: {
      access_token: 'mock-token',
      username: 'johndoe',
    },
  };

  const defaultPostContext = {
    post: {
      comments: {
        results: [defaultCommentData],
      },
      activity: {
        total_parent_comments: 1,
      },
      author: {
        personal_info: {
          username: 'johndoe',
        },
      },
    },
    setPost: vi.fn(),
    setTotalParentCommentsLoaded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetReplying = vi.fn();
    vi.mocked(useState).mockImplementation((initial) => [initial, mockSetReplying]);
    vi.mocked(useContext).mockImplementation((context) => {
      if (context === UserContext) return defaultUserContext;
      if (context === PostContext) return defaultPostContext;
    });
    axios.post.mockReset();
  });

  it('renders comment card with correct data', () => {
    render(
      <MockWrapper userContextValue={defaultUserContext} postContextValue={defaultPostContext}>
        <CommentCard index={0} leftVal={0} commentData={defaultCommentData} />
      </MockWrapper>
    );

    expect(screen.getByText('John Doe @johndoe')).toBeInTheDocument();
    expect(screen.getByText('Test comment')).toBeInTheDocument();
    expect(screen.getByText('Formatted 2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('0 Reply')).toBeInTheDocument();
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('shows delete button when user is the comment author', () => {
    render(
      <MockWrapper userContextValue={defaultUserContext} postContextValue={defaultPostContext}>
        <CommentCard index={0} leftVal={0} commentData={defaultCommentData} />
      </MockWrapper>
    );

    expect(screen.getByText('fi-rr-trash')).toBeInTheDocument(); // Adjust based on actual rendering
  });

  it('shows delete button when user is the post author', () => {
    const postContext = {
      ...defaultPostContext,
      post: {
        ...defaultPostContext.post,
        author: { personal_info: { username: 'janedoe' } },
      },
    };
    const userContext = {
      userAuth: { access_token: 'mock-token', username: 'janedoe' },
    };

    render(
      <MockWrapper userContextValue={userContext} postContextValue={postContext}>
        <CommentCard index={0} leftVal={0} commentData={defaultCommentData} />
      </MockWrapper>
    );

    expect(screen.getByText('fi-rr-trash')).toBeInTheDocument();
  });

  it('hides delete button for non-author users', () => {
    const userContext = {
      userAuth: { access_token: 'mock-token', username: 'otheruser' },
    };

    render(
      <MockWrapper userContextValue={userContext} postContextValue={defaultPostContext}>
        <CommentCard index={0} leftVal={0} commentData={defaultCommentData} />
      </MockWrapper>
    );

    expect(screen.queryByText('fi-rr-trash')).not.toBeInTheDocument();
  });

  it('toggles reply field on Reply button click', () => {
    render(
      <MockWrapper userContextValue={defaultUserContext} postContextValue={defaultPostContext}>
        <CommentCard index={0} leftVal={0} commentData={defaultCommentData} />
      </MockWrapper>
    );

    fireEvent.click(screen.getByText('Reply'));
    expect(mockSetReplying).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('comment-field')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(mockSetReplying).toHaveBeenCalledWith(false);
  });

  it('shows error toast when replying without access token', () => {
    vi.mocked(useContext).mockReturnValueOnce({ userAuth: { access_token: null, username: null } });
    render(
      <MockWrapper userContextValue={{ userAuth: { access_token: null, username: null } }} postContextValue={defaultPostContext}>
        <CommentCard index={0} leftVal={0} commentData={defaultCommentData} />
      </MockWrapper>
    );

    fireEvent.click(screen.getByText('Reply'));
    expect(toast.error).toHaveBeenCalledWith('login first to leave a reply');
  });

  it('loads replies when clicking Load Replies', async () => {
    const commentDataWithReplies = {
      ...defaultCommentData,
      children: ['reply1', 'reply2'],
    };
    const postContextWithReplies = {
      ...defaultPostContext,
      post: {
        ...defaultPostContext.post,
        comments: { results: [commentDataWithReplies] },
      },
    };
    axios.post.mockResolvedValueOnce({
      data: { replies: [{ _id: 'reply1', comment: 'Reply 1', childrenLevel: 1 }] },
    });

    render(
      <MockWrapper userContextValue={defaultUserContext} postContextValue={postContextWithReplies}>
        <CommentCard index={0} leftVal={0} commentData={commentDataWithReplies} />
      </MockWrapper>
    );

    fireEvent.click(screen.getByText('2 Reply'));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `${import.meta.env.VITE_SERVER_DOMAIN}/get-replies`,
        { _id: 'comment1', skip: 0 }
      );
      expect(postContextWithReplies.setPost).toHaveBeenCalled();
    });
  });

  it('hides replies when clicking Hide Reply', () => {
    const commentDataWithReplies = {
      ...defaultCommentData,
      children: ['reply1'],
      isReplyLoaded: true,
    };
    const postContextWithReplies = {
      ...defaultPostContext,
      post: {
        ...defaultPostContext.post,
        comments: { results: [commentDataWithReplies, { _id: 'reply1', childrenLevel: 1 }] },
      },
    };

    render(
      <MockWrapper userContextValue={defaultUserContext} postContextValue={postContextWithReplies}>
        <CommentCard index={0} leftVal={0} commentData={commentDataWithReplies} />
      </MockWrapper>
    );

    fireEvent.click(screen.getByText('Hide Reply'));
    expect(postContextWithReplies.setPost).toHaveBeenCalled();
  });

  it('deletes comment when delete button is clicked', async () => {
    axios.post.mockResolvedValueOnce({});

    render(
      <MockWrapper userContextValue={defaultUserContext} postContextValue={defaultPostContext}>
        <CommentCard index={0} leftVal={0} commentData={defaultCommentData} />
      </MockWrapper>
    );

    fireEvent.click(screen.getByText('fi-rr-trash'));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `${import.meta.env.VITE_SERVER_DOMAIN}/delete-comment`,
        { _id: 'comment1' },
        { headers: { Authorization: `Bearer ${defaultUserContext.userAuth.access_token}` } }
      );
      expect(defaultPostContext.setPost).toHaveBeenCalled();
      expect(defaultPostContext.setTotalParentCommentsLoaded).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  it('shows Load More Replies button when more replies exist', () => {
    const commentDataWithReplies = {
      ...defaultCommentData,
      children: ['reply1', 'reply2'],
      isReplyLoaded: true,
    };
    const postContextWithReplies = {
      ...defaultPostContext,
      post: {
        ...defaultPostContext.post,
        comments: {
          results: [
            { _id: 'parent', children: ['comment1', 'reply2'], childrenLevel: 0 },
            commentDataWithReplies,
          ],
        },
      },
    };

    render(
      <MockWrapper userContextValue={defaultUserContext} postContextValue={postContextWithReplies}>
        <CommentCard index={1} leftVal={1} commentData={commentDataWithReplies} />
      </MockWrapper>
    );

    expect(screen.getByText('Load More Replies')).toBeInTheDocument();
  });
});