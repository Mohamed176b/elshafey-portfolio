# ElShafey Portfolio

## Overview

A modern, feature-rich portfolio website built with React and Supabase, featuring a dynamic frontend for project showcasing and a comprehensive admin dashboard for content management. The project combines sleek design with powerful functionality to create an impressive online presence.

## [Live Demo](https://elshafey-portfolio.web.app/)

## Key Features

### Portfolio Frontend

- **Interactive UI** with smooth transitions and responsive design
- **Project Showcase** with detailed views and technology stacks
- **Contact Form** with email integration using EmailJS
- **Analytics Integration** for visitor tracking
- **Mobile-First Design** ensuring great UX across all devices

### Admin Dashboard

- **Secure Authentication** via Supabase
- **Project Management**
  - CRUD operations for projects
  - Drag-and-drop project reordering
  - Tech stack association
  - Image upload and management
- **Contact Management**
  - Status tracking (new, read, replied, archived)
  - Email response integration
  - Message filtering and organization
- **Analytics Dashboard**
  - Visit statistics
  - User interaction metrics
  - Geographic data visualization
- **Profile Management**
  - Personal info updates
  - Technology stack management
  - Social links management

## Tech Stack

### Frontend

- React 19
- React Router DOM 7.4
- EmailJS for contact form
- Moment.js for date handling
- Font Awesome 6.6 for icons
- Recharts for analytics visualization

### Backend & Services

- Supabase for:
  - Authentication
  - Database
  - File storage
  - Real-time updates
- Firebase for hosting

### Development Tools

- Create React App
- dotenv for environment management
- Testing libraries (Jest, React Testing Library)

## Project Structure

```
elshafey-portfolio/
├── src/
│   ├── components/
│   │   ├── dashboard/                    # Admin dashboard components
│   │   │   ├── charts/
│   │   │   │   ├── BrowserStats.js      # Browser usage statistics
│   │   │   │   ├── DailyVisitsChart.js  # Daily visitor metrics
│   │   │   │   ├── DeviceStats.js       # Device type statistics
│   │   │   │   ├── LocationStats.js     # Visitor location data
│   │   │   │   ├── ProjectVisitsCharts.js # Project-specific analytics
│   │   │   │   ├── StatisticsCards.js   # Analytics overview cards
│   │   │   │   └── TrafficSources.js    # Traffic source analysis
│   │   │   ├── features/
│   │   │   │   └── FeaturesForm.js      # Project features management
│   │   │   ├── project-detail/
│   │   │   │   ├── FeaturesList.js      # Project features display
│   │   │   │   ├── ProjectLinks.js      # Project links management
│   │   │   │   └── TechList.js         # Technology stack display
│   │   │   ├── AddNewProject.js         # New project creation
│   │   │   ├── AdminLogin.js            # Admin authentication
│   │   │   ├── AllProjects.js          # Projects overview
│   │   │   ├── Analytics.js            # Analytics dashboard
│   │   │   ├── ContactRequests.js      # Contact form submissions
│   │   │   ├── Dashboard.js            # Main dashboard layout
│   │   │   ├── DashboardAnimationObserver.js # Animation controller
│   │   │   ├── EditProject.js          # Project editing
│   │   │   ├── Home.js                 # Dashboard home
│   │   │   ├── Profile.js              # Profile management
│   │   │   ├── ProjectCard.js          # Project preview card
│   │   │   ├── ProjectDetail.js        # Detailed project view
│   │   │   ├── Projects.js             # Projects management
│   │   │   ├── ProtectedRoute.js       # Route protection
│   │   │   └── Settings.js             # Dashboard settings
│   │   ├── portfolio/                   # Public portfolio components
│   │   │   ├── AnimationObserver.js    # Animation controller
│   │   │   ├── Portfolio.js            # Main portfolio page
│   │   │   ├── PortfolioFooter.js      # Footer component
│   │   │   ├── ProjectPage.js          # Project details page
│   │   │   └── SplashScreen.js         # Landing screen
│   │   └── shared/                      # Shared components
│   │       └── NotFound.js             # 404 page
│   ├── styles/                          # CSS stylesheets
│   │   ├── Analytics.css               # Analytics styling
│   │   ├── animations.css              # Animation definitions
│   │   ├── App.css                     # Global styles
│   │   ├── DashboardAnimations.css     # Dashboard animations
│   │   ├── index.css                   # Root styles
│   │   ├── Login.css                   # Authentication styles
│   │   └── NotFound.css               # 404 page styling
|   |── tempcss/                        # cleaned css selectors
|   |   └──....                        
│   ├── supabase/                        # Supabase configuration
│   │   └── supabaseClient.js          # Supabase client setup
│   ├── utils/                           # Utility functions
│   │   ├── analyticsUtils.js          # Analytics helpers
│   │   ├── authUtils.js               # Authentication utilities
│   │   └── rateLimitUtils.js          # Rate limiting logic
│   ├── App.js                          # Main application component
│   ├── App.test.js                     # Application tests
│   ├── index.js                        # Entry point
│   ├── reportWebVitals.js             # Performance monitoring
│   └── setupTests.js                   # Test configuration
├── public/                             # Static assets
│   ├── analytics-icon.png             # Analytics icon
│   ├── favicon.ico                    # Site favicon
│   ├── front-end.png                  # Frontend image
│   ├── index.html                     # HTML template
│   ├── manifest.json                  # PWA manifest
│   ├── robots.txt                     # SEO configuration
│   └── welcome.png                    # Welcome image
├── database/                           # Database configuration
│   ├── 01_tables.sql                  # Database schema
│   └── 02_policies.sql                # Security policies
├── build/                             # Production build
│   ├── static/
│   │   ├── css/                       # Compiled CSS
│   │   └── js/                        # Compiled JavaScript
│   ├── 404.html                       # Error page
│   ├── asset-manifest.json            # Asset mapping
│   └── index.html                     # Built HTML
├── elshafey-portfolio-firebase-adminsdk-fbsvc-c7da018554.json  # Firebase config
├── firebase.json                      # Firebase settings
├── package.json                       # Project dependencies
├── LICENSE                            # License information
└── README.md                          # Project documentation
```

### Key Files Description

#### Root Configuration Files

- **firebase.json**: Firebase hosting and service configuration
- **package.json**: NPM dependencies and scripts
- **LICENSE**: Project license terms
- **README.md**: Project documentation

#### Source Files (`/src`)

1. **Core Application Files**

   - `App.js`: Main application component and routing
   - `index.js`: Application entry point
   - `reportWebVitals.js`: Performance monitoring setup

2. **Component Categories**

   - **Dashboard**: Admin interface components
   - **Portfolio**: Public-facing components
   - **Shared**: Reusable components

3. **Utility Modules**
   - `analyticsUtils.js`: Analytics tracking and processing
   - `authUtils.js`: Authentication handling
   - `rateLimitUtils.js`: API rate limiting

#### Database (`/database`)

- `01_tables.sql`: Database table definitions
- `02_policies.sql`: Row Level Security (RLS) policies

#### Static Assets (`/public`)

Contains static files served directly:

- Images (`.png`, `.ico`)
- PWA configuration (`manifest.json`)
- SEO configuration (`robots.txt`)

#### Build Output (`/build`)

Production-ready code:

- Minified CSS and JavaScript
- Asset manifests
- HTML templates

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm/yarn
- Supabase account
- EmailJS account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Mohamed176b/elshafey-portfolio
   cd elshafey-portfolio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a .env file with:

   ```
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_API_KEY=your-supabase-key
   REACT_APP_USER_ID=your-user-id
   REACT_APP_SERVICE_ID=your-emailjs-service-id
   REACT_APP_TEMPLATE_ID=your-emailjs-template-id
   REACT_APP_EMAILJS_API_KEY=your-emailjs-api-key
   ```

4. **Database Setup**

   - Execute SQL files from the database folder in your Supabase project
   - Set up appropriate RLS policies

5. **Start Development Server**
   ```bash
   npm start
   ```

## Features In Detail

### Project Management

- Create, edit, and delete projects
- Manage project thumbnails and images
- Associate technologies used
- Order projects via drag-and-drop
- Track project views and interactions

### Contact System

- Receive and manage contact form submissions
- Email notification integration
- Message status tracking
- Filtering and search capabilities

### Analytics

- Visit tracking per project
- User interaction monitoring
- Geographic data visualization
- Time-based statistics

### Profile Customization

- Update personal information
- Manage technology stack
- Control social media links
- Upload and update profile picture

## Deployment

### Firebase Deployment Steps

1. **Install Firebase CLI**

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**

   ```bash
   firebase login
   ```

3. **Build the Project**

   ```bash
   npm run build
   ```

4. **Deploy**
   ```bash
   firebase deploy
   ```

## Maintenance

### Regular Tasks

- Update dependencies regularly
- Monitor Supabase usage and quotas
- Backup database periodically
- Check analytics data integrity

### Performance Optimization

- Optimize image assets
- Monitor load times
- Update caching strategies
- Review and optimize database queries

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Contact

- **Email**: moshafey18@gmail.com
- **GitHub**: [Mohamed176b](https://github.com/Mohamed176b)
- **LinkedIn**: [Mohamed ElShafey](https://www.linkedin.com/in/mohamed-elshafey-381401216/)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by Mohamed ElShafey - © 2025
