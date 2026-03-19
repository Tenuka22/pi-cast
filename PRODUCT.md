# 📐 pi-cast Product Specification

**Version**: 1.0.0  
**Last Updated**: March 2026

---

## 🎯 Product Vision

pi-cast transforms mathematics education by creating an **interactive, exploratory learning experience** where students don't just watch lectures—they participate in them. Our platform empowers teachers to create dynamic, block-based lessons and enables students to manipulate mathematical concepts in real-time, fostering deeper understanding through hands-on experimentation.

### Mission Statement
> Make mathematics intuitive, visual, and interactive by giving students the power to explore concepts at their own pace.

---

## 👥 User Personas

### 1. The Teacher (Creator)
**Name**: Ms. Sarah Chen  
**Background**: High school mathematics teacher, 8 years experience  
**Goals**:
- Create engaging lessons that students can interact with
- Reduce repetitive explanations by recording once
- Help visual learners understand abstract concepts
- Track which students are struggling

**Pain Points**:
- Students zone out during traditional lectures
- Can't pause to let every student experiment
- Difficult to show dynamic changes in equations
- Limited class time for individual attention

**How pi-cast Helps**:
- Pre-made blocks reduce preparation time
- Event-driven recording captures teaching naturally
- Students can experiment without interrupting flow
- Bookmarks help highlight key concepts

---

### 2. The Student (Learner)
**Name**: Alex Rodriguez  
**Background**: 10th grade student, struggles with algebra  
**Goals**:
- Understand concepts, not just memorize formulas
- Learn at own pace without pressure
- Visualize what equations actually mean
- Review difficult concepts multiple times

**Pain Points**:
- Traditional videos are passive
- Can't ask questions during recorded lectures
- Loses place when pausing to experiment
- Graphs on paper don't show dynamic changes

**How pi-cast Helps**:
- Manipulate equations during playback
- Bookmarks for easy review
- Instant visual feedback on parameter changes
- Never "breaks" the lecture by experimenting

---

### 3. The Administrator
**Name**: Dr. James Park  
**Background**: School district technology director  
**Goals**:
- Ensure platform reliability and security
- Monitor usage and engagement metrics
- Manage teacher and student accounts
- Control content quality

**Pain Points**:
- Multiple platforms to manage
- Concerns about student data privacy
- Need usage analytics for budget justification
- Content moderation challenges

**How pi-cast Helps**:
- Centralized admin dashboard
- Role-based access control
- Comprehensive analytics
- Content approval workflows

---

## 🎨 Core Features

### Feature Set 1: Block System

#### 1.1 Equation Blocks
**Description**: Reusable mathematical expression blocks that teachers can create and students can manipulate.

**Specifications**:
- Supported formats: Linear (y = mx + c), Quadratic (ax² + bx + c), future: Calculus
- Visual representation: Tokenized with syntax highlighting
- Dimensions: Fixed width, height = 32px × n (where n = number of lines)
- Interaction: Drag from library, drop on grid, auto-arrange with neighbors

**User Stories**:
- As a teacher, I can create an equation block before recording so I can use it during my lesson
- As a student, I can drag an equation block onto the canvas to experiment with it
- As a teacher, I can group related equations together for organized lessons

#### 1.2 Chart Blocks
**Description**: Auto-generated visual graphs from equation blocks.

**Specifications**:
- Trigger: Automatically appears when equation is placed on canvas
- Size: Larger than equation blocks (dynamic based on complexity)
- Features: Zoom, pan, axis labels, grid lines
- Multiple equations: Overlay support for comparison

**User Stories**:
- As a student, I want to see the graph of y = mx + c appear when I place the equation
- As a teacher, I want multiple equations to display on the same chart for comparison
- As a student, I want to zoom in on specific parts of the graph

#### 1.3 Control Blocks
**Description**: Interactive sliders and number inputs for equation variables.

**Specifications**:
- Range: -∞ to +∞ (practical limits: -1000 to 1000)
- Input types: Slider, number field, stepper
- Real-time updates: Graph responds instantly to changes
- Snap points: Optional integer-only or custom increments

**User Stories**:
- As a student, I want sliders for m and c in y = mx + c to see how they affect the line
- As a teacher, I can set default ranges for variables to guide exploration
- As a student, I want to type exact values into number inputs

#### 1.4 Description Blocks
**Description**: Pre-made text/content blocks for lesson structure and explanations.

**Specifications**:
- Rich text support: Bold, italic, lists, basic formatting
- Math notation: LaTeX support for inline equations
- Templates: Teachers can create reusable description blocks
- Sizing: Flexible width, auto-height based on content

**User Stories**:
- As a teacher, I can add explanation text between equation demonstrations
- As a teacher, I can create template descriptions for common concepts
- As a student, I can read context without leaving the canvas

---

### Feature Set 2: Grid Canvas

#### 2.1 Infinite Grid System
**Description**: The foundational workspace where all blocks live and interact.

**Specifications**:
- Grid size: 32x32 pixel base units
- Canvas: Infinite in all directions (virtual scrolling)
- Snap behavior: Blocks snap to grid on drop
- Auto-arrangement: Neighboring blocks shift to accommodate new blocks
- Visual style: Subtle grid lines, optional show/hide

**User Stories**:
- As a teacher, I have infinite space to build complex lessons
- As a student, I can arrange blocks in a way that makes sense to me
- As a user, blocks automatically organize so I don't have to manually adjust

#### 2.2 Block Placement & Arrangement
**Description**: Intelligent system for block positioning and neighbor management.

**Specifications**:
- Initial state: Blocks in library at fixed width
- On drop: Width adjusts to fit content, maintains 32px multiple height
- Neighbor detection: Automatic shift of adjacent blocks
- Grouping: Related blocks can be locked together
- Layering: Z-index management for overlapping elements

**User Stories**:
- As a teacher, when I drop a block, neighbors move out of the way automatically
- As a student, I can group related equations and move them together
- As a user, the canvas never feels cluttered due to smart arrangement

---

### Feature Set 3: Recording System

#### 3.1 Event-Driven Recording
**Description**: Capture teaching actions as discrete events rather than video frames.

**Specifications**:
- Event types: Block placement, parameter change, navigation, annotation
- Timestamp: Precise millisecond accuracy
- Metadata: Event-specific data (block ID, position, values)
- Storage: JSON event log with efficient compression

**Event Schema Example**:
```json
{
  "timestamp": 12450,
  "type": "BLOCK_PLACED",
  "data": {
    "blockId": "eq-001",
    "position": { "x": 128, "y": 96 },
    "equation": "y = mx + c",
    "defaultValues": { "m": 1, "c": 0 }
  }
}
```

**User Stories**:
- As a teacher, my actions are recorded efficiently without large video files
- As a student, I can replay lessons with perfect fidelity
- As a developer, events are easy to process and synchronize

#### 3.2 Audio Segmentation
**Description**: Intelligent audio splitting based on silence detection.

**Specifications**:
- Silence detection: Threshold-based (configurable dB level)
- Segment pattern: ___ / ____ (speech/silence alternation)
- Synchronization: Each segment mapped to nearest event
- Storage: Compressed audio format (AAC/OGG)
- Playback: Seamless stitching during replay

**User Stories**:
- As a teacher, I can speak naturally and audio is automatically segmented
- As a student, audio plays smoothly without gaps or jumps
- As a system, storage is optimized by removing silent portions

#### 3.3 Recording Controls
**Description**: Full-featured recording interface for teachers.

**Specifications**:
- Start/Stop: Clear recording state indicators
- Pause/Resume: Temporary halt without ending session
- Markers: Add bookmarks during recording for key moments
- Preview: Quick review before publishing
- Retake: Re-record specific sections (future)

**User Stories**:
- As a teacher, I can pause to gather thoughts without recording dead air
- As a teacher, I can mark important moments for students to find later
- As a teacher, I can preview my lesson before students see it

---

### Feature Set 4: Playback System

#### 4.1 Standard Player Controls
**Description**: Comprehensive playback functionality for students.

**Specifications**:
- Play/Pause: Toggle playback state
- Seek: Click/drag on progress bar
- Rewind/Forward: -10s, +10s quick buttons
- Speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- Progress: Visual indicator with event markers
- Time display: Current time / Total duration

**User Stories**:
- As a student, I can control playback just like any video platform
- As a student, I can speed up review or slow down difficult sections
- As a student, I can see where important events happen on the timeline

#### 4.2 Interactive Playback
**Description**: Unique feature allowing manipulation during lesson playback.

**Specifications**:
- Pause-to-edit: Automatic pause when student interacts with blocks
- State preservation: Experiment state saved separately from lesson state
- Resume behavior: Option to revert or continue with changes
- Parallel timelines: Original teacher actions + student modifications

**User Stories**:
- As a student, I can pause mid-lecture to adjust equation parameters
- As a student, my experiments don't break the lesson flow
- As a student, I can resume the lesson after exploring on my own

#### 4.3 Bookmark System
**Description**: Personal and teacher-created bookmarks for navigation.

**Specifications**:
- Teacher bookmarks: Pre-defined important moments (visible to all)
- Student bookmarks: Personal bookmarks (private)
- Types: Concept markers, review points, question references
- Navigation: Quick jump to any bookmark
- Organization: Named, categorized, color-coded

**User Stories**:
- As a teacher, I can mark key concepts for easy student review
- As a student, I can bookmark confusing parts to revisit later
- As a student, I can quickly navigate to specific topics in long lessons

#### 4.4 Note-Taking
**Description**: Timestamped notes for personal study.

**Specifications**:
- Creation: Add note at current timestamp
- Editing: Rich text notes with basic formatting
- Organization: Searchable note library
- Export: Download notes as PDF/text (future)
- Linking: Notes linked to specific lesson moments

**User Stories**:
- As a student, I can jot down questions while watching
- As a student, my notes are organized by lesson and timestamp
- As a student, I can click a note to jump to that moment in the lesson

---

### Feature Set 5: User Management

#### 5.1 Authentication & Authorization ✅ (Implemented)

**Current Implementation**:
- ✅ Email OTP authentication (magic link style)
- ✅ GitHub OAuth integration
- ✅ Session management with Better Auth
- ✅ Multi-device session support
- ✅ Session revocation (single/all)

**Specifications**:
- Sign up: Email OTP, GitHub OAuth
- Login: Email OTP, GitHub OAuth
- Password reset: N/A (OTP-based)
- Session management: Secure cookies, token-based
- Roles: Student, Teacher, Admin (via Better Auth admin plugin)

#### 5.2 Organizations ✅ (Implemented)

**Current Implementation**:
- ✅ Organization creation
- ✅ Member management (invite, remove, update role)
- ✅ Role system (owner, admin, member)
- ✅ Invitation system with email
- ✅ Full organization dashboard

**Specifications**:
- Create organizations for schools/classes
- Invite members via email
- Role-based permissions
- Organization-scoped content sharing (future)

#### 5.3 User Profiles ✅ (Partial)

**Current Implementation**:
- ✅ Profile display (name, email, image)
- ✅ Profile editing (name, image URL)
- ✅ Email change functionality
- ✅ Account deletion

**To Implement**:
- 📋 Bio/description
- 📋 Public profile pages for teachers
- 📋 Achievement badges

#### 5.4 Admin Dashboard 📋 (Planned)

**Specifications**:
- User management: View, edit, suspend accounts
- Content moderation: Approve/reject lessons
- Analytics: Platform-wide metrics
- Reports: Handle user reports and issues

---

### Feature Set 6: Content Discovery

#### 6.1 Lesson Organization 📋

**Specifications**:
- Courses: Group lessons into structured curricula
- Playlists: User-created lesson collections
- Categories: Subject-based organization (Algebra, Geometry, Calculus)
- Tags: Keyword-based discovery
- Levels: Grade/difficulty indicators

#### 6.2 Search & Browse 📋

**Specifications**:
- Search: Full-text search with autocomplete
- Filters: By category, level, duration, rating
- Sorting: Popular, recent, rating, alphabetical
- Recommendations: AI-powered suggestions (future)

#### 6.3 Homepage & Landing 📋

**Specifications**:
- Featured lessons: Curated content
- Trending: Popular lessons this week
- Continue learning: Personal progress
- New releases: Recently published lessons

---

## 🗺️ Product Roadmap

### Phase 1: MVP (Months 1-4)
**Goal**: Core interactive learning experience

**Deliverables**:
- ✅ User authentication (Email OTP, GitHub)
- ✅ Organization management
- ✅ User dashboard and settings
- 🚧 Block system (equation, chart, control, description)
- 🚧 Infinite grid canvas with auto-arrangement
- 🚧 Event-driven recording system
- 🚧 Audio segmentation and synchronization
- 🚧 Basic playback with standard controls
- 📋 Lesson creation and publishing
- 📋 Basic search and browse

**Success Metrics**:
- 100+ lessons created by beta teachers
- 500+ student signups in first month
- Average session duration > 15 minutes
- Lesson completion rate > 60%

---

### Phase 2: Engagement (Months 5-7)
**Goal**: Increase student engagement and learning outcomes

**Deliverables**:
- 📋 Bookmark system (teacher + student)
- 📋 Note-taking with timestamps
- 📋 Progress tracking and completion certificates
- 📋 Enhanced analytics for teachers
- 📋 Mobile-responsive design improvements
- 📋 Performance optimizations

**Success Metrics**:
- Bookmark usage > 40% of active students
- Note creation > 25% of active students
- Return rate (7-day) > 50%
- NPS score > 30

---

### Phase 3: Assessment (Months 8-10)
**Goal**: Add evaluation and feedback mechanisms

**Deliverables**:
- 🔮 Question block type for teachers
- 🔮 Student answer submission system
- 🔮 Auto-graded question types (multiple choice, numeric)
- 🔮 Teacher grading interface for open-ended questions
- 🔮 Grade book for teachers
- 🔮 Student performance dashboard

**Success Metrics**:
- 70% of lessons include questions
- Average quiz score tracking accuracy
- Teacher time spent grading reduced by 50%

---

### Phase 4: Collaboration (Months 11-13)
**Goal**: Enable collaborative learning experiences

**Deliverables**:
- 🔮 Collaborative editing (multiple students on same canvas)
- 🔮 Live classes with real-time interaction
- 🔮 Chat system for lessons
- 🔮 Study groups and peer learning
- 🔮 Teacher office hours feature
- 🔮 Screen sharing for tutoring

**Success Metrics**:
- Live class attendance rates
- Collaborative session duration
- Peer interaction metrics

---

### Phase 5: Expansion (Months 14-18)
**Goal**: Broaden content and platform reach

**Deliverables**:
- 🔮 Advanced mathematics support (Calculus, Statistics)
- 🔮 Science subjects (Physics, Chemistry graphs)
- 🔮 Mobile applications (iOS, Android)
- 🔮 Offline mode for downloaded lessons
- 🔮 Integration with LMS (Canvas, Google Classroom)
- 🔮 API for third-party content

**Success Metrics**:
- Mobile DAU > 30% of total DAU
- Offline usage metrics
- LMS integration adoption rate

---

### Phase 6: Monetization (Months 19+)
**Goal**: Sustainable business model

**Deliverables**:
- 🔮 Freemium model implementation
- 🔮 Premium subscription tiers
- 🔮 Institution licensing
- 🔮 Creator revenue sharing
- 🔮 Marketplace for premium lessons
- 🔮 Certification programs

**Success Metrics**:
- Conversion rate to paid > 5%
- Monthly recurring revenue growth
- Creator earnings distribution
- Institution contracts signed

---

## 📊 Success Metrics & KPIs

### User Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users (DAU) | 1,000+ (Year 1) | Unique users per day |
| Monthly Active Users (MAU) | 10,000+ (Year 1) | Unique users per month |
| DAU/MAU Ratio | > 0.2 | Engagement stickiness |
| User Retention (7-day) | > 50% | Return after 7 days |
| User Retention (30-day) | > 30% | Return after 30 days |

### Content Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Lessons Created | 500+ (Year 1) | Total published lessons |
| Lessons Completed | 60%+ completion | Students finishing lessons |
| Average Lesson Duration | 10-20 minutes | Time spent per lesson |
| Teacher Activation | 20% of signups | Students who become teachers |

### Engagement Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Session Duration | > 15 minutes | Average time per session |
| Sessions per User | > 3 per week | Frequency of use |
| Block Interactions | > 10 per session | Manipulations per visit |
| Bookmark Creation | > 40% of users | Students using bookmarks |
| Note Creation | > 25% of users | Students taking notes |

### Technical Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 3 seconds | 95th percentile |
| API Response Time | < 200ms | Average response time |
| Error Rate | < 1% | Errors per 100 requests |
| Uptime | > 99.9% | Platform availability |
| Canvas FPS | > 60 FPS | Rendering performance |

---

## 🔮 Future Considerations

### AI-Powered Features
- **Adaptive Learning**: AI adjusts lesson difficulty based on student performance
- **Smart Recommendations**: Personalized lesson suggestions
- **Automated Hints**: Context-aware hints during problem solving
- **Plagiarism Detection**: For student submissions

### Advanced Content Types
- **3D Visualization**: Three-dimensional graphing for advanced math
- **Geometry Tools**: Interactive geometric constructions
- **Statistics Lab**: Data analysis and probability simulations
- **Programming Integration**: Code blocks for computational math

### Social Features
- **Student Profiles**: Showcase achievements and progress
- **Leaderboards**: Gamified learning (careful implementation)
- **Study Groups**: Peer-to-peer learning communities
- **Teacher Collaboration**: Co-create lessons together

### Accessibility Enhancements
- **Screen Reader Support**: Full WCAG 2.1 AA compliance
- **Keyboard Navigation**: Complete functionality without mouse
- **Dyslexia Font**: Optional dyslexia-friendly typography
- **Color Blindness Modes**: Alternative color schemes
- **Closed Captions**: Auto-generated captions for audio

### Internationalization
- **Multi-language Support**: UI translation (Spanish, Mandarin, Hindi, etc.)
- **RTL Support**: Arabic, Hebrew language support
- **Localized Content**: Region-specific curricula
- **Currency/Unit Conversion**: Automatic localization

---

## 🎨 Design Principles

### 1. Clarity Over Clutter
- Clean interfaces with purposeful whitespace
- One primary action per screen
- Progressive disclosure of advanced features
- Consistent visual hierarchy

### 2. Immediate Feedback
- Visual response to every interaction
- Loading states for all async operations
- Success/error messages for all actions
- Real-time updates for collaborative features

### 3. Forgiving Interface
- Undo for all destructive actions
- Autosave for all user work
- Clear confirmation for permanent actions
- Easy recovery from mistakes

### 4. Accessible by Default
- WCAG 2.1 AA compliance minimum
- Keyboard navigation from day one
- Screen reader testing for all features
- Color not as sole indicator

### 5. Performance as a Feature
- Perceived performance optimization
- Skeleton loaders for all content
- Optimistic UI updates
- Lazy loading for non-critical resources

---

## 🔒 Privacy & Security

### Data Protection
- **Encryption**: All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Minimization**: Collect only necessary user data
- **Retention**: Automatic deletion of inactive accounts after 2 years
- **Export**: Users can download all their data (GDPR compliance)

### Student Privacy (COPPA Compliance)
- **Parental Consent**: Required for users under 13
- **Data Limitations**: No personal data sold to third parties
- **School Agreements**: FERPA compliance for school accounts
- **Content Moderation**: All public content reviewed before publishing

### Security Measures
- **Authentication**: Secure password hashing (bcrypt), MFA option
- **Authorization**: Role-based access control throughout
- **Auditing**: All admin actions logged and auditable
- **Testing**: Regular security audits and penetration testing

### Current Implementation ✅
- ✅ Email OTP authentication (no password storage)
- ✅ Secure session cookies with httpOnly
- ✅ CSRF protection via Better Auth
- ✅ CORS configuration
- ✅ Rate limiting middleware
- ✅ Input validation with valibot
- ✅ Type-safe API with oRPC

---

## 📞 Support & Documentation

### User Support
- **Help Center**: Searchable knowledge base
- **Video Tutorials**: Step-by-step guides for all features
- **Community Forum**: Peer-to-peer support (future)
- **Email Support**: support@pi-cast.com
- **Response Time**: < 24 hours for all inquiries

### Teacher Resources
- **Getting Started Guide**: First lesson creation walkthrough
- **Best Practices**: Tips for effective interactive lessons
- **Template Library**: Pre-made blocks and lesson structures
- **Webinar Series**: Weekly training sessions (future)

### Developer Resources
- **API Documentation**: Complete REST API reference
- **SDK**: JavaScript SDK for integrations (future)
- **Webhooks**: Event notifications for integrations (future)
- **Status Page**: Real-time platform status

---

## 📝 Appendix

### Glossary
- **Block**: Reusable component (equation, chart, description, etc.)
- **Canvas**: Infinite grid workspace where blocks are placed
- **Event**: Recorded action during lesson creation
- **Segment**: Audio portion between silence gaps
- **Bookmark**: Saved timestamp for quick navigation
- **Creator**: User role for teachers who create lessons
- **Learner**: User role for students who consume lessons
- **Organization**: Multi-user group for schools/classes

### Technical Specifications
- **Supported Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Minimum Screen Resolution**: 1024x768
- **Recommended Internet Speed**: 5 Mbps for streaming
- **Storage per Lesson**: ~500KB events + ~1MB audio per minute
- **Concurrent Users**: Designed for 10,000+ simultaneous users

### Database Schema

**Users Table**:
- `id` (text, PK) - User ID
- `name` (text) - Display name
- `email` (text, unique) - Email address
- `emailVerified` (boolean) - Email verification status
- `image` (text) - Profile image URL
- `role` (text) - User role (student, teacher, admin)
- `banned` (boolean) - Ban status
- `banReason` (text) - Reason for ban
- `banExpires` (integer) - Ban expiration timestamp
- `createdAt` (integer) - Account creation timestamp
- `updatedAt` (integer) - Last update timestamp

**Sessions Table**:
- `id` (text, PK) - Session ID
- `userId` (text, FK) - Reference to user
- `token` (text, unique) - Session token
- `expiresAt` (integer) - Session expiration
- `ipAddress` (text) - IP address
- `userAgent` (text) - Browser user agent
- `createdAt` (integer) - Session creation timestamp
- `updatedAt` (integer) - Last update timestamp

**Organizations Table**:
- `id` (text, PK) - Organization ID
- `name` (text) - Organization name
- `slug` (text, unique) - URL-friendly identifier
- `logo` (text) - Organization logo URL
- `metadata` (text) - Additional metadata
- `createdAt` (integer) - Creation timestamp

**Members Table**:
- `id` (text, PK) - Membership ID
- `userId` (text, FK) - Reference to user
- `organizationId` (text, FK) - Reference to organization
- `role` (text) - Member role (owner, admin, member)
- `createdAt` (integer) - Join timestamp

### Competitive Analysis
| Feature | pi-cast | Khan Academy | Desmos | YouTube |
|---------|---------|--------------|--------|---------|
| Interactive Blocks | ✅ | ❌ | Partial | ❌ |
| Event-Driven Recording | ✅ | ❌ | ❌ | ❌ |
| Manipulate During Playback | ✅ | ❌ | ❌ | ❌ |
| Auto-Generated Graphs | ✅ | ❌ | ✅ | ❌ |
| Teacher-Created Content | ✅ | ❌ | ❌ | ✅ |
| Structured Curriculum | ✅ | ✅ | ❌ | ❌ |
| Organization Support | ✅ | ✅ | ❌ | ❌ |
| Free Tier | ✅ | ✅ | ✅ | ✅ |

---

**This is a living document.** Product specifications may evolve based on user feedback, technical constraints, and market conditions. All major changes will be documented with version history.

**Document Version**: 1.0.0  
**Created**: March 2026  
**Next Review**: June 2026
