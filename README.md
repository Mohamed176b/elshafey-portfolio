# ElShafey Portfolio

## Overview

This project is an interactive portfolio with an integrated admin dashboard, built using React and Supabase. It features an attractive frontend for showcasing projects, skills, and personal information, along with an advanced dashboard for content management and user interaction.

## [See Website](https://elshafey-portfolio.web.app/)

## Key Features

### Portfolio Frontend
- **Interactive Home Page** with smooth transitions and responsive design
- **Project Gallery** to showcase previous work in an attractive and organized manner
- **Individual Project Pages** with details and multiple images for each project
- **Integrated Contact Form** for receiving visitor messages
- **Resume and Skills Section** to display experience and qualifications in an organized way
- **Visit Analytics** to track user activity and interaction with the site

### Admin Dashboard
- **Secure Authentication System** for accessing the dashboard
- **Project Management** (add, edit, delete, and reorder projects)
- **Contact Request Management** with status classification (new, read, replied, archived)
- **Profile Customization** and personal information updates
- **Analytics Dashboard** to display visit statistics and interactions
- **Advanced Settings** for customizing website behavior and overall appearance

## Technologies Used

### Frontend
- **React**: Main framework for the project
- **React Router**: For page navigation management
- **CSS Animations**: For adding smooth motion effects
- **Responsive Design**: To ensure the site works on all screen sizes
- **Font Awesome**: For using beautiful icons in the user interface

### Backend
- **Supabase**: Database and Backend-as-a-Service
- **Authentication**: Integrated authentication system with Supabase
- **Storage**: For storing images and project files
- **Real-time Database**: For instant updates and data tracking

### Development Tools
- **Create React App**: For building and developing the application
- **npm/yarn**: For managing project packages and dependencies
- **Git**: For version control and collaboration
- **Firebase Hosting**: Used for website hosting (optional)

## Project Structure

```
elshafey-portfolio/
├── public/                  # Public and static files
├── src/                     # Main source code
│   ├── components/          # Various React components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── portfolio/       # Portfolio interface components
│   │   └── ...
│   ├── styles/              # CSS files and project formatting
│   ├── supabase/            # Supabase configuration and setup
│   ├── utils/               # Helper functions and tools
│   ├── App.js               # Main application component
│   └── index.js             # Application entry point
├── package.json             # Project dependencies and run scripts
└── README.md                # This file
```

## Detailed Features

### 1. Project Management System
- Add new projects with multiple images and detailed descriptions
- Easily reorder projects using drag and drop
- Edit and update existing project details
- Hide/show projects without needing to delete them

### 2. Contact Request System
- Receive messages through the contact form on the portfolio page and email
- Classify messages (new, read, replied, archived)
- Reply directly to messages from the dashboard
- Display correspondence details in an organized and readable format

### 3. Analytics and Statistics System
- Track number of visits to the home page
- Track number of visits to each individual project
- Display visual data for visits (graphs and statistics)
- Analyze peak times and different interactions

### 4. Customization and Settings
- Customize profile information and resume
- Manage displayed skills and technologies
- Edit home page text and messages
- Advanced options for colors and overall appearance

## Getting Started

### Prerequisites
- Node.js (v14.0.0 or newer)
- npm (v7.0.0 or newer) or yarn (v1.22.0 or newer)
- Supabase account (free)

### Setup and Installation

1. **Clone the project**
   ```bash
   git clone https://github.com/yourusername/elshafey-portfolio.git
   cd elshafey-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Supabase**
   - Create a new project in Supabase
   - Copy connection information (URL and API Key)
   - Create a `.env` file in the root directory and add the information:
     ```
     REACT_APP_SUPABASE_URL=your-supabase-url
     REACT_APP_SUPABASE_KEY=your-supabase-anon-key
     ```

4. **Database setup**
   - Use the files in `/database` to create the required tables in Supabase
   - Create a dashboard account using the Supabase Authentication interface

5. **Start in development mode**
   ```bash
   npm start
   # or
   yarn start
   ```

## Using the Project

### Admin Dashboard
1. Access `/admin` in the browser
2. Log in using the credentials you created in Supabase
3. Use the sidebar menu to navigate between different sections (projects, messages, analytics, etc.)

### Adding a New Project
1. Navigate to the "Projects" section in the dashboard
2. Click the "Add New Project" button
3. Fill out the form with the required details (title, description, images, etc.)
4. Click "Save" to add the project

### Managing Contact Requests
1. Navigate to the "Contact Requests" section in the dashboard
2. Browse incoming messages and categorize them by status
3. Click on a message to view full details
4. Use the buttons to reply to the message, change its status, or delete it

### Customizing the Profile
1. Navigate to the "Profile" section in the dashboard
2. Update personal information, skills, and experiences
3. Upload a new profile picture if needed
4. Click "Save Changes" to update profile information

## Deployment and Hosting

The project can be deployed on various hosting platforms such as:

- **Netlify**: Easy integration with GitHub and supports React
- **Vercel**: Excellent option for React-based applications
- **Firebase Hosting**: Compatible with the project and easy to set up
- **GitHub Pages**: Free and simple option

### Deployment Steps for Firebase

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Log in to Firebase**
   ```bash
   firebase login
   ```

3. **Build the project for production**
   ```bash
   npm run build
   # or
   yarn build
   ```

4. **Initialize Firebase in the project**
   ```bash
   firebase init
   ```
   - Choose "Hosting" from the options
   - Specify the `build` folder as the public folder
   - Configure the app as a single-page application (SPA)

5. **Deploy the project**
   ```bash
   firebase deploy
   ```

## Maintenance and Updates

### Database Backup
- Use the automatic backup feature in Supabase
- Periodically export data through the Supabase SQL interface
- Keep multiple copies of important data

### Updating Dependencies
```bash
npm outdated    # To check for outdated dependencies
npm update      # To update dependencies to the latest compatible version
# or
yarn upgrade    # To update all dependencies
```

### Performance Testing
Tools like Lighthouse can be used to measure site performance:
```bash
npm install -g lighthouse
lighthouse https://elshafey-portfolio.web.app/
```

## Troubleshooting

### Authentication Issues
- Ensure the Supabase connection information in the `.env` file is correct
- Check authentication settings in the Supabase control panel
- Make sure Email Authentication is enabled in Supabase settings

### Image Upload Issues
- Check file size limits in Supabase Storage settings
- Ensure appropriate permissions on Storage folders
- Check RLS (Row Level Security) policies in Supabase

### Other Common Issues
- **White Page**: Check for errors in the browser console
- **Slow Loading**: Optimize image sizes and enable caching
- **Changes Not Appearing**: Make sure to refresh the page and clear cache

## Contributing to the Project

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

## Contact and Support

For questions and inquiries, please contact:
- Email: moshafey18@gmail.com.com
- GitHub: [GitHub](https://github.com/Mohamed176b)
- LinkedIn: [LinkedIn](https://www.linkedin.com/in/mohamed-elshafey-381401216/)

---

Made with ❤️ by [Mohamed ElShafey] - © 2025
