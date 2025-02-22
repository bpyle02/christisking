// import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// import { render, screen, waitFor } from '@testing-library/react';
// import { MemoryRouter } from 'react-router-dom';
// import App, { UserContext, ThemeContext } from '../App';
// import * as session from '../common/session';
// import React from 'react'; // Explicitly import React

// // Mock the imported components
// vi.mock('./components/navbar.component', () => ({
//   default: () => <div data-testid="navbar">Navbar</div>,
// }));
// vi.mock('./components/sidenavbar.component', () => ({
//   default: () => <div data-testid="sidenav">Sidenav</div>,
// }));
// vi.mock('./pages/userAuthForm.page', () => ({
//   default: ({ type }) => <div data-testid="auth-form">{type}</div>,
// }));
// vi.mock('./pages/editor.pages', () => ({
//   default: () => <div data-testid="editor">Editor</div>,
// }));
// vi.mock('./pages/home.page', () => ({
//   default: () => <div data-testid="home">Home</div>,
// }));
// vi.mock('./pages/404.page', () => ({
//   default: () => <div data-testid="404">Not Found</div>,
// }));

// describe('App Component', () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
    
//     vi.spyOn(session, 'lookInSession').mockImplementation((key) => {
//       if (key === 'user') return null;
//       if (key === 'theme') return null;
//       return null;
//     });

//     window.matchMedia = vi.fn().mockImplementation(query => ({
//       matches: false,
//       media: query,
//       onchange: null,
//       addListener: vi.fn(),
//       removeListener: vi.fn(),
//     }));
//   });

//   it('renders home page at root path', async () => {
//     render(
//       <MemoryRouter initialEntries={['/']}>
//         <App />
//       </MemoryRouter>
//     );

//     // Use waitFor to handle any async mounting
//     await waitFor(() => {
//       expect(screen.getByTestId('navbar')).toBeInTheDocument();
//       expect(screen.getByTestId('home')).toBeInTheDocument();
//     });
//   });

//   it('renders editor page at /editor path', async () => {
//     render(
//       <MemoryRouter initialEntries={['/editor']}>
//         <App />
//       </MemoryRouter>
//     );
    
//     await waitFor(() => {
//       expect(screen.getByTestId('editor')).toBeInTheDocument();
//     });
//   });

//   it('renders 404 page for unknown routes', async () => {
//     render(
//       <MemoryRouter initialEntries={['/unknown-path']}>
//         <App />
//       </MemoryRouter>
//     );
    
//     await waitFor(() => {
//       expect(screen.getByTestId('404')).toBeInTheDocument();
//     });
//   });

//   it('sets dark theme when prefers-color-scheme is dark', async () => {
//     window.matchMedia = vi.fn().mockImplementation(query => ({
//       matches: true,
//       media: query,
//       onchange: null,
//       addListener: vi.fn(),
//       removeListener: vi.fn(),
//     }));

//     render(
//       <MemoryRouter initialEntries={['/']}>
//         <App />
//       </MemoryRouter>
//     );
    
//     await waitFor(() => {
//       expect(document.body.getAttribute('data-theme')).toBe('dark');
//     });
//   });

//   it('uses theme from session storage when available', async () => {
//     vi.spyOn(session, 'lookInSession').mockImplementation((key) => {
//       if (key === 'theme') return 'dark';
//       return null;
//     });

//     render(
//       <MemoryRouter initialEntries={['/']}>
//         <App />
//       </MemoryRouter>
//     );
    
//     await waitFor(() => {
//       expect(document.body.getAttribute('data-theme')).toBe('dark');
//     });
//   });

//   it('provides UserContext with initial values', async () => {
//     let contextValue;
//     const TestComponent = () => {
//       contextValue = React.useContext(UserContext);
//       return null;
//     };

//     render(
//       <MemoryRouter initialEntries={['/']}>
//         <App />
//         <TestComponent />
//       </MemoryRouter>
//     );
    
//     await waitFor(() => {
//       expect(contextValue.userAuth).toEqual({ access_token: null });
//       expect(typeof contextValue.setUserAuth).toBe('function');
//     });
//   });

//   it('provides ThemeContext with initial values', async () => {
//     let contextValue;
//     const TestComponent = () => {
//       contextValue = React.useContext(ThemeContext);
//       return null;
//     };

//     render(
//       <MemoryRouter initialEntries={['/']}>
//         <App />
//         <TestComponent />
//       </MemoryRouter>
//     );
    
//     await waitFor(() => {
//       expect(contextValue.theme).toBe('light');
//       expect(typeof contextValue.setTheme).toBe('function');
//     });
//   });

//   it('sets user from session storage when available', async () => {
//     const mockUser = { access_token: 'test-token' };
    
//     // Set up the mock for this specific test
//     vi.spyOn(session, 'lookInSession').mockImplementation((key) => {
//       if (key === 'user') return JSON.stringify(mockUser);
//       return null;
//     });

//     // Use a wrapper component to capture context value
//     const ContextConsumer = () => {
//       const { userAuth } = React.useContext(UserContext);
//       return <div data-testid="user-auth" data-user={JSON.stringify(userAuth)} />;
//     };

//     render(
//       <MemoryRouter initialEntries={['/']}>
//         <App />
//         <ContextConsumer />
//       </MemoryRouter>
//     );

//     await waitFor(() => {
//       const userAuthElement = screen.getByTestId('user-auth');
//       const userAuthValue = JSON.parse(userAuthElement.dataset.user);
//       expect(userAuthValue).toEqual(mockUser);
//     }, { timeout: 1000 });
//   });

//   afterEach(() => {
//     vi.restoreAllMocks();
//   });
// });