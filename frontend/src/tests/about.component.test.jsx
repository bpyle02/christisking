import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AboutUser from '../components/about.component';
import * as dateUtils from '../common/date';
vi.mock('../common/date', () => ({
  getFullDay: vi.fn(),
}));

const Wrapper = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('AboutUser Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dateUtils.getFullDay.mockReturnValue('January 1, 2023');
  });

  it('renders with bio and joined date', () => {
    const props = {
      bio: 'Test bio content',
      social_links: {},
      joinedAt: '1900-01-01',
    };

    render(<AboutUser {...props} />, { wrapper: Wrapper });

    expect(screen.getByText('Test bio content')).toBeInTheDocument();
    expect(screen.getByText('Joined on January 1, 2023')).toBeInTheDocument();
  });

  it('renders default message when bio is empty', () => {
    const props = {
      bio: '',
      social_links: {},
      joinedAt: '2023-01-01',
    };

    render(<AboutUser {...props} />, { wrapper: Wrapper });

    expect(screen.getByText('Nothing to read here')).toBeInTheDocument();
    expect(screen.getByText('Joined on January 1, 2023')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const props = {
      bio: 'Test bio',
      social_links: {},
      joinedAt: '2023-01-01',
      className: 'custom-class',
    };

    const { container } = render(<AboutUser {...props} />, { wrapper: Wrapper });
    const div = container.firstChild;
    
    expect(div.className).toContain('custom-class');
    expect(div.className).toContain('md:w-[90%]');
    expect(div.className).toContain('md:mt-7');
  });

  it('renders all social links correctly', () => {
    const props = {
      bio: 'Test bio',
      social_links: {
        facebook: 'https://facebook.com/test',
        x: 'https://x.com/test',
        instagram: 'https://instagram.com/test',
        website: 'https://example.com',
      },
      joinedAt: '2023-01-01',
    };

    render(<AboutUser {...props} />, { wrapper: Wrapper });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    
    expect(links[0]).toHaveAttribute('href', 'https://facebook.com/test');
    expect(links[0].querySelector('i')).toHaveClass('fi-brands-facebook');
    
    expect(links[1]).toHaveAttribute('href', 'https://x.com/test');
    expect(links[1].querySelector('i')).toHaveClass('fi-brands-twitter');
    
    expect(links[2]).toHaveAttribute('href', 'https://instagram.com/test');
    expect(links[2].querySelector('i')).toHaveClass('fi-brands-instagram');
    
    expect(links[3]).toHaveAttribute('href', 'https://example.com');
    expect(links[3].querySelector('i')).toHaveClass('fi-rr-globe');
  });

  it('handles empty social links object', () => {
    const props = {
      bio: 'Test bio',
      social_links: {},
      joinedAt: '2023-01-01',
    };

    const { container } = render(<AboutUser {...props} />, { wrapper: Wrapper });
    const socialDiv = container.querySelector('.flex.gap-x-7');

    expect(socialDiv.children).toHaveLength(0);
  });

  it('handles social links with some empty values', () => {
    const props = {
      bio: 'Test bio',
      social_links: {
        facebook: 'https://facebook.com/test',
        x: '',
        instagram: 'https://instagram.com/test',
        website: null,
      },
      joinedAt: '2023-01-01',
    };

    render(<AboutUser {...props} />, { wrapper: Wrapper });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    
    expect(links[0]).toHaveAttribute('href', 'https://facebook.com/test');
    expect(links[1]).toHaveAttribute('href', 'https://instagram.com/test');
  });

  it('social links open in new tab', () => {
    const props = {
      bio: 'Test bio',
      social_links: {
        website: 'https://example.com',
      },
      joinedAt: '2023-01-01',
    };

    render(<AboutUser {...props} />, { wrapper: Wrapper });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
  });
});