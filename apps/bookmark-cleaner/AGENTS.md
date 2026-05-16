---
description: Enforces best practices for Angular development, focusing on context-aware code generation, modern patterns, and maintainable architecture. Provides comprehensive guidelines for writing clean, efficient, and secure Angular code with proper context.
globs: **/*.{ts,html}
---

# Angular Best Practices

You are an expert in Angular, TypeScript, RxJS, and related web technologies.
You understand modern Angular development practices, architectural patterns, and the importance of providing complete context in code generation.

### Context-Aware Code Generation

- Always provide complete component context including imports, decorators, and metadata
- Include relevant configuration files (angular.json) when generating projects
- Generate complete class signatures with proper types and decorators
- Include comprehensive documentation explaining the purpose and usage
- Provide context about the component's role in the larger system architecture

### Code Style and Structure

- Follow Angular style guide and clean code principles
- Structure code in feature modules following domain-driven design
- Implement proper separation of concerns (components, services, directives)
- Use modern TypeScript features and Angular decorators appropriately
- Maintain consistent code formatting using Prettier or similar tools

### Framework Best Practices

- Use Angular 20+ features and best practices
- Implement proper state management (NgRx, Services)
- Configure proper routing with Angular Router
- Use proper component composition and lifecycle hooks
- Implement proper error handling
- Configure proper testing setup (Jasmine, Karma)

### Testing and Quality

- Write comprehensive unit tests with proper test context
- Include integration tests for critical paths
- Use proper mocking strategies with Jasmine
- Implement E2E tests with Cypress or Playwright
- Include performance tests for critical components
- Maintain high test coverage for core business logic

### Security and Performance

- Implement proper input validation and sanitization
- Use secure authentication and token management
- Configure proper CORS and CSRF protection
- Implement rate limiting and request validation
- Use proper caching strategies
- Optimize bundle size and loading performance

### Component Design

- Follow smart/presentational component pattern
- Use proper input/output bindings
- Implement proper change detection strategies
- Use proper template syntax and directives
- Implement proper form validation
- Use proper component lifecycle hooks

### State Management

- Use proper state management patterns
- Implement proper data fetching strategies
- Use proper caching mechanisms
- Handle loading and error states properly
- Implement proper optimistic updates
- Use proper state persistence when needed

### Build and Deployment

- Use Angular CLI for project management
- Implement proper CI/CD pipelines
- Use Docker for containerization
- Configure proper environment variables
- Implement proper logging and monitoring
- Use proper deployment strategies

### Examples

```typescript
/**
 * UserService handles user-related operations.
 * Provides methods for user management and authentication.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private http: HttpClient,
    private cache: CacheService
  ) {}

  /**
   * Finds a user by their email address.
   *
   * @param email - The email address to search for
   * @returns Observable containing the user if found
   * @throws HttpErrorResponse if the request fails
   */
  findUserByEmail(email: string): Observable<User | null> {
    const cacheKey = `user:${email}`;
    return this.cache.get<User>(cacheKey).pipe(
      switchMap((cachedUser) => {
        if (cachedUser) {
          return of(cachedUser);
        }
        return this.http
          .get<User>(`/api/users?email=${email}`)
          .pipe(tap((user) => this.cache.set(cacheKey, user)));
      }),
      catchError((error) => {
        console.error('Failed to find user by email:', error);
        throw error;
      })
    );
  }
}

/**
 * Tests for UserService functionality.
 */
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let cacheMock: jasmine.SpyObj<CacheService>;

  beforeEach(() => {
    cacheMock = jasmine.createSpyObj('CacheService', ['get', 'set']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService, { provide: CacheService, useValue: cacheMock }],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should find user by email when user exists', () => {
    // Given
    const email = 'test@example.com';
    const user = { id: 1, email };
    cacheMock.get.and.returnValue(of(null));

    // When
    service.findUserByEmail(email).subscribe((result) => {
      // Then
      expect(result).toEqual(user);
    });

    const req = httpMock.expectOne(`/api/users?email=${email}`);
    expect(req.request.method).toBe('GET');
    req.flush(user);
  });

  it('should return null when user not found', () => {
    // Given
    const email = 'nonexistent@example.com';
    cacheMock.get.and.returnValue(of(null));

    // When
    service.findUserByEmail(email).subscribe((result) => {
      // Then
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne(`/api/users?email=${email}`);
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });
});
```
