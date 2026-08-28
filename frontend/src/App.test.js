import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main app heading', () => {
  render(<App />);
  expect(screen.getByText(/AI Resume Analyzer & Skill Matcher/i)).toBeInTheDocument();
});
