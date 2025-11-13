# Implementation Plan - UI/UX Improvements

## Phase 1: Simplify Authentication

- [x] 1. Remove social authentication buttons from Login page
  - Remove Google and GitHub login buttons
  - Remove social auth divider section
  - Clean up UI to be more minimal
  - Update layout spacing
  - _Requirements: 1.1, 1.5_

- [x] 2. Remove social authentication buttons from Register page
  - Remove Google and GitHub registration buttons
  - Remove social auth divider section
  - Keep password strength indicator
  - Clean up UI layout
  - _Requirements: 1.1, 1.5_

- [x] 3. Update Login page to support email or username
  - Change input field label from "Email" to "Email or Username"
  - Update input field name from "email" to "identifier"
  - Add automatic detection of input type (email vs username)
  - Update form validation to handle both formats
  - Update submit handler to send correct field to backend
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Update backend login endpoint to support email or username
  - Modify authController login function
  - Add logic to detect if input contains "@" symbol
  - Query database by email if "@" present, otherwise by username
  - Maintain existing password verification
  - Return appropriate error messages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 4.1 Add validation utility functions
  - Create utils/validation.js file
  - Add isEmail function
  - Add isValidUsername function
  - Add validateLoginIdentifier function
  - Export validation functions
  - _Requirements: 2.1, 2.2, 2.3_

## Phase 2: Implement Intelligent Search

- [x] 5. Create useDebounce custom hook
  - Create client/src/hooks/useDebounce.js
  - Implement debounce logic with configurable delay (default 500ms)
  - Handle cleanup on unmount
  - Return debounced value
  - _Requirements: 3.1, 3.2, 7.4_

- [x] 6. Create useSearchSuggestions custom hook
  - Create client/src/hooks/useSearchSuggestions.js
  - Implement TMDb search API integration
  - Add request cancellation with AbortController
  - Implement in-memory caching (5-minute TTL)
  - Return suggestions, isLoading, and error states
  - Only fetch when query length >= 2 characters
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 7.1, 7.2, 7.3_

- [x] 7. Create SearchSuggestions component
  - Create client/src/components/search/SearchSuggestions.js
  - Display up to 10 movie suggestions in dropdown
  - Show movie poster, title, year, and rating
  - Highlight matching text in suggestions
  - Support keyboard navigation (selected state)
  - Show loading state while fetching
  - Show "No results found" empty state
  - Use framer-motion for animations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Create SearchBar component
  - Create client/src/components/search/SearchBar.js
  - Integrate useDebounce hook
  - Integrate useSearchSuggestions hook
  - Implement keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  - Add click-outside-to-close functionality
  - Show loading indicator during search
  - Handle suggestion selection (navigate to movie page)
  - Handle direct search submission
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_

- [x] 9. Update Navbar to use new SearchBar component
  - Replace existing search input with SearchBar component
  - Update desktop search implementation
  - Update mobile search implementation
  - Remove old search logic
  - Test search functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_

- [x] 10. Create/update backend search endpoint
  - Create or update GET /api/movies/search endpoint
  - Integrate with TMDb search API
  - Add query validation (minimum 2 characters)
  - Limit results to 10 movies
  - Return standardized response format
  - Add error handling
  - _Requirements: 3.5, 4.1, 7.5_

## Phase 3: UI Cleanup and Button Functionality

- [ ] 11. Audit and fix non-functional buttons
  - Review all pages for non-functional buttons
  - Remove or implement functionality for each button
  - Add proper loading states during async operations
  - Add proper disabled states
  - Ensure all buttons have clear labels
  - _Requirements: 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 12. Standardize button styles across application
  - Review existing button styles
  - Create consistent button classes (primary, secondary, danger)
  - Update all buttons to use standard styles
  - Ensure proper hover and active states
  - Test button styles on all pages
  - _Requirements: 5.1, 5.3, 5.5_

- [ ] 13. Improve form validation feedback
  - Add real-time validation to all form inputs
  - Display error messages below form fields
  - Use red color for errors, green for valid states
  - Prevent form submission when errors exist
  - Provide specific error messages
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 14. Add loading states to all async operations
  - Review all async operations (API calls, form submissions)
  - Add loading indicators where missing
  - Disable buttons during loading
  - Show appropriate loading messages
  - Test loading states on slow connections
  - _Requirements: 5.4, 6.2, 6.4_

- [ ] 15. Improve navigation and routing
  - Add visual indicators for current page
  - Implement smooth page transitions
  - Scroll to top on page navigation
  - Maintain navigation state during transitions
  - Test navigation on all pages
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

## Phase 4: Responsive Design and Accessibility

- [ ] 16. Test and fix mobile responsiveness
  - Test all pages on mobile devices (320px, 375px, 414px widths)
  - Fix any layout issues on mobile
  - Ensure touch targets are at least 44x44 pixels
  - Test search autocomplete on mobile
  - Test forms on mobile
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 17. Test and fix tablet responsiveness
  - Test all pages on tablet devices (768px, 1024px widths)
  - Fix any layout issues on tablet
  - Test navigation on tablet
  - Test search functionality on tablet
  - _Requirements: 10.1, 10.3, 10.4_

- [ ] 18. Improve keyboard accessibility
  - Ensure all interactive elements are keyboard accessible
  - Add proper focus states
  - Test tab navigation order
  - Test keyboard shortcuts (search, navigation)
  - Add skip-to-content link
  - _Requirements: 4.3, 9.1_

- [ ]* 19. Add ARIA labels and semantic HTML
  - Review all components for accessibility
  - Add ARIA labels where needed
  - Use semantic HTML elements
  - Test with screen reader
  - Fix any accessibility issues
  - _Requirements: 10.1_

## Phase 5: Testing and Polish

- [ ]* 20. Write unit tests for custom hooks
  - Test useDebounce hook
  - Test useSearchSuggestions hook
  - Test validation utility functions
  - Ensure 80%+ code coverage
  - _Requirements: 3.1, 3.2, 7.1_

- [ ]* 21. Write integration tests for search flow
  - Test search input with debouncing
  - Test suggestion display
  - Test suggestion selection
  - Test keyboard navigation
  - Test error states
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [ ]* 22. Write integration tests for authentication flow
  - Test login with email
  - Test login with username
  - Test registration
  - Test form validation
  - Test error handling
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 8.1, 8.2_

- [ ] 23. Performance testing and optimization
  - Test search performance with slow network
  - Verify debouncing reduces API calls
  - Check cache hit rates
  - Optimize bundle size if needed
  - Test on low-end devices
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 24. Final UI/UX review and polish
  - Review all pages for consistency
  - Fix any remaining UI issues
  - Test all user flows end-to-end
  - Get user feedback
  - Make final adjustments
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
