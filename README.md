# Progress Tracker

> A unified full-stack platform for aggregating, comparing, and tracking competitive programming and open-source progress across LeetCode, Codeforces, GeeksforGeeks, CodeChef, and GitHub.

---

## 🚀 Features

- **Multi-Platform Sync**: Aggregates live student progress across **LeetCode**, **Codeforces**, **GeeksforGeeks**, **CodeChef**, and **GitHub**. Each platform scraper and API client runs in an isolated, fault-tolerant worker so that network failures on one platform never disrupt others.
- **My Dashboard**: Comprehensive personal analytics featuring interactive Chart.js visualizations — including Codeforces rating trajectory line graphs, LeetCode difficulty breakdown doughnut charts, and GitHub top repository star metrics.
- **Platform Score System**: Computes a normalized **Composite Score (0–100)** to provide a fair, standardized ranking across diverse coding platforms:
  - **LeetCode (25%)**: Target 500 problems solved
  - **Codeforces (20%)**: Target 3000 rating
  - **GeeksforGeeks (20%)**: Target 2000 coding score
  - **GitHub (20%)**: Blended repository count (70%) + followers (30%)
  - **CodeChef (15%)**: Target 3000 rating
- **Leaderboard & Monthly Top Performers**: Global dynamic rankings with sortable columns, podium spotlights (`#1`, `#2`, `#3`), and automated recognition badges for monthly top performers and most improved climbers.
- **Directory & Bulk Filter**: Searchable directory of registered students with dynamic multi-select filtering by College, Branch, and Section with instant client-side responsiveness.
- **One-vs-One Comparison**: Head-to-head comparison tool evaluating two students across all shared platforms with automatic verdict calculation, metric-by-metric win badges, and score differences.
- **Contest Calendar**: Aggregated live calendar of upcoming official coding contests from LeetCode, Codeforces, CodeChef, and GeeksforGeeks with real-time start countdowns and direct registration links.
- **Live Community Chat**: Real-time discussion room powered by Socket.IO featuring live online presence indicators, persistent message history, and user attribution.
- **Online Code IDE**: In-browser Monaco code editor with syntax highlighting for Python, C++, and Java, supporting standard input (`stdin`), code downloads, and sandboxed remote code execution via the Judge0 API.
- **Profile & Privacy**: Self-service profile management for updating student information and platform handles, with a **write-once Date of Birth (DOB)** system used strictly for duplicate name disambiguation without public exposure.
- **Dark / Light Theme Toggle**: Persistent two-way theme toggle built on root-scoped CSS variables, seamlessly adjusting page backgrounds, card surfaces, typography, Monaco Editor, and Chart.js scales/tooltips.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [React.js](https://react.dev/) (v19) | Component-based interactive UI with React Router v7 |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) (v4) & Vanilla CSS | Centralized CSS custom properties with responsive layout utilities |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) | Embedded in-browser code editing experience |
| **Data Visualization** | [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/) | Responsive rating trajectory, distribution, and repository charts |
| **Backend Framework** | [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) | REST API server, controller logic, and background scrapers |
| **Database** | [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/) | Schema modelling, student documents, and stats snapshot storage |
| **Authentication** | JWT (JSON Web Tokens) & [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Stateless token-based auth and secure salted password hashing |
| **Real-Time WebSockets**| [Socket.IO](https://socket.io/) | Low-latency bi-directional messaging and live presence tracking |
| **Code Execution** | [Judge0 API](https://judge0.com/) (via RapidAPI) | Remote multi-language code compilation and sandboxed execution |
| **Deployment** | [Vercel](https://vercel.com/) (Frontend) & [Render](https://render.com/) (Backend) | Cloud hosting with automated continuous deployment pipelines |

---

## 📁 Project Structure

```text
progress-tracker/
├── package.json                 # Monorepo root scripts & dev dependencies
├── client/                      # React frontend application (Vite)
│   ├── index.html               # Main HTML entry template
│   ├── vite.config.js           # Vite build & plugin configurations
│   ├── package.json             # Frontend dependencies & scripts
│   └── src/
│       ├── App.jsx              # Main router & toast configuration
│       ├── index.css            # Root CSS variables & Dark/Light themes
│       ├── context/
│       │   └── ThemeContext.jsx # Theme state manager & localStorage persistence
│       ├── components/
│       │   ├── Navbar.jsx       # Global navigation bar with user badge & theme switcher
│       │   ├── ThemeSwitcher.jsx# Sun/Moon 2-way toggle button
│       │   └── MultiSelectDropdown.jsx # Dynamic multi-select filter component
│       └── pages/
│           ├── Home.jsx         # Student directory with multi-criteria filtering
│           ├── Dashboard.jsx    # Student profile analytics & Chart.js visualizations
│           ├── Leaderboard.jsx  # Global rankings & monthly top performers spotlight
│           ├── Compare.jsx      # Side-by-side head-to-head comparison
│           ├── Contests.jsx     # Aggregated upcoming contest calendar & countdowns
│           ├── Chat.jsx         # Socket.IO real-time community chat room
│           ├── IDE.jsx          # Monaco code editor & Judge0 execution console
│           ├── Profile.jsx      # Student profile & platform handle management
│           ├── Login.jsx        # User login and registration form
│           └── NotFound.jsx     # 404 error page
└── server/                      # Node.js / Express backend server
    ├── package.json             # Backend dependencies & scripts
    ├── .env.example             # Template for required environment variables
    └── src/
        ├── index.js             # HTTP server entry point & Socket.IO initialization
        ├── socket.js            # Socket.IO connection handling & message events
        ├── config/
        │   ├── db.js            # MongoDB Mongoose connection handler
        │   └── scoringConfig.js # Composite score weightings and target benchmarks
        ├── controllers/
        │   ├── authController.js    # Authentication & token generation logic
        │   ├── studentController.js # Student directory, profile & comparison logic
        │   └── executeController.js # Judge0 code submission & result handling
        ├── middleware/
        │   └── authMiddleware.js    # JWT verification & route protection
        ├── models/
        │   ├── User.js          # User credentials & password hashing schema
        │   ├── Student.js       # Student details, platform handles & write-once DOB
        │   ├── StatsSnapshot.js # Historical platform metrics cache snapshots
        │   └── ChatMessage.js   # Chat message records schema
        ├── routes/
        │   ├── authRoutes.js    # /api/auth routes
        │   ├── studentRoutes.js # /api/students routes
        │   ├── contestRoutes.js # /api/contests routes
        │   └── chatRoutes.js    # /api/chat routes
        └── services/
            ├── leetcodeService.js   # LeetCode GraphQL fetcher
            ├── codeforcesService.js # Codeforces REST API fetcher
            ├── gfgService.js        # GeeksforGeeks web scraper
            ├── codechefService.js   # CodeChef web scraper
            ├── githubService.js     # GitHub REST API fetcher
            ├── contestService.js    # Multi-platform contest aggregator & cache
            ├── judge0Service.js     # Judge0 code execution client
            └── scoringService.js    # Composite score computation engine
```

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or higher)
- [npm](https://www.npmjs.com/) (v9.x or higher)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas connection URI)

### 1. Clone the Repository

```bash
git clone https://github.com/lalbabukumar12/progress-tracker.git
cd progress-tracker
```

### 2. Install Dependencies

Install all root, server, and client dependencies with a single command:

```bash
npm run install:all
```

### 3. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cp server/.env.example server/.env
```

Populate `server/.env` with your credentials:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/progress-tracker
JWT_SECRET=your_jwt_secret_key_here
GITHUB_TOKEN=your_github_personal_access_token_here
RAPIDAPI_KEY=your_rapidapi_key_for_judge0_here
CLIENT_URL=http://localhost:5173
```

### 4. Run Development Servers

Start both the Express backend and Vite client concurrently:

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API & WebSockets**: `http://localhost:5000`

---

## 🔌 Key API Endpoints

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | No | Register a new user account |
| `POST` | `/api/auth/login` | No | Authenticate user and receive JWT |
| `GET` | `/api/students` | No | List all registered students and their stats |
| `GET` | `/api/students/:id` | No | Get comprehensive stats for a specific student |
| `GET` | `/api/students/me` | **Yes** | Get the logged-in user's student profile |
| `PUT` | `/api/students/me` | **Yes** | Update the logged-in user's profile and platform handles |
| `GET` | `/api/students/compare?a=:id1&b=:id2` | No | Head-to-head comparison between two students |
| `GET` | `/api/students/monthly-top-performers`| No | Retrieve top monthly performers and most improved students |
| `POST` | `/api/students/:id/refresh-stats` | **Yes** | Force refresh live platform stats for a student |
| `GET` | `/api/contests/upcoming` | No | Get aggregated upcoming contests (supports `?refresh=true`) |
| `GET` | `/api/chat/history?room=general` | No | Retrieve recent community chat messages |
| `POST` | `/api/execute` | **Yes** | Submit code snippet to Judge0 sandbox for execution |
| `GET` | `/api/health` | No | Health check endpoint for server and connectivity status |

---

## ⚠️ Known Limitations

- **Scraping-Dependent Platforms**: **GeeksforGeeks** and **CodeChef** do not provide official public REST APIs. Data for these platforms is retrieved via HTML parsing and structured web scrapers, which may occasionally require updates if upstream layout structures change.
- **Isolated Fault Tolerance**: Each platform sync job is completely decoupled. If one platform API experiences downtime, rate limits, or connectivity issues, stats fetching gracefully records a fallback without blocking or failing the retrieval of data from other platforms.

---

## By--

- **Lalbabu Kumar**

---

*Progress Tracker &copy; 2026. Built for competitive programmers and student developers.*
