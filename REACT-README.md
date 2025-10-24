# 💣 Word Bomb Game (React Version)

A simple but elegant word game built with React.js where players must type words containing specific letter combinations before time runs out!

## 🎮 How to Play

1. Select your difficulty level:
   - **Easy**: 15 seconds per round
   - **Medium**: 10 seconds per round
   - **Hard**: 7 seconds per round

2. You'll be shown a letter combination (e.g., "AB", "CH", "ER")

3. Type a word that contains those letters before the timer runs out

4. Longer words earn more points (word length × 5 points, minimum 10)

5. You have 3 lives - lose one each time the timer runs out

6. Try to get the highest score possible!

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Create optimized production build
npm run build
```

## 📁 Project Structure

```
word-bomb-react/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── MenuScreen.js
│   │   ├── MenuScreen.css
│   │   ├── GameScreen.js
│   │   ├── GameScreen.css
│   │   ├── GameOverScreen.js
│   │   └── GameOverScreen.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## 🌐 Deployment on Netlify

### Method 1: Drag & Drop

1. Build your project: `npm run build`
2. Go to [Netlify](https://www.netlify.com/)
3. Sign up or log in
4. Drag and drop the `build` folder onto the Netlify dashboard
5. Your site will be live in seconds!

### Method 2: Git Integration

1. Push this project to a GitHub repository
2. Go to [Netlify](https://www.netlify.com/)
3. Click "New site from Git"
4. Connect your GitHub account
5. Select your repository
6. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
7. Click "Deploy site"

### Method 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod
```

## ✨ Features

- **React Hooks**: Built with modern React using useState, useEffect, and useCallback
- **Component-Based Architecture**: Clean separation of concerns
- **Three Difficulty Levels**: Choose your challenge
- **Smooth Animations**: Elegant transitions and effects
- **Responsive Design**: Works on desktop and mobile
- **Score Tracking**: Points based on word length
- **Lives System**: 3 chances to keep playing
- **Used Words Tracker**: See all the words you've found
- **Visual Timer**: Animated countdown bar
- **Instant Feedback**: Clear success/error messages

## 🎨 Design Highlights

- Modern gradient background
- Glassmorphism card design
- Smooth animations and transitions
- Responsive layout for all devices
- Accessible color scheme
- Clean, minimalist interface

## 🛠️ Technologies Used

- React 18.2.0
- React Hooks (useState, useEffect, useCallback, useRef)
- CSS3 (with animations and transitions)
- Modern JavaScript (ES6+)

## 📝 Game Rules

- Words must be at least 3 letters long
- Words must contain the given letter combination
- Each word can only be used once per game
- Case doesn't matter (WORD = word = WoRd)

## 🎯 Tips for High Scores

- Think of longer words for more points
- Common letter combinations like "ER", "IN", "TH" have many word options
- Don't panic - you have time to think!
- Practice makes perfect!

## 🔧 Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## 📄 License

Free to use and modify. Have fun!

## 🤝 Contributing

Feel free to fork this project and add your own features:
- Dictionary API integration for word validation
- Multiplayer mode
- Leaderboard system
- Sound effects
- More letter combinations
- Power-ups and bonuses
- Local storage for high scores

Enjoy playing Word Bomb! 💣✨
